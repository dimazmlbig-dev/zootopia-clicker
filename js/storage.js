// js/storage.js — простое стабильное хранилище (localStorage)

window.StorageManager = (() => {
  const KEY = "zootopia_state_v2";

  function defaultState() {
    return {
      v: 2,
      bones: 0,
      zoo: 0,
      energy: 1000,
      maxEnergy: 1000,

      mining: {
        level: 1,
        lastTick: Date.now(),     // для начисления
        available: 0              // накоплено к сбору
      },

      tasks: {
        // прогресс задач
        tapCount: 0,
        claimed: {} // {taskId: true}
      },

      nft: {
        owned: [] // массив id
      },

      wallet: {
        address: ""
      },

      referrals: 0,
      refCode: ""
    };
  }

  function sanitize(s) {
    const d = defaultState();
    if (!s || typeof s !== "object") return d;

    const out = structuredClone ? structuredClone(d) : JSON.parse(JSON.stringify(d));

    out.bones = Number(s.bones ?? d.bones) || 0;
    out.zoo = Number(s.zoo ?? d.zoo) || 0;

    out.energy = clampInt(s.energy ?? d.energy, 0, 999999);
    out.maxEnergy = clampInt(s.maxEnergy ?? d.maxEnergy, 1, 999999);

    out.mining = out.mining || {};
    const m = s.mining || {};
    out.mining.level = clampInt(m.level ?? d.mining.level, 1, 999);
    out.mining.lastTick = Number(m.lastTick ?? d.mining.lastTick) || Date.now();
    out.mining.available = Number(m.available ?? d.mining.available) || 0;

    out.tasks = out.tasks || {};
    const t = s.tasks || {};
    out.tasks.tapCount = clampInt(t.tapCount ?? d.tasks.tapCount, 0, 10**9);
    out.tasks.claimed = (t.claimed && typeof t.claimed === "object") ? t.claimed : {};

    out.nft = out.nft || {};
    const n = s.nft || {};
    out.nft.owned = Array.isArray(n.owned) ? n.owned.filter(x => typeof x === "string" || typeof x === "number") : [];

    out.wallet = out.wallet || {};
    const w = s.wallet || {};
    out.wallet.address = typeof w.address === "string" ? w.address : "";

    out.referrals = clampInt(s.referrals ?? d.referrals, 0, 10**9);
    out.refCode = typeof s.refCode === "string" ? s.refCode : "";

    return out;
  }

  function clampInt(v, min, max) {
    const n = Number(v);
    if (!Number.isFinite(n)) return min;
    return Math.max(min, Math.min(max, Math.floor(n)));
  }

  async function loadStateAsync() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return sanitize(parsed);
    } catch (e) {
      console.warn("Storage load error:", e);
      return null;
    }
  }

  let saveTimer = null;
  function saveStateDebounced(state, delayMs = 300) {
    clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      try {
        localStorage.setItem(KEY, JSON.stringify(state));
      } catch (e) {
        console.warn("Storage save error:", e);
      }
    }, delayMs);
  }

  function reset() {
    try {
      localStorage.removeItem(KEY);
    } catch {}
  }

  return {
    defaultState,
    loadStateAsync,
    saveStateDebounced,
    reset
  };
})();