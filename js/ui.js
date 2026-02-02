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

        <div class="bars bars--bottom">
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
  
  function tasksScreenHTML() {
    return `
      <div class="section">
        <div class="section__head">
          <h2>Задания</h2>
          <p>Назначаются и проверяются ИИ Y.Cloud.</p>
          <button class="audio-toggle" id="audioToggle" type="button">Музыка: Вкл</button>
        </div>
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
        <div class="match3-card">
          <div class="match3-header">
            <div>
              <div class="match3-title">Zoo Match • 3 в ряд</div>
              <div class="match3-sub">Собирайте зверушек, получайте комбо и зоокоины.</div>
            </div>
            <div class="match3-level">Уровень <span id="matchLevel">1</span></div>
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
        <div class="ai-card">
          <div class="ai-header">
            <div>
              <div class="ai-title">Zoo AI • Y.Cloud</div>
              <div class="ai-sub">Спросите у ИИ идею для задания или подсказку по игре.</div>
            </div>
          </div>
          <div class="ai-body">
            <textarea id="aiPrompt" class="ai-input" rows="3" placeholder="Например: придумай ежедневное задание для игроков"></textarea>
            <div class="ai-actions">
              <button class="ai-btn" id="aiAsk" type="button">Спросить</button>
              <div class="ai-status" id="aiStatus">Добавьте ключ для запросов.</div>
            </div>
            <div class="ai-response" id="aiResponse"></div>
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

  function renderTabs(active) {
    document.querySelectorAll(".tab").forEach((btn) => {
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
      screen.innerHTML = tasksScreenHTML();
      window.Tasks?.init?.();
    } else if (s.tab === "nft") {
      screen.innerHTML = nftScreenHTML();
    } else if (s.tab === "wallet") {
      screen.innerHTML = walletScreenHTML(s);
    } else {
      screen.innerHTML = tasksScreenHTML();
    }

    window.AudioFX?.bindToggle?.();
  }

  function setTab(tab) {
    window.State.update((s) => { s.tab = tab; });
    render();
  }

  function bindTabs() {
    document.querySelectorAll(".tab").forEach((btn) => {
      btn.addEventListener("click", () => setTab(btn.dataset.tab));
    });
  }

  window.UI = {
    init() {
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
