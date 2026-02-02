window.Bonuses = (() => {
  function setActiveTab(tab) {
    document.querySelectorAll(".bonus-tab").forEach((btn) => {
      btn.classList.toggle("is-active", btn.dataset.bonusTab === tab);
    });
    document.querySelectorAll(".bonus-panel").forEach((panel) => {
      panel.classList.toggle("is-active", panel.dataset.bonusPanel === tab);
    });
  }

  function bindTabs() {
    document.querySelectorAll(".bonus-tab").forEach((btn) => {
      btn.addEventListener("click", () => {
        setActiveTab(btn.dataset.bonusTab);
      });
    });
  }

  function init() {
    bindTabs();
    setActiveTab("rewards");
    window.Match3?.init?.();
    window.Wheel?.init?.();
  }

  return { init };
})();
