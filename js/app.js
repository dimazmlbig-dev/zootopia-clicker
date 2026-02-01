// js/app.js
(() => {
  const APP = {
    state: {
      activeTab: "click",
      user: { name: "Дмитрий" },
      mood: "happy",
      multiplier: 1.0,
    },

    getState() {
      // если у тебя есть state.js с State.get() — используем его
      if (window.State && typeof window.State.get === "function") return window.State.get();
      return this.state;
    },

    setState(patch) {
      if (window.State && typeof window.State.set === "function") {
        window.State.set(patch);
      } else {
        this.state = { ...this.state, ...patch };
        window.APP_STATE = this.state;
      }
    },

    onTabChange(tab) {
      this.setState({ activeTab: tab });
      if (window.UI && typeof UI.render === "function") UI.render(this.getState());

      // Подключаем “вкладочные” модули, если они есть
      if (tab === "tasks" && window.Tasks && typeof Tasks.render === "function") Tasks.render();
      if (tab === "nft" && window.NFT && typeof NFT.render === "function") NFT.render();
      if (tab === "wallet" && window.Wallet && typeof Wallet.render === "function") Wallet.render();
    },

    start() {
      // Telegram WebApp safe init (не обязателен)
      if (window.Telegram?.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
      }

      if (window.UI && typeof UI.init === "function") UI.init();
      if (window.UI && typeof UI.render === "function") UI.render(this.getState());

      // стартуем остальные модули если у них есть init()
      if (window.Energy && typeof Energy.init === "function") Energy.init();
      if (window.Clicker && typeof Clicker.init === "function") Clicker.init();
    },
  };

  window.APP = APP;

  document.addEventListener("DOMContentLoaded", () => APP.start());
})();