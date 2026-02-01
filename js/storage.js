window.App = window.App || {};

App.storage = (() => {
  const KEY = 'zoo_state_v1';

  function init() {
    const saved = load();
    if (saved) {
      // аккуратно мержим только известные поля
      const cur = App.state.get();
      App.state.set({
        coins: saved.coins ?? cur.coins,
        energy: saved.energy ?? cur.energy,
        energyMax: saved.energyMax ?? cur.energyMax,
        level: saved.level ?? cur.level,
        clicks: saved.clicks ?? cur.clicks,
        tab: saved.tab ?? cur.tab,
        wallet: saved.wallet ?? cur.wallet
      });
    }

    // автосейв раз в 2 сек
    setInterval(save, 2000);
  }

  function save() {
    try {
      const s = App.state.get();
      localStorage.setItem(KEY, JSON.stringify(s));
    } catch {}
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  function reset() {
    try { localStorage.removeItem(KEY); } catch {}
  }

  return { init, save, load, reset };
})();