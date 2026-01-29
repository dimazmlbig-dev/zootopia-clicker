window.Mining = (() => {
  function ratePerSec(level) {
    // 1 уровень = 1 $ZOO/сек, далее линейно
    return Math.max(1, level | 0);
  }

  function available() {
    const s = window.State.get();
    const now = Date.now();
    const dtSec = Math.max(0, Math.floor((now - s.mining.lastCollect) / 1000));
    return dtSec * ratePerSec(s.mining.level);
  }

  function collect() {
    const s = window.State.get();
    const gain = available();
    if (gain <= 0) return 0;

    s.zoo += gain;
    s.mining.lastCollect = Date.now();
    window.UI.renderTop();
    window.UI.renderClicker();
    window.UI.renderWallet();
    window.State.save();
    return gain;
  }

  function upgradeCost(level) {
    return 500 * (level + 1);
  }

  function upgrade() {
    const s = window.State.get();
    const cost = upgradeCost(s.mining.level);
    if (s.zoo < cost) return false;
    s.zoo -= cost;
    s.mining.level += 1;
    window.UI.renderTop();
    window.UI.renderClicker();
    window.State.save();
    return true;
  }

  return { available, collect, upgrade, upgradeCost, ratePerSec };
})();