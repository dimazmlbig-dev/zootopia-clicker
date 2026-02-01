window.App = window.App || {};

App.state = (() => {
  const state = {
    coins: 0,
    energy: 1000,
    energyMax: 1000,
    level: 1,
    clicks: 0,
    cps: 0,                 // coins per second (пассив)
    tab: 'click',
    wallet: {
      connected: false,
      address: null,
      tonBalance: null
    }
  };

  const listeners = new Set();

  function init() {
    // ничего не делаем, просто готовим
  }

  function get() { return state; }

  function set(patch) {
    Object.assign(state, patch);
    emit();
  }

  function emit() {
    for (const fn of listeners) fn(state);
  }

  function subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  }

  return { init, get, set, subscribe };
})();