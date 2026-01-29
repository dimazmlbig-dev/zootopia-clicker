// js/storage.js — стабильное хранение без зависаний (LocalStorage)

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
      mining: { level: 1, lastCollect: Date.now() },
      walletAddress: "",
      tonBalance: 0
    };
  }

  function sanitize(s) {
    const d = defaultState();
    if (!s || typeof s !== "object") return d;

    // мягкий merge, чтобы не ломаться на старых сейвах
    const out = { ...d, ...s };
    out.mining = { ...d.mining, ...(s.mining || {}) };

    // защита типов
    out.bones = Number(out.bones) || 0;
    out.zoo = Number(out.zoo) || 0;
    out.energy = Number(out.energy) || d.energy;
    out.maxEnergy = Number(out.maxEnergy) || d.maxEnergy;
    out.referrals = Number(out.referrals) || 0;
    out.refCode = (out.refCode ?? "") + "";
    out.mining.level = Number(out.mining.level) || 1;
    out.mining.lastCollect = Number(out.mining.lastCollect) || Date.now();
    out.walletAddress = (out.walletAddress ?? "") + "";
    out.tonBalance = Number(out.tonBalance) || 0;

    // clamp
    out.energy = Math.max(0, Math.min(out.maxEnergy, out.energy));

    return out;
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