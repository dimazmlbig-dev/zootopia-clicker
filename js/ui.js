// js/ui.js
(function () {
  function $(sel, root = document) { return root.querySelector(sel); }

  function format(n) {
    return (Math.round(n * 100) / 100).toString();
  }

  function shortId(id) {
    if (!id) return "-";
    const str = String(id);
    if (str.length <= 6) return str;
    return `…${str.slice(-6)}`;
  }

  function setImgOrHide(imgEl, src) {
    imgEl.src = src;
    imgEl.onerror = () => { imgEl.style.display = "none"; };
    imgEl.onload = () => { imgEl.style.display = ""; };
  }

  const AI_SYSTEM_PROMPT = "Ты помощник внутри игры-кликера. Отвечай коротко и по делу, без воды. Не выдумывай значения, если их нет.";
  const AI_MAX_CHARS = 500;

  function formatUpgrades(upgrades) {
    if (!upgrades) return "";
    if (Array.isArray(upgrades)) {
      return upgrades.map((item) => String(item)).filter(Boolean).join(", ");
    }
    if (typeof upgrades === "object") {
      const items = [];
      Object.entries(upgrades).forEach(([key, value]) => {
        if (value === null || value === undefined) return;
        if (typeof value === "boolean") {
          if (value) items.push(key);
          return;
        }
        if (typeof value === "object") {
          if (typeof value.level === "number") {
            items.push(`${key}: ур. ${value.level}`);
            return;
          }
          if (typeof value.value === "number") {
            items.push(`${key}: ${value.value}`);
            return;
          }
          if (typeof value.amount === "number") {
            items.push(`${key}: ${value.amount}`);
            return;
          }
        }
        items.push(`${key}: ${value}`);
      });
      return items.join(", ");
    }
    return String(upgrades);
  }

  function buildAiPrompt(question) {
    const s = window.State?.data;
    const contextLines = [];

    if (s) {
      if (typeof s.balance === "number") {
        contextLines.push(`Баланс: ${Math.floor(s.balance)} ZOO`);
      }
      if (typeof s.energy === "number" && typeof s.energyMax === "number") {
        contextLines.push(`Энергия: ${Math.floor(s.energy)} / ${Math.floor(s.energyMax)}`);
      }
      if (typeof s.level === "number") {
        let levelLine = `Уровень: ${s.level}`;
        if (typeof s.levelProgress === "number") {
          levelLine += ` (прогресс ${Math.round(s.levelProgress * 100)}%)`;
        }
        contextLines.push(levelLine);
      }
      if (s.upgrades) {
        const upgrades = formatUpgrades(s.upgrades);
        if (upgrades) contextLines.push(`Апгрейды: ${upgrades}`);
      }
    }

    const contextText = contextLines.length ? contextLines.join("\n") : "нет данных";
    return `${AI_SYSTEM_PROMPT}\n\nКонтекст игры:\n${contextText}\n\nВопрос игрока:\n${question}\n\nОтветь кратко и применимо к игре.`;
  }

  function setupAiModal() {
    if (document.getElementById("aiModal")) return;

    const modal = document.createElement("div");
    modal.className = "ai-modal";
    modal.id = "aiModal";
    modal.setAttribute("aria-hidden", "true");
    modal.innerHTML = `
      <div class="ai-modal__backdrop" data-ai-close="true"></div>
      <div class="ai-modal__panel" role="dialog" aria-modal="true" aria-labelledby="aiModalTitle">
        <div class="ai-modal__header">
          <div>
            <div class="ai-modal__title" id="aiModalTitle">AI</div>
            <div class="ai-modal__sub">Спроси у ИИ…</div>
          </div>
          <button class="ai-close" type="button" data-ai-close="true">Закрыть</button>
        </div>
        <textarea class="ai-input" id="aiPromptModal" rows="4" placeholder="Спроси у ИИ…"></textarea>
        <div class="ai-modal__actions">
          <button class="ai-btn" id="aiSend" type="button">Отправить</button>
          <div class="ai-loading" id="aiLoading" hidden>Думаю…</div>
        </div>
        <div class="ai-response" id="aiResponseModal"></div>
      </div>
    `;
    document.body.appendChild(modal);

    const promptEl = modal.querySelector("#aiPromptModal");
    const sendBtn = modal.querySelector("#aiSend");
    const responseEl = modal.querySelector("#aiResponseModal");
    const loadingEl = modal.querySelector("#aiLoading");
    let isLoading = false;

    function setLoading(loading) {
      isLoading = loading;
      if (sendBtn) sendBtn.disabled = loading;
      if (loadingEl) loadingEl.hidden = !loading;
    }

    function open() {
      modal.classList.add("is-open");
      modal.setAttribute("aria-hidden", "false");
      requestAnimationFrame(() => {
        promptEl?.focus();
      });
    }

    function close() {
      modal.classList.remove("is-open");
      modal.setAttribute("aria-hidden", "true");
    }

    modal.querySelectorAll("[data-ai-close]").forEach((el) => {
      el.addEventListener("click", close);
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && modal.classList.contains("is-open")) {
        close();
      }
    });

    sendBtn?.addEventListener("click", async () => {
      if (isLoading) return;
      const raw = String(promptEl?.value || "");
      const question = raw.trim();
      if (!question) {
        if (responseEl) responseEl.textContent = "Введите вопрос.";
        return;
      }
      if (question.length > AI_MAX_CHARS) {
        if (responseEl) responseEl.textContent = `Слишком длинный вопрос (макс ${AI_MAX_CHARS} символов).`;
        return;
      }
      if (promptEl) promptEl.value = question;
      if (responseEl) responseEl.textContent = "";
      setLoading(true);
      try {
        const prompt = buildAiPrompt(question);
        const reply = await window.AI?.askAI?.(prompt);
        if (responseEl) {
          responseEl.textContent = reply || "Пустой ответ от ИИ.";
        }
      } catch (err) {
        if (responseEl) {
          responseEl.textContent = err?.message || "Ошибка запроса.";
        }
      } finally {
        setLoading(false);
      }
    });

    return { open };
  }

  function clickScreenHTML(s) {
    return `
      <div class="click-layout">
        <div class="click-top">
          <div class="info-card">
            <div class="info-label">ID игрока</div>
            <div class="info-value" id="uiPlayerId">${shortId(s.user.id)}</div>
          </div>
          <div class="info-card info-card--balance">
            <div class="info-label">Zoo Coins</div>
            <div class="info-value"><span id="uiBalance">${Math.floor(s.balance)}</span> ZOO</div>
          </div>
          <button class="audio-toggle" id="audioToggle" type="button">Музыка: Вкл</button>
        </div>

        <div class="dog-center">
          <div class="dog-stage" id="dogStage">
            <div class="dog-wrap dog-idle" id="dogWrap" data-mood="${s.mood}">
              <img class="dog-img" id="dogImg" src="assets/dog.png" alt="dog" draggable="false"/>

              <img class="nft-layer nft-glasses" id="nftGlasses" alt="glasses" draggable="false"/>
              <img class="nft-layer nft-hat" id="nftHat" alt="hat" draggable="false"/>
              <img class="nft-layer nft-collar" id="nftCollar" alt="collar" draggable="false"/>
            </div>
          </div>
        </div>

        <div class="bars bars--bottom bars--fixed">
          <div class="bar-block">
            <div class="bar-row">
              <span>Энергия</span>
              <span><span id="uiEnergy">${Math.floor(s.energy)}</span> / <span id="uiEnergyMax">${Math.floor(s.energyMax)}</span></span>
            </div>
            <div class="progress-bar">
              <i id="uiEnergyFill" style="width:${Math.max(0, Math.min(100, (s.energy / s.energyMax) * 100))}%;"></i>
            </div>
          </div>

          <div class="bar-block">
            <div class="bar-row">
              <span>Уровень</span>
              <span id="uiLevelText">${s.level}</span>
            </div>
            <div class="progress-bar is-level">
              <i id="uiLevelFill" style="width:${Math.max(0, Math.min(100, (s.levelProgress || 0) * 100))}%;"></i>
            </div>
          </div>
        </div>
      </div>
    `;
  }
  
  function bonusesScreenHTML() {
    return `
      <div class="section">
        <div class="section__head">
          <h2>Бонусы</h2>
          <p>Ежедневные бонусы и мини-игры.</p>
          <button class="audio-toggle" id="audioToggle" type="button">Музыка: Вкл</button>
        </div>
        <div class="bonus-tabs" role="tablist">
          <button class="bonus-tab is-active" data-bonus-tab="rewards" type="button">Бонусы</button>
          <button class="bonus-tab" data-bonus-tab="match3" type="button">3 в ряд</button>
          <button class="bonus-tab" data-bonus-tab="wheel" type="button">Колесо фортуны</button>
        </div>
        <div class="bonus-panel is-active" data-bonus-panel="rewards">
          <div class="list">
            <div class="list-item">
              <div>
                <div class="list-title">Ежедневный вход</div>
                <div class="list-sub">Заберите бонус за активность.</div>
              </div>
              <div class="list-meta">Ожидает ИИ</div>
            </div>
            <div class="list-item">
              <div>
                <div class="list-title">Поделиться кликами</div>
                <div class="list-sub">Сделайте 50 кликов за день.</div>
              </div>
              <div class="list-meta">В очереди</div>
            </div>
            <div class="list-item">
              <div>
                <div class="list-title">Пригласить друга</div>
                <div class="list-sub">ИИ проверит приглашение по ссылке.</div>
              </div>
              <div class="list-meta">Новый</div>
            </div>
          </div>
        </div>
        <div class="bonus-panel" data-bonus-panel="match3">
          <div class="match3-card" id="match3Game">
            <div class="match3-header">
              <div>
                <div class="match3-title">Zoo Match • 3 в ряд</div>
                <div class="match3-sub">Собирайте зверушек, получайте комбо и зоокоины.</div>
              </div>
              <div class="match3-actions">
                <div class="match3-level">Уровень <span id="matchLevel">1</span></div>
                <button class="match3-fullscreen" id="matchFullscreen" type="button">На весь экран</button>
              </div>
            </div>
            <div class="match3-progress">
              <div class="progress-bar is-level">
                <i id="matchProgress" style="width:0%;"></i>
              </div>
              <div class="match3-progress-text">
                Очки: <span id="matchScore">0</span>/<span id="matchTarget">120</span>
                <span class="match3-combo" id="matchCombo">Комбо x1</span>
              </div>
            </div>
            <div id="matchBoard" class="match3-board" aria-label="Поле 3 в ряд"></div>
            <div class="match3-footer">
              <div class="match3-reward">Награда: <span id="matchReward">60</span> ZOO</div>
              <button class="match3-reset" id="matchReset" type="button">Перемешать</button>
            </div>
          </div>
        </div>
        <div class="bonus-panel" data-bonus-panel="wheel">
          <div class="wheel-card">
            <div class="wheel-header">
              <div>
                <div class="wheel-title">Колесо фортуны</div>
                <div class="wheel-sub">Испытайте удачу и получите ZOO-коины.</div>
              </div>
              <div class="wheel-attempts" id="wheelAttempts"></div>
            </div>
            <div class="wheel-body">
              <div class="wheel-stage">
                <canvas id="wheelCanvas" width="280" height="280" aria-label="Колесо фортуны"></canvas>
                <div class="wheel-pointer" aria-hidden="true"></div>
              </div>
              <div class="wheel-actions">
                <button class="wheel-spin" id="wheelSpin" type="button">Крутить</button>
                <button class="wheel-pay" id="wheelPay" type="button">Оплатить попытку</button>
              </div>
              <div class="wheel-meta">
                <div id="wheelStatus">3 бесплатные попытки в день</div>
                <div class="wheel-price">20 ₽ ≈ <span id="wheelTon">...</span> TON</div>
                <div class="wheel-wallet">TON кошелёк: <span id="wheelWallet">—</span></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;
  }

  function nftScreenHTML() {
    return `
      <div class="section">
        <div class="section__head">
          <h2>NFT</h2>
          <p>Уникальные NFT можно выставлять и покупать между участниками.</p>
        </div>
        <div class="list">
          <div class="list-item">
            <div>
              <div class="list-title">Мой инвентарь</div>
              <div class="list-sub">Покажем ваши активы и редкость.</div>
            </div>
            <div class="list-meta">0 шт.</div>
          </div>
          <div class="list-item">
            <div>
              <div class="list-title">Рынок NFT</div>
              <div class="list-sub">Последние продажи и предложения.</div>
            </div>
            <div class="list-meta">Открыть</div>
          </div>
          <div class="list-item">
            <div>
              <div class="list-title">Создать листинг</div>
              <div class="list-sub">Выставить NFT за Zoo Coins.</div>
            </div>
            <div class="list-meta">Скоро</div>
          </div>
        </div>
      </div>
    `;
  }

  function marketScreenHTML() {
    return `
      <div class="section">
        <div class="section__head">
          <h2>Market</h2>
          <p>Загрузка маркетплейса…</p>
        </div>
      </div>
    `;
  }

  function walletScreenHTML(s) {
    return `
      <div class="section">
        <div class="section__head">
          <h2>Кошелёк</h2>
          <p>Баланс, TON и обмен Zoo Coins.</p>
        </div>
        <div class="wallet-grid">
          <div class="wallet-card">
            <div class="wallet-label">Zoo Coins</div>
            <div class="wallet-value"><span id="uiWalletZoo">${Math.floor(s.balance)}</span> ZOO</div>
          </div>
          <div class="wallet-card">
            <div class="wallet-label">TON</div>
            <div class="wallet-value"><span id="uiWalletTon">${format(s.tonBalance)}</span> TON</div>
          </div>
        </div>
        <div class="exchange">
          <div>
            <div class="exchange-title">Обменять ZOO</div>
            <div class="exchange-sub">Курс и комиссии настроим позже.</div>
          </div>
          <button class="exchange-btn" type="button">Сделать обмен</button>
        </div>
      </div>
    `;
  }

  let aiModalApi = null;

  function renderTabs(active) {
    document.querySelectorAll(".tab").forEach((btn) => {
      if (btn.dataset.tab === "ai") {
        btn.classList.remove("is-active");
        return;
      }
      btn.classList.toggle("is-active", btn.dataset.tab === active);
    });
  }

  function applyNftLayers(s) {
    const g = $("#nftGlasses");
    const h = $("#nftHat");
    const c = $("#nftCollar");
    if (!g || !h || !c) return;

    // пути по твоей структуре:
    // assets/nft/glasses.png, assets/nft/hat.png, assets/nft/collar.png
    if (s.nftEquipped?.glasses) setImgOrHide(g, "assets/nft/glasses.png"); else g.style.display = "none";
    if (s.nftEquipped?.hat) setImgOrHide(h, "assets/nft/hat.png"); else h.style.display = "none";
    if (s.nftEquipped?.collar) setImgOrHide(c, "assets/nft/collar.png"); else c.style.display = "none";
  }

  function setDogMood(mood) {
    const wrap = $("#dogWrap");
    if (!wrap) return;
    wrap.dataset.mood = mood || "happy";
  }

  function updateCountersOnly(s) {
    const e = $("#uiEnergy");
    const em = $("#uiEnergyMax");
    const ef = $("#uiEnergyFill");
    const b = $("#uiBalance");
    const levelText = $("#uiLevelText");
    const levelFill = $("#uiLevelFill");
    const walletZoo = $("#uiWalletZoo");
    const walletTon = $("#uiWalletTon");

    if (e) e.textContent = Math.floor(s.energy);
    if (em) em.textContent = Math.floor(s.energyMax);
    if (ef) ef.style.width = `${Math.max(0, Math.min(100, (s.energy / s.energyMax) * 100))}%`;
    if (b) b.textContent = `${Math.floor(s.balance)}`;
    if (levelText) levelText.textContent = `${s.level}`;
    if (levelFill) levelFill.style.width = `${Math.max(0, Math.min(100, (s.levelProgress || 0) * 100))}%`;
    if (walletZoo) walletZoo.textContent = `${Math.floor(s.balance)}`;
    if (walletTon) walletTon.textContent = format(s.tonBalance || 0);
    setDogMood(s.mood);
  }

  function spawnFloat(text, x, y) {
    const stage = $("#dogStage");
    if (!stage) return;

    const rect = stage.getBoundingClientRect();
    const el = document.createElement("div");
    el.className = "float-zoo";
    el.textContent = text;

    // координаты внутри stage
    const rx = x - rect.left;
    const ry = y - rect.top;

    el.style.left = `${rx}px`;
    el.style.top = `${ry}px`;

    stage.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }

  function dogTapAnim() {
    const wrap = $("#dogWrap");
    if (!wrap) return;
    wrap.classList.remove("dog-tap");
    // reflow to restart animation
    void wrap.offsetWidth;
    wrap.classList.add("dog-tap");
  }

  function render() {
    const s = window.State?.data;
    if (!s) return;

    const screen = $("#screen");
    if (!screen) return;

    renderTabs(s.tab);

    if (s.tab === "click") {
      screen.innerHTML = clickScreenHTML(s);
      applyNftLayers(s);
      setDogMood(s.mood);
    } else if (s.tab === "tasks") {
      screen.innerHTML = bonusesScreenHTML();
      window.Bonuses?.init?.();
    } else if (s.tab === "nft") {
      screen.innerHTML = nftScreenHTML();
    } else if (s.tab === "market") {
      screen.innerHTML = marketScreenHTML();
      window.Market?.mount?.(screen);
    } else if (s.tab === "wallet") {
      screen.innerHTML = walletScreenHTML(s);
    } else {
      screen.innerHTML = bonusesScreenHTML();
    }

    window.AudioFX?.bindToggle?.();
  }

  function setTab(tab) {
    window.State.update((s) => { s.tab = tab; });
    render();
  }

  function bindTabs() {
    document.querySelectorAll(".tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab;
        if (tab === "ai") {
          aiModalApi?.open?.();
          return;
        }
        if (tab) setTab(tab);
      });
    });
  }

  window.UI = {
    init() {
      aiModalApi = setupAiModal();
      bindTabs();
      render();
    },

    // ВОТ ЭТО НУЖНО app.js — чтобы не было ошибки UI.render is not a function
    render,

    setTab,

    updateCountersOnly,

    spawnFloat,
    dogTapAnim,
  };

  // авто-обновление при изменении State
  if (window.State?.on) {
    window.State.on((s) => {
      // если мы на click-экране и он уже отрендерен — обновляем без полной перерисовки
      if ((s.tab === "click" && $("#uiEnergyFill")) || (s.tab === "wallet" && $("#uiWalletZoo"))) {
        updateCountersOnly(s);
        applyNftLayers(s);
      }
    });
  }
})();
