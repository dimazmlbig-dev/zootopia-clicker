/*************************************************
 * Helpers
 *************************************************/
function wait(ms) { return new Promise((r) => setTimeout(r, ms)); }

async function withTimeout(promise, ms, onTimeout) {
  let t;
  const timeout = new Promise((resolve) => {
    t = setTimeout(() => resolve(onTimeout?.()), ms);
  });
  const result = await Promise.race([promise, timeout]);
  clearTimeout(t);
  return result;
}

/*************************************************
 * SPLASH VIDEO CONTROLLER
 *************************************************/
const Splash = (() => {
  const MIN_SHOW_MS = 800;
  const MAX_WAIT_MS = 12000;

  let startedAt = 0;
  let finished = false;
  let finishCb = null;

  function el(id) { return document.getElementById(id); }

  function setStatus(text) {
    const s = el("splash-status");
    if (s) s.innerText = text || "";
  }

  function showTapToStart() { el("splash-tap")?.classList.remove("hidden"); }

  function hideSplash() {
    const splash = el("splash-screen");
    if (splash) splash.style.display = "none";
  }

  async function tryPlayVideo(video) {
    if (!video) return false;
    try {
      video.muted = true;
      video.playsInline = true;
      await video.play();
      return true;
    } catch (_) {
      return false;
    }
  }

  async function finish() {
    if (finished) return;
    finished = true;

    const video = el("splash-video");
    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_SHOW_MS) await wait(MIN_SHOW_MS - elapsed);

    try { video?.pause?.(); } catch (_) {}
    hideSplash();
    finishCb?.();
  }

  function onFinish(cb) { finishCb = cb; }

  async function start() {
    startedAt = Date.now();
    finished = false;

    const video = el("splash-video");
    const skipBtn = el("splash-skip");
    const tapBtn = el("splash-tap");

    if (skipBtn) skipBtn.onclick = () => finish();

    setStatus("Загрузка...");

    const played = await tryPlayVideo(video);
    if (!played) {
      showTapToStart();
      setStatus("Нажми, чтобы начать");

      if (tapBtn) {
        tapBtn.onclick = async () => {
          tapBtn.classList.add("hidden");
          setStatus("Загрузка...");
          await tryPlayVideo(video);
        };
      }
    }

    if (video) {
      video.onended = () => finish();
      video.onerror = () => finish();
    }

    setTimeout(() => finish(), MAX_WAIT_MS);
    return { finish, setStatus, onFinish };
  }

  return { start };
})();

/*************************************************
 * STATE
 *************************************************/
const State = (() => {
  let _state = null;

  async function init() {
    if (_state) return _state;

    const loaded = await withTimeout(StorageManager.loadStateAsync(), 4000, () => null);
    _state = loaded || StorageManager.defaultState();
    return _state;
  }

  function get() {
    if (!_state) throw new Error("State not initialized. Call await State.init()");
    return _state;
  }

  function set(next) { _state = next; return _state; }

  async function save() {
    if (!_state) return;
    await StorageManager.saveStateAsync(_state);
  }

  return { init, get, set, save };
})();
window.State = State;

/*************************************************
 * TELEGRAM WRAPPER
 *************************************************/
const tg = window.Telegram?.WebApp || null;

function haptic(type = "light") {
  try {
    tg?.HapticFeedback?.impactOccurred?.(type);
  } catch (_) {}
}

function initTelegram() {
  if (!tg) return;

  tg.ready();
  tg.expand?.();
  tg.disableVerticalSwipes?.();

  const user = tg.initDataUnsafe?.user;
  if (user) {
    const nameEl = document.getElementById("user-name");
    if (nameEl) nameEl.innerText = user.first_name || "Игрок";

    const s = State.get();
    if (!s.refCode && user.id) {
      s.refCode = String(user.id);
      State.set(s);
      State.save();
    }
  }
}

/*************************************************
 * UI
 *************************************************/
const UI = {
  updateBalance() {
    const s = State.get();
    document.getElementById("bones-count") && (document.getElementById("bones-count").innerText = s.bones | 0);
    document.getElementById("zoo-count") && (document.getElementById("zoo-count").innerText = s.zoo | 0);
  },

  updateEnergy() {
    const s = State.get();
    const percent = Math.max(0, Math.min(100, (s.energy / s.maxEnergy) * 100));
    const bar = document.getElementById("energy-bar");
    if (bar) bar.style.width = percent + "%";

    const label = document.getElementById("current-energy");
    if (label) label.innerText = `${Math.floor(s.energy)} / ${s.maxEnergy}`;
  },

  updateReferral() {
    const s = State.get();
    const codeEl = document.getElementById("ref-code-display");
    if (codeEl) codeEl.innerText = s.refCode ? String(s.refCode) : "---";

    const btn = document.getElementById("share-ref-btn");
    if (btn) btn.innerText = `Поделиться (${s.referrals || 0}/5)`;
  },

  updateMiningInfo() {
    const s = State.get();
    const el = document.getElementById("mining-info");
    if (!el) return;

    const now = Date.now();
    const delta = Math.floor((now - s.mining.lastCollect) / 1000);
    const available = Math.max(0, delta * Mining.ratePerSec(s.mining.level));
    el.innerText = `Уровень: ${s.mining.level} | Доступно: ${available}`;
  }
};
window.UI = UI;

