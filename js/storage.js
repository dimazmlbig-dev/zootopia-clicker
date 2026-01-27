// js/storage.js — стабильное хранение (LocalStorage), без зависаний.
// Backend-state подключим позже отдельным шагом.

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

    d.bones = Math.max(0, Math.floor(Number(s.bones) || 0));
    d.zoo = Math.max(0, Math.floor(Number(s.zoo) || 0));
    d.maxEnergy = Math.max(1, Math.floor(Number(s.maxEnergy) || 1000));
    d.energy = Math.max(0, Math.min(d.maxEnergy, Math.floor(Number(s.energy) || d.maxEnergy)));

    d.referrals = Math.max(0, Math.floor(Number(s.referrals) || 0));
    d.refCode = typeof s.refCode === "string" ? s.refCode : "";

    const ml = s.mining || {};
    d.mining.level = Math.max(1, Math.floor(Number(ml.level) || 1));
    d.mining.lastCollect = Math.max(0, Number(ml.lastCollect) || Date.now());

    d.walletAddress = typeof s.walletAddress === "string" ? s.walletAddress : "";
    d.tonBalance = Number(s.tonBalance) || 0;

    return d;
  }

  async function loadStateAsync() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return sanitize(JSON.parse(raw));
    } catch (e) {
      console.warn("Storage load error:", e);
      return null;
    }
  }

  async function saveStateAsync(state) {
    try {
      localStorage.setItem(KEY, JSON.stringify(sanitize(state)));
      return true;
    } catch (e) {
      console.warn("Storage save error:", e);
      return false;
    }
  }

  return { defaultState, loadStateAsync, saveStateAsync };
})();