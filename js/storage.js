// js/storage.js
(function () {
  function key(userId) {
    return `zoo_state_${userId}`;
  }

  function safeParse(json) {
    try { return JSON.parse(json); } catch { return null; }
  }

  function getStableDemoId() {
    // если не в Telegram — сделаем стабильный id, чтобы не создавались "новые аккаунты"
    const k = "zoo_demo_uid";
    let v = localStorage.getItem(k);
    if (!v) {
      v = String(Math.floor(Date.now() / 1000)) + String(Math.floor(Math.random() * 1e6));
      localStorage.setItem(k, v);
    }
    return v;
  }

  window.StorageZOO = {
    getStableDemoId,

    load(userId) {
      const raw = localStorage.getItem(key(userId));
      const obj = safeParse(raw);
      return obj || null;
    },

    save(userId, stateObj) {
      try {
        localStorage.setItem(key(userId), JSON.stringify(stateObj));
      } catch (e) {
        console.warn("Storage save failed:", e);
      }
    },
  };
})();