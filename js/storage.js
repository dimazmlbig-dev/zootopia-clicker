// js/storage.js — стабильное локальное хранение (без зависаний Telegram CloudStorage)
window.StorageManager = (() => {
  const KEY = "zootopia_state_v1";

  function defaultState() {
    return {
      v: 1,
      bones: 0,
      zoo: 0,
      energy: 1000,
      maxEnergy: 1000,

      tapsTotal: 0,

      mining: { level: 1, lastCollect: Date.now() },

      referrals: 0,
      refCode: "",

      walletAddress: "",
      tonBalance: 0,

      ownedNfts: [] // ids
    };
  }

  function sanitize(s) {
    const d = defaultState();
    if (!s || typeof s !== "object") return d;

    return {
      ...d,
      ...s,
      mining: {
        ...d.mining,
        ...(s.mining || {})
      },
      ownedNfts: Array.isArray(s.ownedNfts) ? s.ownedNfts : d.ownedNfts
    };
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
      localStorage.setItem(KEY, JSON.stringify(state));
      return true;
    } catch (e) {
      console.warn("Storage save error:", e);
      return false;
    }
  }

  return { defaultState, loadStateAsync, saveStateAsync };
})();