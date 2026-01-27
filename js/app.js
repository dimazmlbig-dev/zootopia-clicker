/*************************************************
 * HELPERS
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
 * SPLASH
 *************************************************/
const Splash = (() => {
  const MIN_SHOW_MS = 800;
  const MAX_WAIT_MS = 12000;

  let startedAt = 0;
  let finished = false;
  let finishCb = null;
  let finishPromise = null;

  function el(id) {
    return document.getElementById(id);
  }

  function setStatus(text) {
    const s = el("splash-status");
    if (s) s.innerText = text || "";
  }

  function showTap() {
    el("splash-tap")?.classList.remove("hidden");
  }

  function hide() {
    const splash = el("splash-screen");
    if (splash) splash.style.display = "none";
  }

  async function tryPlay(video) {
    if (!video) return false;
    try {
      video.muted = true;
      video.playsInline = true;
      await video.play();
      return true;
    } catch {
      return false;
    }
  }

  function finish() {
    if (finishPromise) return finishPromise;

    finishPromise = (async () => {
      if (finished) return;
      finished = true;

      const video = el("splash-video");
      const elapsed = Date.now() - startedAt;
      if (elapsed < MIN_SHOW_MS) await wait(MIN_SHOW_MS - elapsed);

      try { video?.pause?.(); } catch {}
      hide();
      finishCb?.();
    })();

    return finishPromise;
  }

  function onFinish(cb) {
    finishCb = cb;
  }

  async function start() {
    startedAt = Date.now();
    finished = false;
    finishPromise = null;

    const video = el("splash-video");
    const skip = el("splash-skip");
    const tap = el("splash-tap");

    skip && (skip.onclick = finish);
    tap && (tap.onclick = finish);

    setStatus("Загрузка...");

    const played = await tryPlay(video);
    if (!played) {
      showTap();
      setStatus("Нажми, чтобы начать");
    }

    if (video) {
      video.onended = finish;
      video.onerror = finish;
    }

    setTimeout(finish, MAX_WAIT_MS);

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
      5000,
      () => null
    );

    _state = loaded || StorageManager.defaultState();
    return _state;
  }

  function get() {
    if (!_state) throw new Error("State not initialized");
    return _state;
  }

  function save() {
    if (_state) return StorageManager.saveStateAsync(_state);
  }

  return { init, get, save };
})();

window.State = State;

/*************************************************
 * TELEGRAM
 *************************************************/
const tg = window.Telegram?.WebApp || null;

function initTelegram() {
  if (!tg) return;

  tg.ready();
  tg.expand?.();
  tg.disableVerticalSwipes?.();

  let s;
  try { s = State.get(); } catch { return; }

  const user = tg.initDataUnsafe?.user;
  if (user) {
    document.getElementById("user-name").innerText =
      user.first_name || "Игрок";

    if (!s.refCode && user.id) {
      s.refCode = String(user.id);
      State.save();
    }
  }

  const startParam = tg.initDataUnsafe?.start_param;
  if (startParam?.startsWith("ref_")) {
    s.referredBy = startParam.replace("ref_", "");
    State.save();
  }
}

/*************************************************
 * UI
 *************************************************/
const UI = {
  updateAll() {
    this.balance();
    this.energy();
    this.referral();
    this.mining();
  },

  balance() {
    const s = State.get();
    document.getElementById("bones-count").innerText = s.bones | 0;
    document.getElementById("zoo-count").innerText = s.zoo | 0;
  },

  energy() {
    const s = State.get();
    const percent = Math.min(100, (s.energy / s.maxEnergy) * 100);
    document.getElementById("energy-bar").style.width = percent + "%";
    document.getElementById("current-energy").innerText =
      `${Math.floor(s.energy)} / ${s.maxEnergy}`;
  },

  referral() {
    const s = State.get();
    document.getElementById("ref-code-display").innerText =
      s.refCode || "---";
    document.getElementById("share-ref-btn").innerText =
      `Поделиться (${s.referrals || 0}/5)`;
  },

  mining() {
    const s = State.get();
    const now = Date.now();
    const delta = Math.floor((now - s.mining.lastCollect) / 1000);
    const available = Math.max(0, delta * s.mining.level);
    document.getElementById("mining-info").innerText =
      `Уровень: ${s.mining.level} | Доступно: ${available}`;
  },
};

window.UI = UI;

/*************************************************
 * ENERGY
 *************************************************/
const Energy = {
  regenPerSec: 1,
  started: false,

  start() {
    if (this.started) return;
    this.started = true;

    setInterval(() => {
      const s = State.get();
      if (s.energy < s.maxEnergy) {
        s.energy = Math.min(s.maxEnergy, s.energy + this.regenPerSec);
        State.save();
        UI.energy();
      }
    }, 1000);
  },
};

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
    UI.balance();
    UI.energy();

    const img = document.getElementById("dog-img");
    img?.classList.add("tap");
    setTimeout(() => img?.classList.remove("tap"), 150);
  },
};

/*************************************************
 * MINING
 *************************************************/
const Mining = {
  collect() {
    const s = State.get();
    const now = Date.now();
    const delta = Math.floor((now - s.mining.lastCollect) / 1000);
    if (delta <= 0) return;

    s.zoo += delta * s.mining.level;
    s.mining.lastCollect = now;

    State.save();
    UI.balance();
    UI.mining();
  },
};

/*************************************************
 * NAV
 *************************************************/
function bindNav() {
  const buttons = document.querySelectorAll(".nav-btn");
  const pages = {
    main: tab("main"),
    tasks: tab("tasks"),
    mining: tab("mining"),
  };

  function tab(name) {
    return document.getElementById(`tab-${name}`);
  }

  function open(name) {
    buttons.forEach((b) =>
      b.classList.toggle("active", b.dataset.tab === name)
    );

    Object.values(pages).forEach((p) => p.classList.add("hidden"));
    pages[name]?.classList.remove("hidden");
  }

  buttons.forEach((b) =>
    b.addEventListener("click", () => open(b.dataset.tab))
  );

  open("main");
}

/*************************************************
 * BIND UI
 *************************************************/
function bindUI() {
  document.getElementById("tap-zone").onclick = () => Clicker.tap();
  document.getElementById("share-ref-btn").onclick = () =>
    ReferralManager.shareReferral();
  document.getElementById("collect-btn").onclick = () =>
    Mining.collect();

  bindNav();
}

/*************************************************
 * START GAME
 *************************************************/
async function startGame() {
  const splash = await Splash.start();

  splash.onFinish(() => {
    document.getElementById("main-content").classList.remove("hidden");
  });

  await withTimeout(
    (async () => {
      await State.init();
      initTelegram();
      TonConnectManager?.init?.();

      bindUI();
      Energy.start();

      UI.updateAll();
      setInterval(() => UI.mining(), 1000);
      setInterval(() => State.save(), 3000);
    })(),
    7000
  );

  await splash.finish();
}

window.addEventListener("load", startGame);