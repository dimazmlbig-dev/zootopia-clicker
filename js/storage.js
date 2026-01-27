// js/storage.js - стабильное хранение (LocalStorage), без зависаний.

window.StorageManager = (() => {
  const KEY = "zootopia_state_v1";

  function defaultState() {
    return {
      v: 1,
      bones: 0,
      zoo: 0,
      energy: 1000,
      maxEnergy: 1000,
      referrals: 0,
      refCode: "",
      mining: {
        level: 1,
        lastCollect: Date.now()
      },
      walletAddress: "",
      tonBalance: 0
    };
  }

  function sanitize(s) {
    const d = defaultState();
    if (!s || typeof s !== "object") return d;

    const out = { ...d, ...s };
    out.mining = { ...d.mining, ...(s.mining || {}) };

    // numbers
    out.bones = Number(out.bones) || 0;
    out.zoo = Number(out.zoo) || 0;
    out.energy = Number(out.energy) || d.energy;
    out.maxEnergy = Number(out.maxEnergy) || d.maxEnergy;
    out.referrals = Number(out.referrals) || 0;
    out.mining.level = Number(out.mining.level) || 1;
    out.mining.lastCollect = Number(out.mining.lastCollect) || Date.now();

    // strings
    out.refCode = (out.refCode ?? "") + "";
    out.walletAddress = (out.walletAddress ?? "") + "";

    return out;
  }

  async function loadStateAsync() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return sanitize(parsed);
    } catch (e) {
      console.warn("loadStateAsync error:", e);
      return null;
    }
  }

  async function saveStateAsync(state) {
    try {
      const safe = sanitize(state);
      localStorage.setItem(KEY, JSON.stringify(safe));
      return true;
    } catch (e) {
      console.warn("saveStateAsync error:", e);
      return false;
    }
  }

  return {
    defaultState,
    loadStateAsync,
    saveStateAsync
  };
})();