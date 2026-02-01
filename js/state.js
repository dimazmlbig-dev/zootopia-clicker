// js/state.js
(function () {
  const listeners = new Set();

  const data = {
    user: { id: null, name: "Игрок" },
    tab: "click",

    balance: 0,
    energy: 1000,
    energyMax: 1000,

    mood: "happy",       // happy | tired | angry
    multiplier: 1.0,

    nftEquipped: {
      glasses: false,
      hat: false,
      collar: false,
    },
  };

  function emit() {
    listeners.forEach((fn) => {
      try { fn(data); } catch (e) { console.error(e); }
    });
  }

  window.State = {
    data,

    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },

    set(patch) {
      Object.assign(data, patch);
      emit();
    },

    update(fn) {
      fn(data);
      emit();
    },

    emit,
  };
})();