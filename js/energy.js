window.App = window.App || {};

App.energy = (() => {
  function init() {
    // реген энергии
    setInterval(() => {
      const s = App.state.get();
      if (s.energy < s.energyMax) {
        App.state.set({ energy: Math.min(s.energyMax, s.energy + 1) });
      }
    }, 250); // 4 ед/сек
  }

  function canTap() {
    return App.state.get().energy > 0;
  }

  function spend(amount) {
    const s = App.state.get();
    App.state.set({ energy: Math.max(0, s.energy - amount) });
  }

  return { init, canTap, spend };
})();