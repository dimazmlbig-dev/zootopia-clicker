// js/storage.js — стабильное хранение (LocalStorage), без зависаний

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
    out.bones = Number(out.bones) || 0;
    out.zoo = Number(out.zoo) || 0;
    out.energy = Number(out.energy) || d.energy;
    out.maxEnergy = Number(out.maxEnergy) || d.maxEnergy;
    out.referrals = Number(out.referrals) || 0;
    out.refCode = typeof out.refCode === "string" ? out.refCode : (out.refCode ? String(out.refCode) : "");

    if (!out.mining || typeof out.mining !== "object") out.mining = { ...d.mining };
    out.mining.level = Number(out.mining.level) || 1;
    out.mining.lastCollect = Number(out.mining.lastCollect) || Date.now();

    out.walletAddress = typeof out.walletAddress === "string" ? out.walletAddress : "";
    out.tonBalance = Number(out.tonBalance) || 0;

    // clamp
    out.maxEnergy = Math.max(1, Math.floor(out.maxEnergy));
    out.energy = Math.max(0, Math.min(out.maxEnergy, Number(out.energy)));

    return out;
  }

  async function loadStateAsync() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      return sanitize(JSON.parse(raw));
    } catch (e) {
      console.warn("loadStateAsync error:", e);
      return defaultState();
    }
  }

  async function saveStateAsync(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(sanitize(state)));
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