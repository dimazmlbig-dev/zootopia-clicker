window.Energy = (() => {
  let regenTimer = null;

  function regenTick() {
    const s = window.State.get();
    if (!s) return;

    // реген: +1 каждые 700мс = ~85/мин (можешь менять)
    if (s.energy < s.maxEnergy) {
      s.energy = Math.min(s.maxEnergy, s.energy + 1);
      window.UI.renderTop();
      window.UI.renderClicker();
    }
  }

  function start() {
    stop();
    regenTimer = setInterval(regenTick, 700);
  }

  function stop() {
    if (regenTimer) clearInterval(regenTimer);
    regenTimer = null;
  }

  function canSpend(n) {
    const s = window.State.get();
    return s.energy >= n;
  }

  function spend(n) {
    const s = window.State.get();
    s.energy = Math.max(0, s.energy - n);
  }

  return { start, stop, canSpend, spend };
})();