/*************************************************
 * ENERGY
 *************************************************/
const Energy = {
  regenPerSec: 1,
  start() {
    setInterval(() => {
      const s = State.get();
      if (s.energy < s.maxEnergy) {
        s.energy = Math.min(s.maxEnergy, s.energy + this.regenPerSec);
        State.save();
        UI.updateEnergy();
      }
    }, 1000);
  },
};
window.Energy = Energy;

/*************************************************
 * Anti-bot / tap limiter
 *************************************************/
const AntiBot = (() => {
  const MAX_TAPS_PER_SEC = 12;     // безопасный лимит для пальца
  const WINDOW_MS = 1000;

  let taps = []; // timestamps
  let flaggedUntil = 0;

  function allowTap() {
    const now = Date.now();
    if (now < flaggedUntil) return false;

    taps = taps.filter((t) => now - t < WINDOW_MS);
    taps.push(now);

    if (taps.length > MAX_TAPS_PER_SEC) {
      flaggedUntil = now + 1500; // 1.5 секунды “остыть”
      return false;
    }
    return true;
  }

  return { allowTap };
})();

/*************************************************
 * CLICKER
 *************************************************/
const Clicker = {
  tapCost: 1,
  reward: 1,

  tap() {
    if (!AntiBot.allowTap()) {
      haptic("rigid");
      return;
    }

    const s = State.get();
    if (s.energy < this.tapCost) {
      haptic("soft");
      return;
    }

    s.energy -= this.tapCost;
    s.bones += this.reward;

    // прогресс заданий
    try { Tasks?.addTapProgress?.(1); } catch (_) {}

    State.save();
    UI.updateBalance();
    UI.updateEnergy();

    this.animate();
    haptic("light");
  },

  animate() {
    const img = document.getElementById("dog-img");
    if (!img) return;

    img.classList.remove("tap");
    void img.offsetWidth; // reflow, чтобы анимация повторялась
    img.classList.add("tap");
    setTimeout(() => img.classList.remove("tap"), 120);
  },
};
window.Clicker = Clicker;

/*************************************************
 * MINING
 *************************************************/
const Mining = {
  ratePerSec(level) { return level; },

  collect() {
    const s = State.get();
    const now = Date.now();
    const delta = Math.floor((now - s.mining.lastCollect) / 1000);
    if (delta <= 0) return;

    const earned = delta * this.ratePerSec(s.mining.level);
    s.zoo += earned;
    s.mining.lastCollect = now;

    // прогресс заданий
    try { Tasks?.addMiningProgress?.(1); } catch (_) {}

    State.save();
    UI.updateBalance();
    UI.updateMiningInfo();
    haptic("medium");
  }
};
window.Mining = Mining;

/*************************************************
 * REFERRALS
 *************************************************/
const ReferralManager = {
  shareReferral() {
    const s = State.get();
    if (!s.refCode) return;

    const link = `https://t.me/zooclikbot?start=ref_${s.refCode}`;
    if (tg?.openTelegramLink) {
      const url =
        `https://t.me/share/url?url=${encodeURIComponent(link)}` +
        `&text=${encodeURIComponent("Залетай в Zootopia Clicker 🐶")}`;
      tg.openTelegramLink(url);
    } else {
      navigator.clipboard?.writeText(link);
      alert("Ссылка скопирована:\n" + link);
    }
    haptic("light");
  },

  claimReferralBonus() {
    // backend later
  },
};
window.ReferralManager = ReferralManager;

/*************************************************
 * NAV / TABS
 *************************************************/
function bindBottomNav() {
  const buttons = document.querySelectorAll(".nav-btn");
  const pages = {
    main: document.getElementById("tab-main"),
    tasks: document.getElementById("tab-tasks"),
    mining: document.getElementById("tab-mining"),
  };

  function openTab(name) {
    buttons.forEach((b) => b.classList.toggle("active", b.dataset.tab === name));
    Object.values(pages).forEach((p) => {
      if (!p) return;
      p.classList.add("hidden");
      p.classList.remove("active");
    });
    const target = pages[name];
    if (target) {
      target.classList.remove("hidden");
      target.classList.add("active");
    }

    if (name === "tasks") {
      try { Tasks?.render?.(); } catch (_) {}
    }
  }

  buttons.forEach((btn) => btn.addEventListener("click", () => openTab(btn.dataset.tab)));
  openTab("main");
}

