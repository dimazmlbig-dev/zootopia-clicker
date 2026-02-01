// js/ui.js
(() => {
  const UI = {};
  const els = {};

  function $(id) {
    return document.getElementById(id);
  }

  UI.init = function init() {
    els.screen = $("screen");
    els.app = $("app");
    els.tabs = Array.from(document.querySelectorAll(".tab"));

    // Если вдруг init вызвали раньше — не ломаемся
    if (!els.screen) return;

    // Клики по табам
    els.tabs.forEach((btn) => {
      btn.addEventListener("click", () => {
        const tab = btn.dataset.tab || "click";
        UI.setActiveTab(tab);

        // Сообщаем приложению (если оно слушает)
        if (window.APP && typeof window.APP.onTabChange === "function") {
          window.APP.onTabChange(tab);
        } else {
          // fallback: просто перерендерим
          UI.render({ activeTab: tab });
        }
      });
    });
  };

  UI.setActiveTab = function setActiveTab(tab) {
    if (!els.tabs) els.tabs = Array.from(document.querySelectorAll(".tab"));
    els.tabs.forEach((b) => b.classList.toggle("is-active", b.dataset.tab === tab));
  };

  UI.render = function render(state) {
    // ленивый init
    if (!els.screen) UI.init();
    if (!els.screen) return;

    const s =
      state ||
      (window.State && typeof window.State.get === "function" ? window.State.get() : null) ||
      window.APP_STATE ||
      {};

    const tab = s.activeTab || document.querySelector(".tab.is-active")?.dataset?.tab || "click";
    UI.setActiveTab(tab);

    const tpl = UI.templates[tab] || UI.templates.click;
    els.screen.innerHTML = tpl(s);
  };

  UI.templates = {
    click: (s) => {
      const user = s.user?.name || "Дмитрий";
      const mood = s.mood || "happy";
      const mult = (s.multiplier ?? 1).toFixed ? (s.multiplier ?? 1).toFixed(2) : "1.00";

      // Под твою верстку: собака/энергия рисуются другими модулями,
      // тут делаем безопасный каркас, чтобы экран не был пустым.
      return `
        <div class="panel">
          <div class="row">
            <div class="pill">🐶 <b>${user}</b></div>
            <div class="pill">Настроение: <b>${mood}</b> • x<b>${mult}</b></div>
          </div>

          <div class="center" style="margin-top: 18px;">
            <div id="dogStage" class="dog-stage">
              <!-- сюда clicker.js может вставлять img/слои -->
            </div>
          </div>

          <div style="margin-top: 18px;">
            <div id="energyCard">
              <!-- сюда energy.js может вставлять прогресс -->
            </div>
          </div>
        </div>
      `;
    },

    tasks: () => `<div class="panel"><h2>Задания</h2><div id="tasksRoot"></div></div>`,
    nft: () => `<div class="panel"><h2>NFT</h2><div id="nftRoot"></div></div>`,
    wallet: () => `<div class="panel"><h2>Кошелёк</h2><div id="walletRoot"></div></div>`,
  };

  window.UI = UI;
})();