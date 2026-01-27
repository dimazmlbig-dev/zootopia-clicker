// js/storage.js — стабильное хранение (LocalStorage), без зависаний CloudStorage

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

    return {
      v: 1,
      bones: Number.isFinite(s.bones) ? s.bones : d.bones,
      zoo: Number.isFinite(s.zoo) ? s.zoo : d.zoo,
      energy: Number.isFinite(s.energy) ? s.energy : d.energy,
      maxEnergy: Number.isFinite(s.maxEnergy) ? s.maxEnergy : d.maxEnergy,
      referrals: Number.isFinite(s.referrals) ? s.referrals : d.referrals,
      refCode: typeof s.refCode === "string" ? s.refCode : d.refCode,
      mining: {
        level: Number.isFinite(s?.mining?.level) ? s.mining.level : d.mining.level,
        lastCollect: Number.isFinite(s?.mining?.lastCollect) ? s.mining.lastCollect : d.mining.lastCollect
      },
      walletAddress: typeof s.walletAddress === "string" ? s.walletAddress : d.walletAddress,
      tonBalance: Number.isFinite(s.tonBalance) ? s.tonBalance : d.tonBalance
    };
  }

  async function loadStateAsync() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return sanitize(parsed);
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