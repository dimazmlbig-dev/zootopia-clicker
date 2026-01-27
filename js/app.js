// js/app.js — исправлено: "Пропустить" всегда открывает игру, нет зависаний.
// + модалка Wallet + TON balance через твой Worker.

function wait(ms) { return new Promise(r => setTimeout(r, ms)); }

function withTimeout(promise, ms, onTimeout) {
  let t;
  const timeout = new Promise((resolve) => {
    t = setTimeout(() => resolve(onTimeout?.()), ms);
  });
  return Promise.race([promise, timeout]).finally(() => clearTimeout(t));
}

const tg = window.Telegram?.WebApp || null;

/** === CONFIG === **/
const WORKER_BASE = "https://zootopia-backend.dimazmlbig.workers.dev";

/** === SAVE STATUS UI === **/
function setSaveStatus(text, cls) {
  const dot = document.getElementById("save-dot");
  const t = document.getElementById("save-text");
  if (!dot || !t) return;
  dot.classList.remove("ok", "bad", "work");
  if (cls) dot.classList.add(cls);
  t.innerText = text || "Сохранение: —";
}

/** === SPLASH === **/
const Splash = (() => {
  const MIN_SHOW_MS = 500;
  const MAX_WAIT_MS = 9000;

  let startedAt = 0;
  let finished = false;
  let finishCb = null;

  const el = (id) => document.getElementById(id);

  function setStatus(text) {
    const s = el("splash-status");
    if (s) s.innerText = text || "";
  }

  function showTapToStart() { el("splash-tap")?.classList.remove("hidden"); }

  function hideSplash() {
    const splash = el("splash-screen");
    if (splash) splash.classList.add("hidden");
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

    const elapsed = Date.now() - startedAt;
    if (elapsed < MIN_SHOW_MS) await wait(MIN_SHOW_MS - elapsed);

    try { el("splash-video")?.pause?.(); } catch {}
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

    // Важно: на мобиле лучше слушать и click и touchstart
    const bindForceFinish = (node) => {
      if (!node) return;
      const handler = (e) => { e.preventDefault(); e.stopPropagation(); finish(); };
      node.addEventListener("click", handler, { passive: false });
      node.addEventListener("touchstart", handler, { passive: false });
    };

    bindForceFinish(skipBtn);

    setStatus("Загрузка...");

    const played = await tryPlayVideo(video);
    if (!played) {
      showTapToStart();
      setStatus("Нажми, чтобы начать");
      bindForceFinish(tapBtn);
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

/** === STATE (local safe) === **/
const State = (() => {
  let _state = null;

  async function init() {
    if (_state) return _state;

    const loaded = await withTimeout(StorageManager.loadStateAsync(), 2000, () => null);
    _state = loaded || StorageManager.defaultState();
    return _state;
  }

  function get() {
    if (!_state) throw new Error("State not initialized");
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

/** === UI === **/
const UI = {
  updateBalance() {
    const s = State.get();
    document.getElementById("bones-count").innerText = s.bones | 0;
    document.getElementById("zoo-count").innerText = s.zoo | 0;
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
  },

  updateWalletPill(address) {
    const el = document.getElementById("wallet-address");
    if (!el) return;
    el.innerText = address ? TonConnectManager.shorten(address) : "Кошелёк";
  },

  updateWalletModal() {
    const s = State.get();
    const addr = s.walletAddress || "—";
    document.getElementById("wallet-full-address").innerText = addr;
    document.getElementById("receive-addr").innerText = addr;

    document.getElementById("zoo-balance").innerText = String(s.zoo | 0);
    document.getElementById("ton-balance").innerText = Number(s.tonBalance || 0).toFixed(2);

    // цены — пока заглушки
    const zooUsd = (s.zoo || 0) * 0.0001;
    const tonUsd = (s.tonBalance || 0) * 3.0;
    document.getElementById("zoo-usd").innerText = `≈ $${zooUsd.toFixed(2)}`;
    document.getElementById("ton-usd").innerText = `≈ $${tonUsd.toFixed(2)}`;
  }
};
window.UI = UI;

/** === ENERGY === **/
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
  }
};
window.Energy = Energy;

/** === CLICKER === **/
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
    setTimeout(() => img.classList.remove("tap"), 150);
  }
};
window.Clicker = Clicker;

/** === MINING === **/
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

    State.save();
    UI.updateBalance();
    UI.updateMiningInfo();
    UI.updateWalletModal();
  }
};
window.Mining = Mining;

/** === REFERRALS === **/
const ReferralManager = {
  shareReferral() {
    const s = State.get();
    if (!s.refCode) return;

    const link = `https://t.me/zooclikbot?start=ref_${s.refCode}`;
    if (tg?.openTelegramLink) {
      const url = `https://t.me/share/url?url=${encodeURIComponent(link)}&text=${encodeURIComponent("Залетай в Zootopia Clicker 🐶")}`;
      tg.openTelegramLink(url);
    } else {
      navigator.clipboard?.writeText(link);
      alert("Ссылка скопирована:\n" + link);
    }
  },
  claimReferralBonus() {
    // backend later
  }
};
window.ReferralManager = ReferralManager;

/** === TABS === **/
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

/** === WALLET MODAL === **/
function openWallet() {
  document.getElementById("wallet-modal")?.classList.remove("hidden");
  document.getElementById("wallet-modal")?.setAttribute("aria-hidden", "false");
  document.getElementById("send-panel")?.classList.add("hidden");
  document.getElementById("receive-panel")?.classList.add("hidden");
  UI.updateWalletModal();
}
function closeWallet() {
  document.getElementById("wallet-modal")?.classList.add("hidden");
  document.getElementById("wallet-modal")?.setAttribute("aria-hidden", "true");
}
function initWalletModal() {
  document.getElementById("open-wallet")?.addEventListener("click", openWallet);
  document.getElementById("wallet-close")?.addEventListener("click", closeWallet);
  document.getElementById("wallet-backdrop")?.addEventListener("click", closeWallet);

  document.getElementById("btn-receive")?.addEventListener("click", () => {
    document.getElementById("send-panel")?.classList.add("hidden");
    document.getElementById("receive-panel")?.classList.remove("hidden");
  });

  document.getElementById("btn-send")?.addEventListener("click", () => {
    document.getElementById("receive-panel")?.classList.add("hidden");
    document.getElementById("send-panel")?.classList.remove("hidden");
  });

  document.getElementById("copy-addr")?.addEventListener("click", async () => {
    const s = State.get();
    if (!s.walletAddress) return;
    try { await navigator.clipboard.writeText(s.walletAddress); } catch {}
  });

  document.getElementById("disconnect-btn")?.addEventListener("click", async () => {
    await TonConnectManager.disconnect();
  });

  document.getElementById("send-confirm")?.addEventListener("click", async () => {
    const to = document.getElementById("send-to").value.trim();
    const amt = document.getElementById("send-amt").value.trim();
    if (!to) return alert("Введи адрес");
    if (!amt) return alert("Введи сумму TON");

    // amount TON -> nano (простая конверсия)
    const nano = String(Math.floor(Number(amt) * 1e9));
    if (!/^\d+$/.test(nano)) return alert("Неверная сумма");

    try {
      await TonConnectManager.sendTon(to, nano, "Zootopia Clicker");
      alert("Транзакция отправлена (подтверди в кошельке)");
    } catch (e) {
      alert("Ошибка: " + (e?.message || e));
    }
  });
}

/** === TELEGRAM INIT === **/
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

/** === TON BALANCE via Worker === **/
async function fetchTonBalance(address) {
  if (!address) return 0;
  try {
    const r = await withTimeout(
      fetch(`${WORKER_BASE}/ton/balance?address=${encodeURIComponent(address)}`),
      4000,
      () => null
    );
    if (!r || !r.ok) return 0;
    const j = await r.json();
    const nano = Number(j?.balance || 0); // tonapi returns nano in "balance"
    const ton = nano / 1e9;
    return Number.isFinite(ton) ? ton : 0;
  } catch {
    return 0;
  }
}

/** === UI bind === **/
function bindUI() {
  document.getElementById("tap-zone")?.addEventListener("click", () => Clicker.tap());
  document.getElementById("share-ref-btn")?.addEventListener("click", () => ReferralManager.shareReferral());
  document.getElementById("collect-btn")?.addEventListener("click", () => Mining.collect());

  document.getElementById("pay-01-ton-btn")?.addEventListener("click", async () => {
    try {
      const TO_ADDRESS = "UQCJRRRYnrs_qsA2AgIE71dPsHf_-AKaZV9UMeT4vBbh6Yes";
      const AMOUNT_NANO = "100000000"; // 0.1 TON

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
  initWalletModal();

  // tasks render
  window.Tasks?.render?.("tasks-list");
}

/** === Autosave === **/
function startAutosave() {
  setInterval(async () => {
    setSaveStatus("Сохранение: Local…", "work");
    await State.save();
    setSaveStatus("Сохранение: Local OK", "ok");
  }, 2500);
}

/** === show game === **/
function showGame() {
  const main = document.getElementById("main-content");
  main?.classList.remove("hidden");
}

/** === errors to splash === **/
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

/** === START === **/
async function startGame() {
  const splash = await Splash.start();
  attachGlobalErrorToSplash(splash.setStatus);

  splash.onFinish(() => {
    showGame();
  });

  splash.setStatus("Загрузка...");

  await withTimeout((async () => {
    await State.init();
    initTelegram();

    // TonConnect: init + sync address
    TonConnectManager.onChange(async (addr) => {
      const s = State.get();
      s.walletAddress = addr || "";
      UI.updateWalletPill(addr || "");
      await State.save();

      if (addr) {
        setSaveStatus("Сохранение: TON balance…", "work");
        const ton = await fetchTonBalance(addr);
        s.tonBalance = ton;
        State.set(s);
        await State.save();
        UI.updateWalletModal();
        setSaveStatus("Сохранение: OK", "ok");
      } else {
        UI.updateWalletModal();
      }
    });

    await TonConnectManager.init();

    bindUI();
    ReferralManager.claimReferralBonus();
    Energy.start();
    startAutosave();

    UI.updateBalance();
    UI.updateEnergy();
    UI.updateReferral();
    UI.updateMiningInfo();
    UI.updateWalletPill(State.get().walletAddress);

    setInterval(() => UI.updateMiningInfo(), 1000);
  })(), 6000, async () => {
    console.warn("Init timeout → opening game anyway");
    splash.setStatus("Запуск...");
    showGame();
  });

  showGame();
  await splash.finish();
}

window.addEventListener("load", () => {
  startGame().catch((e) => console.error("startGame error:", e));
});