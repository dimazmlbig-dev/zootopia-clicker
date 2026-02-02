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

  function start() {
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
    const tgUser = getTelegramUser();
    const userId = tgUser?.id || window.StorageZOO.getStableDemoId();
    const userName = tgUser?.name || "Игрок";

    window.State.update((s) => {
      s.user.id = userId;
      s.user.name = userName;
    });

    // load saved
    const saved = window.StorageZOO.load(userId);
    if (saved) {
      window.State.update((s) => {
        // мержим безопасно
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

    // init UI
    window.UI?.init?.();

    // bind clicker
    window.Clicker?.bind?.();

    // autosave (раз в 2 сек)
    setInterval(() => {
      const s = window.State.data;
      window.StorageZOO.save(userId, {
        tab: s.tab,
        balance: s.balance,
        tonBalance: s.tonBalance,
        energy: s.energy,
        energyMax: s.energyMax,
        level: s.level,
        levelProgress: s.levelProgress,
        mood: s.mood,
        multiplier: s.multiplier,
        nftEquipped: s.nftEquipped,
      });
    }, 2000);

    // regen energy (простая)
    setInterval(() => {
      window.State.update((st) => {
        if (st.energy < st.energyMax) st.energy = Math.min(st.energyMax, st.energy + 1);
      });
    }, 1500);
  }

  document.addEventListener("DOMContentLoaded", start);
})();
