// js/ui.js
(function () {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    try { tg.ready(); } catch (_) {}
  }

  function getUser() {
    const u = tg?.initDataUnsafe?.user;
    const id = u?.id ? String(u.id) : "guest";
    const name = (u?.first_name || u?.username || "Игрок");
    return { id, name };
  }

  const user = getUser();
  const STORAGE_KEY = `zoo_state_${user.id}`;

  const DEFAULT_STATE = {
    userId: user.id,
    userName: user.name,
    balance: 0,
    energy: 1000,
    energyMax: 1000,
    mood: "happy",
    multiplier: 1.0,
    lastTapAt: 0,
    equipped: {
      glasses: null,
      hat: null,
      collar: null
    }
  };

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return { ...DEFAULT_STATE };
      const parsed = JSON.parse(raw);
      return {
        ...DEFAULT_STATE,
        ...parsed,
        userId: user.id,
        userName: user.name
      };
    } catch (_) {
      return { ...DEFAULT_STATE };
    }
  }

  function saveState() {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); } catch (_) {}
  }

  let state = loadState();

  const screen = document.getElementById("screen");
  const tabs = Array.from(document.querySelectorAll(".tab"));

  function setActiveTab(tabName) {
    tabs.forEach((b) => {
      const is = b.dataset.tab === tabName;
      b.classList.toggle("active", is);
      b.classList.toggle("is-active", is);
    });
  }

  function fmt(n) {
    return String(Math.floor(n));
  }

  function renderClick() {
    return `
      <div class="topbar">
        <div class="pill user-pill">🐶 <span>${escapeHtml(state.userName)}</span></div>
        <div class="pill">ID: <span>${escapeHtml(state.userId)}</span></div>
      </div>

      <div class="subtitle">Настроение: <b>${escapeHtml(state.mood)}</b> • Множитель: <b>x${state.multiplier.toFixed(2)}</b></div>

      <div class="center">
        <div class="dog-stage" id="dogStage">
          <img class="dog-base" id="dogBase" src="assets/dog.png" alt="dog" draggable="false" />
          <div class="dog-overlay" id="dogOverlay"></div>
        </div>
      </div>

      <div class="card">
        <div class="row">
          <div class="label">ЭНЕРГИЯ</div>
          <div class="value"><span id="energyVal">${fmt(state.energy)}</span> / ${fmt(state.energyMax)}</div>
        </div>
        <div class="bar">
          <div class="bar__fill" id="energyFill" style="width:${pct(state.energy, state.energyMax)}%"></div>
        </div>
        <div class="chips">
          <div class="chip">😊 <span id="moodVal">${escapeHtml(state.mood)}</span></div>
          <div class="chip">🧠 loyal</div>
          <div class="chip">🪙 <b id="balVal">${fmt(state.balance)}</b> $ZOO</div>
        </div>
      </div>
    `;
  }

  function renderStub(title) {
    return `
      <div class="topbar">
        <div class="pill user-pill">🐶 <span>${escapeHtml(state.userName)}</span></div>
        <div class="pill">ID: <span>${escapeHtml(state.userId)}</span></div>
      </div>
      <div class="card">
        <div class="label">${escapeHtml(title)}</div>
        <div class="subtitle" style="margin-top:8px; opacity:.9">Сделаем позже. Сейчас фиксируем основу.</div>
      </div>
    `;
  }

  function show(tabName) {
    if (!screen) return;

    setActiveTab(tabName);

    if (tabName === "click") screen.innerHTML = renderClick();
    else if (tabName === "tasks") screen.innerHTML = renderStub("Задания");
    else if (tabName === "nft") screen.innerHTML = renderStub("NFT");
    else if (tabName === "wallet") screen.innerHTML = renderStub("Кошелёк");
    else screen.innerHTML = renderClick();

    if (tabName === "click") bindClickScreen();
  }

  function bindClickScreen() {
    const stage = document.getElementById("dogStage");
    const dog = document.getElementById("dogBase");
    const energyVal = document.getElementById("energyVal");
    const energyFill = document.getElementById("energyFill");
    const balVal = document.getElementById("balVal");

    if (!stage || !dog) return;

    stage.addEventListener("pointerdown", (e) => {
      e.preventDefault();

      // если энергии нет — просто "тут-тук"
      if (state.energy <= 0) {
        bump(stage);
        return;
      }

      // логика клика
      const gain = Math.max(1, Math.round(1 * state.multiplier));
      state.balance += gain;
      state.energy -= 1;
      state.lastTapAt = Date.now();
      saveState();

      // UI update
      if (energyVal) energyVal.textContent = fmt(state.energy);
      if (energyFill) energyFill.style.width = `${pct(state.energy, state.energyMax)}%`;
      if (balVal) balVal.textContent = fmt(state.balance);

      // эффекты
      bump(stage);
      floatZOO(stage, e.clientX, e.clientY, `+$${gain} ZOO`);

      // лёгкая вибрация устройства
      try { navigator.vibrate?.(10); } catch (_) {}
    }, { passive: false });
  }

  function bump(stage) {
    stage.classList.remove("tapping");
    // reflow чтобы класс точно сработал повторно
    void stage.offsetWidth;
    stage.classList.add("tapping");
    setTimeout(() => stage.classList.remove("tapping"), 180);
  }

  function floatZOO(stage, clientX, clientY, text) {
    const rect = stage.getBoundingClientRect();
    const x = clamp(clientX - rect.left, 0, rect.width);
    const y = clamp(clientY - rect.top, 0, rect.height);

    const el = document.createElement("div");
    el.className = "float-zoo";
    el.textContent = text;

    // лёгкий рандом чтобы не наслаивалось
    const jitterX = (Math.random() * 26 - 13);
    const jitterY = (Math.random() * 18 - 9);

    el.style.left = `${x + jitterX}px`;
    el.style.top = `${y + jitterY}px`;

    stage.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
    setTimeout(() => el.remove(), 1200);
  }

  function pct(v, max) {
    if (!max) return 0;
    return Math.max(0, Math.min(100, (v / max) * 100));
  }

  function clamp(n, a, b) { return Math.max(a, Math.min(b, n)); }

  function escapeHtml(str) {
    return String(str)
      .replaceAll("&", "&amp;")
      .replaceAll("<", "&lt;")
      .replaceAll(">", "&gt;")
      .replaceAll('"', "&quot;")
      .replaceAll("'", "&#039;");
  }

  // Экспорт
  window.UI = { show };

  // Авто-старт на вкладке, которая уже отмечена в HTML
  const initial =
    tabs.find(t => t.classList.contains("is-active") || t.classList.contains("active"))?.dataset.tab
    || "click";

  show(initial);
})();