// js/ui.js
(function () {
  function $(sel, root = document) { return root.querySelector(sel); }

  function format(n) {
    return (Math.round(n * 100) / 100).toString();
  }

  function moodLabel(m) {
    if (m === "happy") return "happy";
    if (m === "tired") return "tired";
    if (m === "angry") return "angry";
    return m || "happy";
  }

  function setImgOrHide(imgEl, src) {
    imgEl.src = src;
    imgEl.onerror = () => { imgEl.style.display = "none"; };
    imgEl.onload = () => { imgEl.style.display = ""; };
  }

  function clickScreenHTML(s) {
    return `
      <div class="hud">
        <div class="hud__top">
          <div class="pill pill--user">
            <span class="pill__emoji">🐶</span>
            <span id="uiPlayerName">${s.user.name || "Игрок"}</span>
          </div>
          <div class="pill pill--id">ID: <span id="uiPlayerId">${s.user.id ?? "-"}</span></div>
        </div>

        <div class="hud__sub">
          Настроение: <b id="uiMood">${moodLabel(s.mood)}</b> • Множитель: <b id="uiMult">x${format(s.multiplier)}</b>
        </div>
      </div>

      <div class="dog-stage" id="dogStage">
        <div class="dog-wrap dog-idle" id="dogWrap" data-mood="${s.mood}">
          <img class="dog-img" id="dogImg" src="assets/dog.png" alt="dog" draggable="false"/>

          <img class="nft-layer nft-glasses" id="nftGlasses" alt="glasses" draggable="false"/>
          <img class="nft-layer nft-hat" id="nftHat" alt="hat" draggable="false"/>
          <img class="nft-layer nft-collar" id="nftCollar" alt="collar" draggable="false"/>
        </div>
      </div>

      <div class="card energy-card">
        <div class="energy-head">
          <div class="energy-title">ЭНЕРГИЯ</div>
          <div class="energy-val"><span id="uiEnergy">${Math.floor(s.energy)}</span> / <span id="uiEnergyMax">${Math.floor(s.energyMax)}</span></div>
        </div>

        <div class="energy-bar">
          <div class="energy-fill" id="uiEnergyFill" style="width:${Math.max(0, Math.min(100, (s.energy / s.energyMax) * 100))}%;"></div>
        </div>

        <div class="chips">
          <div class="chip"><span class="chip__emoji">🙂</span> <span id="uiMoodChip">${moodLabel(s.mood)}</span></div>
          <div class="chip"><span class="chip__emoji">🧠</span> <span>loyal</span></div>
          <div class="chip"><span class="chip__emoji">🪙</span> <span id="uiBalance">${Math.floor(s.balance)} $ZOO</span></div>
        </div>
      </div>
    `;
  }

  function placeholderScreenHTML(title) {
    return `
      <div class="card" style="margin-top:18px;">
        <div style="font-size:20px; font-weight:800; margin-bottom:6px;">${title}</div>
        <div style="opacity:.75;">Пока заглушка. Сделаем после клика/AI.</div>
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
    const mood = $("#uiMood");
    const moodChip = $("#uiMoodChip");
    const mult = $("#uiMult");

    if (e) e.textContent = Math.floor(s.energy);
    if (em) em.textContent = Math.floor(s.energyMax);
    if (ef) ef.style.width = `${Math.max(0, Math.min(100, (s.energy / s.energyMax) * 100))}%`;
    if (b) b.textContent = `${Math.floor(s.balance)} $ZOO`;
    if (mood) mood.textContent = moodLabel(s.mood);
    if (moodChip) moodChip.textContent = moodLabel(s.mood);
    if (mult) mult.textContent = `x${format(s.multiplier)}`;
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
      screen.innerHTML = placeholderScreenHTML("Задания");
    } else if (s.tab === "nft") {
      screen.innerHTML = placeholderScreenHTML("NFT");
    } else if (s.tab === "wallet") {
      screen.innerHTML = placeholderScreenHTML("Кошелёк");
    } else {
      screen.innerHTML = placeholderScreenHTML("Экран");
    }
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
      if (s.tab === "click" && $("#uiEnergyFill")) {
        updateCountersOnly(s);
        applyNftLayers(s);
      }
    });
  }
})();