/*************************************************
 * TAP bindings: pointerdown + hold auto-tap
 *************************************************/
function bindTapZone() {
  const tapZone = document.getElementById("tap-zone");
  if (!tapZone) return;

  let holdTimer = null;
  let holdInterval = null;
  let isHolding = false;

  const startHold = () => {
    if (isHolding) return;
    isHolding = true;

    // небольшая задержка, чтобы обычный тап не превращался в hold
    holdTimer = setTimeout(() => {
      holdInterval = setInterval(() => {
        Clicker.tap();
      }, 90); // 11 taps/sec (внутри лимита AntiBot)
    }, 220);
  };

  const stopHold = () => {
    isHolding = false;
    if (holdTimer) { clearTimeout(holdTimer); holdTimer = null; }
    if (holdInterval) { clearInterval(holdInterval); holdInterval = null; }
  };

  tapZone.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    Clicker.tap();
    startHold();
  }, { passive: false });

  tapZone.addEventListener("pointerup", (e) => { e.preventDefault(); stopHold(); }, { passive: false });
  tapZone.addEventListener("pointercancel", stopHold);
  tapZone.addEventListener("pointerleave", stopHold);
}

/*************************************************
 * UI BINDINGS
 *************************************************/
function bindUI() {
  bindTapZone();

  document.getElementById("share-ref-btn")?.addEventListener("click", () => ReferralManager.shareReferral());
  document.getElementById("collect-btn")?.addEventListener("click", () => Mining.collect());

  document.getElementById("pay-01-ton-btn")?.addEventListener("click", async () => {
    try {
      const TO_ADDRESS = "UQCJRRRYnrs_qsA2AgIE71dPsHf_-AKaZV9UMeT4vBbh6Yes";
      const AMOUNT_NANO = "100000000"; // 0.1 TON

      if (!window.TonConnectManager) {
        alert("TonConnectManager не найден");
        return;
      }
      if (!TonConnectManager.isConnected()) {
        alert("Сначала подключи кошелек (Connect Wallet)");
        return;
      }

      await TonConnectManager.sendTon(TO_ADDRESS, AMOUNT_NANO, "Zootopia Clicker payment");
      alert("Транзакция отправлена (подтверди в кошельке)");
      haptic("medium");
    } catch (e) {
      console.warn(e);
      alert("Ошибка транзакции: " + (e?.message || e));
    }
  });

  bindBottomNav();
}

/*************************************************
 * AUTOSAVE
 *************************************************/
function startAutosave() {
  setInterval(() => {
    State.save().catch((e) => console.warn("Autosave error:", e));
  }, 2500);
}

/*************************************************
 * SHOW GAME
 *************************************************/
function showGame() {
  const main = document.getElementById("main-content");
  if (main) main.classList.remove("hidden");
}

/*************************************************
 * Global error → show on splash
 *************************************************/
function attachGlobalErrorToSplash(setStatus) {
  window.addEventListener("error", (e) => {
    console.error("Global error:", e?.error || e?.message || e);
    setStatus?.("Ошибка: " + (e?.message || "см. консоль"));
  });
  window.addEventListener("unhandledrejection", (e) => {
    console.error("Unhandled promise:", e?.reason || e);
    setStatus?.("Ошибка: " + (e?.reason?.message || e?.reason || "promise"));
  });
}

/*************************************************
 * START GAME
 *************************************************/
async function startGame() {
  const splash = await Splash.start();
  attachGlobalErrorToSplash(splash.setStatus);

  splash.onFinish(() => showGame());
  splash.setStatus("Загрузка...");

  await withTimeout(
    (async () => {
      await State.init();
      initTelegram();

      // TonConnect не блокирует
      try { TonConnectManager?.init?.(); } catch (e) { console.warn(e); }

      bindUI();

      ReferralManager.claimReferralBonus();
      Energy.start();
      startAutosave();

      UI.updateBalance();
      UI.updateEnergy();
      UI.updateReferral();
      UI.updateMiningInfo();

      setInterval(() => UI.updateMiningInfo(), 1000);
    })(),
    6000,
    async () => {
      console.warn("Init timeout → opening game anyway");
      splash.setStatus("Запуск...");
      showGame();
      return null;
    }
  );

  showGame();
  await splash.finish();
}

window.addEventListener("load", () => {
  startGame().catch((e) => console.error("startGame error:", e));
});