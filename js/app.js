// js/app.js
(function () {
  function getTelegramUser() {
    const tg = window.Telegram?.WebApp;
    if (!tg) return null;

    // важно: initDataUnsafe.user есть только когда реально запущено внутри Telegram
    const u = tg.initDataUnsafe?.user;
    if (!u || !u.id) return null;

    return {
      id: String(u.id),
      name: [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || (u.username ? `@${u.username}` : "Игрок"),
    };
  }

  function serializeState(state) {
    return {
      tab: state.tab,
      balance: state.balance,
      tonBalance: state.tonBalance,
      energy: state.energy,
      energyMax: state.energyMax,
      level: state.level,
      levelProgress: state.levelProgress,
      mood: state.mood,
      multiplier: state.multiplier,
      nftEquipped: state.nftEquipped,
    };
  }

  function applyLoadedState(saved) {
    if (!saved) return;
    window.State.update((s) => {
      if (typeof saved.balance === "number") s.balance = saved.balance;
      if (typeof saved.tonBalance === "number") s.tonBalance = saved.tonBalance;
      if (typeof saved.energy === "number") s.energy = saved.energy;
      if (typeof saved.energyMax === "number") s.energyMax = saved.energyMax;
      if (typeof saved.level === "number") s.level = saved.level;
      if (typeof saved.levelProgress === "number") s.levelProgress = saved.levelProgress;
      if (typeof saved.mood === "string") s.mood = saved.mood;
      if (typeof saved.multiplier === "number") s.multiplier = saved.multiplier;
      if (saved.nftEquipped && typeof saved.nftEquipped === "object") s.nftEquipped = saved.nftEquipped;
      if (typeof saved.tab === "string") s.tab = saved.tab;
    });
  }

  async function start() {
    // Telegram setup
    const tg = window.Telegram?.WebApp;
    try { tg?.ready?.(); } catch {}
    try { tg?.expand?.(); } catch {}

    let audioStarted = false;
    const startAudio = () => {
      if (audioStarted) return;
      audioStarted = true;
      window.AudioFX?.init?.();
    };
    document.addEventListener("pointerdown", startAudio, { once: true });
    document.addEventListener("keydown", startAudio, { once: true });

    // user
    const authUser = await window.Auth?.init?.();
    const tgUser = getTelegramUser();
    const userId = String(authUser?.tg_user_id || tgUser?.id || window.StorageZOO.getStableDemoId());
    const userName = authUser?.username
      ? `@${authUser.username}`
      : authUser?.first_name || tgUser?.name || "Игрок";

    window.State.update((s) => {
      s.user.id = userId;
      s.user.name = userName;
    });

    // load saved
    let saved = null;
    if (window.Auth?.isAuthenticated?.()) {
      saved = await window.Auth.loadState();
    }
    if (!saved) {
      saved = window.StorageZOO.load(userId);
    }
    applyLoadedState(saved);

    // init UI
    window.UI?.init?.();
    window.Market?.init?.();

    // bind clicker
    window.Clicker?.bind?.();

    // autosave (debounce 1.5 сек)
    let saveTimer = null;
    let readyToSave = false;
    const scheduleSave = () => {
      if (!readyToSave) return;
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(async () => {
        const s = window.State.data;
        const payload = serializeState(s);
        if (window.Auth?.isAuthenticated?.()) {
          const result = await window.Auth.saveState(payload);
          if (!result) {
            window.StorageZOO.save(userId, payload);
          }
        } else {
          window.StorageZOO.save(userId, payload);
        }
      }, 1500);
    };

    window.State.on(scheduleSave);
    readyToSave = true;

    // regen energy (простая)
    setInterval(() => {
      window.State.update((st) => {
        if (st.energy < st.energyMax) st.energy = Math.min(st.energyMax, st.energy + 1);
      });
    }, 1500);
  }

  document.addEventListener("DOMContentLoaded", () => {
    start().catch((err) => console.error(err));
  });
})();
