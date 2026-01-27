// js/app.js (FULL)
// Fix 1: Skip works even if pressed before onFinish() is set
// Fix 2: Dog tap reliable on Telegram Android (pointerdown/touchstart + preventDefault)

/*************************************************
 * Helpers
 *************************************************/
function wait(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

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
 * SPLASH VIDEO CONTROLLER (robust)
 *************************************************/
const Splash = (() => {
  const MIN_SHOW_MS = 600;
  const MAX_WAIT_MS = 12000;

  let startedAt = 0;
  let finished = false;
  let finishCb = null;

  function el(id) {
    return document.getElementById(id);
  }

  function setStatus(text) {
    const s = el("splash-status");
    if (s) s.innerText = text || "";
  }

  function showTapToStart() {
    el("splash-tap")?.classList.remove("hidden");
  }

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

    // IMPORTANT: callback всегда должен сработать, если он уже установлен
    try { finishCb?.(); } catch (e) { console.warn("finishCb error:", e); }
  }

  // IMPORTANT: если finish() уже случился, а cb назначили позже — вызвать сразу
  function onFinish(cb) {
    finishCb = cb;
    if (finished && finishCb) {
      try { finishCb(); } catch (e) { console.warn("finishCb late error:", e); }
    }
  }

  async function start() {
    startedAt = Date.now();
    finished = false;

    const video = el("splash-video");
    const skipBtn = el("splash-skip");
    const tapBtn = el("splash-tap");

    // skip всегда доступен
    if (skipBtn) {
      skipBtn.onclick = () => finish();
    }

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

    // safety timeout
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

    const loaded = await withTimeout(
      StorageManager.loadStateAsync(),
      2500,
      () => null
    );

    if (loaded) {
      _state = loaded;
      return _state;
    }

    console.warn("State.init timeout → fallback defaultState()");
    _state = StorageManager.defaultState();
    return _state;
  }

  function get() {
    if (!_state) throw new Error("State not initialized. Call await State.init()");
    return _state;
  }

  function set(next) {
    _state = next;
    return _state;
  }

  async function save() {
    if (!_state) return;
    try { await StorageManager.saveStateAsync(_state); } catch (e) { console.warn("save error:", e); }
  }

  return { init, get, set, save };
})();

window.State = State;

/*************************************************
 * TELEGRAM WRAPPER
 *************************************************/
const tg = window.Telegram?.WebApp || null;

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
    const bonesEl = document.getElementById("bones-count");
    const zooEl = document.getElementById("zoo-count");
    if (bonesEl) bonesEl.innerText = (s.bones | 0);
    if (zooEl) zooEl.innerText = (s.zoo | 0);
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
 * CLICKER
 *************************************************/
const Clicker = {
  tapCost: 1,
  reward: 1,

  tap() {
    const s = State.get();
    if (s.energy < this.tapCost) return;

    s.energy -= this.tapCost;
    s.bones += this.reward;

    State.save();
    UI.updateBalance();
    UI.updateEnergy();

    this.animate();
  },

  animate() {
    const img = document.getElementById("dog-img");
    if (!img) return;

    img.classList.add("tap");
    setTimeout(() => img.classList.remove("tap"), 120);
  },
};

window.Clicker = Clicker;

/*************************************************
 * MINING
 *************************************************/
const Mining = {
  ratePerSec(level) {
    return level;
  },

  collect() {
    const s = State.get();
    const now = Date.now();
    const delta = Math.floor((now - s.mining.lastCollect) / 1000);
    if (delta <= 0) return;

    const earned = delta * this.ratePerSec(s.mining.level);

    s.zoo += earned;
    s.mining.lastCollect = now;

    State.save();
    UI.updateBalance();
    UI.updateMiningInfo();
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
  }

  buttons.forEach((btn) => btn.addEventListener("click", () => openTab(btn.dataset.tab)));
  openTab("main");
}

/*************************************************
 * UI BINDINGS (tap надежно)
 *************************************************/
function bindTapZone() {
  const zone = document.getElementById("tap-zone");
  if (!zone) return;

  // предотвращаем "залипание" и скролл/зум
  const fireTap = (e) => {
    try {
      e?.preventDefault?.();
      e?.stopPropagation?.();
    } catch (_) {}
    Clicker.tap();
  };

  // Pointer events (modern)
  zone.addEventListener("pointerdown", fireTap, { passive: false });

  // Fallback for some Android WebViews
  zone.addEventListener("touchstart", fireTap, { passive: false });

  // Disable context menu / long tap
  zone.addEventListener("contextmenu", (e) => e.preventDefault());

  // Also block drag
  zone.addEventListener("dragstart", (e) => e.preventDefault());
}

function bindUI() {
  bindTapZone();

  document.getElementById("share-ref-btn")?.addEventListener("click", () => ReferralManager.shareReferral());
  document.getElementById("collect-btn")?.addEventListener("click", () => Mining.collect());

  document.getElementById("pay-01-ton-btn")?.addEventListener("click", async () => {
    try {
      const TO_ADDRESS = "UQCJRRRYnrs_qsA2AgIE71dPsHf_-AKaZV9UMeT4vBbh6Yes";
      const AMOUNT_NANO = "100000000";

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
  }, 3000);
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

  // IMPORTANT: onFinish safe even if Skip pressed early
  splash.onFinish(() => {
    showGame();
  });

  splash.setStatus("Загрузка...");

  await withTimeout(
    (async () => {
      await State.init();
      initTelegram();

      try { TonConnectManager?.init?.(); } catch (e) { console.warn("TonConnect init error:", e); }

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
    7000,
    async () => {
      console.warn("Init timeout → opening game anyway");
      splash.setStatus("Запуск без облака...");
      showGame();
      return null;
    }
  );

  // ensure game visible
  showGame();

  // hide splash
  await splash.finish();
}

window.addEventListener("load", () => {
  startGame().catch((e) => console.error("startGame error:", e));
});