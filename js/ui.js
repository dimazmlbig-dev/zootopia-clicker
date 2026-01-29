window.UI = (() => {
  let saveTimer = null;

  function renderTop() {
    const s = window.State.get();
    document.getElementById("uiBones").textContent = String(s.bones);
    document.getElementById("uiZoo").textContent = String(s.zoo);
  }

  function renderClicker() {
    const s = window.State.get();
    const txt = document.getElementById("uiEnergyText");
    const bar = document.getElementById("uiEnergyBar");
    if (txt && bar) {
      txt.textContent = `${s.energy} / ${s.maxEnergy}`;
      const pct = Math.max(0, Math.min(100, (s.energy / s.maxEnergy) * 100));
      bar.style.width = pct.toFixed(1) + "%";
    }

    const mineAvail = document.getElementById("uiMineAvail");
    const mineInfo = document.getElementById("uiMineInfo");
    if (mineAvail) mineAvail.textContent = String(window.Mining.available());
    if (mineInfo) {
      const rate = window.Mining.ratePerSec(s.mining.level);
      const nextCost = window.Mining.upgradeCost(s.mining.level);
      mineInfo.textContent = `Скорость: ${rate} $ZOO/сек • Уровень: ${s.mining.level} • Улучшение: ${nextCost} $ZOO`;
    }

    const refCode = document.getElementById("uiRefCode");
    const refLink = document.getElementById("uiRefLink");
    if (refCode) refCode.textContent = s.refCode;

    // если бот другой — поменяй здесь:
    const bot = "zooclikbot";
    const link = `https://t.me/${bot}?start=ref_${s.refCode}`;
    if (refLink) refLink.textContent = link;
  }

  function renderTasks() {
    const root = document.getElementById("page-tasks");
    if (!root) return;

    const s = window.State.get();
    const tasks = window.Tasks.list();

    root.innerHTML = `
      <div class="card">
        <div class="h1">Задания</div>
        <div class="muted">Выполняй задания и забирай награды.</div>
        <div class="sep"></div>
        <div class="muted">Тапов всего: <b>${s.tapsTotal || 0}</b></div>
      </div>
      <div id="taskList"></div>
    `;

    const list = root.querySelector("#taskList");
    list.innerHTML = tasks.map(t => {
      const done = window.Tasks.isDone(t.id);
      const can = (s.tapsTotal || 0) >= t.need;
      const label = done ? "Выполнено" : (can ? `Забрать +${t.rewardZoo} $ZOO` : `Нужно ${t.need} тапов`);
      return `
        <div class="card">
          <div style="font-weight:900">${t.title}</div>
          <div class="muted">Награда: ${t.rewardZoo} $ZOO</div>
          <div class="sep"></div>
          <button class="btn ${done ? "btn--ghost" : "btn--primary"}" data-claim="${t.id}" ${done || !can ? "disabled" : ""}>
            ${label}
          </button>
        </div>
      `;
    }).join("");

    root.querySelectorAll("[data-claim]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-claim");
        window.Tasks.claim(id);
      });
    });
  }

  async function renderNft() {
    await window.NFT.render();
  }

  function renderWallet() {
    window.WalletPage.render();
  }

  function showPage(name) {
    const pages = ["clicker", "nft", "tasks", "wallet"];
    pages.forEach(p => {
      const el = document.getElementById(`page-${p}`);
      if (!el) return;
      el.classList.toggle("hidden", p !== name);
    });

    document.querySelectorAll(".nav-btn").forEach(btn => {
      btn.classList.toggle("active", btn.getAttribute("data-page") === name);
    });

    // render on demand
    if (name === "clicker") renderClicker();
    if (name === "tasks") renderTasks();
    if (name === "nft") renderNft();
    if (name === "wallet") renderWallet();
  }

  function bindNav() {
    document.querySelectorAll(".nav-btn").forEach(btn => {
      btn.addEventListener("click", () => showPage(btn.getAttribute("data-page")));
    });

    const btnWallet = document.getElementById("btnWallet");
    if (btnWallet) btnWallet.addEventListener("click", () => showPage("wallet"));
  }

  function scheduleSave() {
    if (saveTimer) return;
    saveTimer = setTimeout(() => {
      saveTimer = null;
      window.State.save();
    }, 800);
  }

  function shareReferral() {
    const s = window.State.get();
    const bot = "zooclikbot";
    const link = `https://t.me/${bot}?start=ref_${s.refCode}`;

    // Telegram share
    const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
    if (tg) {
      tg.openTelegramLink(`https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Заходи в игру!")}`);
      return;
    }

    // fallback
    navigator.clipboard?.writeText(link).then(() => alert("Ссылка скопирована"));
  }

  return {
    renderTop, renderClicker, renderTasks, renderNft, renderWallet,
    bindNav, showPage, scheduleSave, shareReferral
  };
})();