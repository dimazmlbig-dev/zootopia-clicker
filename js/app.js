// js/app.js — полноценная инициализация, страницы, тапы, реген энергии, майнинг, автосейв

(() => {
  const tg = window.Telegram?.WebApp || null;

  const $ = (id) => document.getElementById(id);

  const el = {
    app: $("app"),
    stage: $("stage"),
    tapZone: $("tap-zone"),
    dogImg: $("dog-img"),

    score: $("score"),
    zooBalance: $("zoo-balance"),

    userName: $("user-name"),

    energyNow: $("energy-now"),
    energyMax: $("energy-max"),
    energyFill: $("energy-fill"),

    miningAvail: $("mining-available"),
    miningLevel: $("mining-level"),
    miningUpgradeCost: $("mining-upgrade-cost"),
    btnCollect: $("btn-collect"),
    btnUpgradeMining: $("btn-upgrade-mining"),

    walletShort: $("wallet-short"),
    walletAddress: $("wallet-address"),
    btnSendTon: $("btn-send-ton"),

    navBtns: Array.from(document.querySelectorAll(".nav-btn")),
    pages: {
      clicker: $("page-clicker"),
      nft: $("page-nft"),
      tasks: $("page-tasks"),
      wallet: $("page-wallet")
    }
  };

  let state = StorageManager.defaultState();
  let inited = false;

  function setState(next) {
    state = next;
    StorageManager.saveStateDebounced(state);
  }

  function shortAddr(a) {
    if (!a) return "";
    if (a.length <= 12) return a;
    return `${a.slice(0, 6)}…${a.slice(-6)}`;
  }

  function clamp(n, min, max) {
    return Math.max(min, Math.min(max, n));
  }

  function updateEnergyUI() {
    el.energyNow.textContent = String(state.energy);
    el.energyMax.textContent = String(state.maxEnergy);
    const p = (state.maxEnergy <= 0) ? 0 : (state.energy / state.maxEnergy);
    el.energyFill.style.width = `${Math.round(clamp(p, 0, 1) * 100)}%`;
  }

  function updateTopUI() {
    el.score.textContent = String(state.bones);
    el.zooBalance.textContent = String(Math.floor(state.zoo));
  }

  function updateMiningUI() {
    el.miningAvail.textContent = String(Math.floor(state.mining.available));
    el.miningLevel.textContent = String(state.mining.level);
    const cost = miningUpgradeCost(state.mining.level);
    el.miningUpgradeCost.textContent = String(cost);
  }

  function updateWalletUI() {
    const addr = state.wallet.address || TonConnectManager.getAddress();
    const ok = !!addr;

    el.walletAddress.textContent = ok ? addr : "Не подключён";
    el.walletShort.textContent = ok ? shortAddr(addr) : "Кошелёк не подключён";
    el.btnSendTon.disabled = true; // демо выключено
  }

  function updateUI() {
    updateTopUI();
    updateEnergyUI();
    updateMiningUI();
    updateWalletUI();

    // перерисовать списки (NFT/Tasks) только если страницы есть
    NFT.render({ state, setState, updateUI });
    Tasks.render({ state, setState, updateUI });
  }

  function showPage(key) {
    for (const k of Object.keys(el.pages)) {
      el.pages[k].classList.toggle("hidden", k !== key);
    }
    for (const b of el.navBtns) {
      b.classList.toggle("active", b.dataset.page === key);
    }

    // stage (собака) показываем всегда, но логически это clicker-экран.
    // Если хочешь: скрывать собаку на других страницах — раскомментируй:
    // el.stage.classList.toggle("hidden", key !== "clicker");
  }

  function bindNav() {
    for (const b of el.navBtns) {
      b.addEventListener("click", () => showPage(b.dataset.page));
    }
  }

  // ===== Game mechanics =====
  function miningRatePerSecond(level) {
    // простая формула: 0.02 * level $ZOO в секунду (≈ 1.2 * level в минуту)
    return 0.02 * level;
  }

  function miningUpgradeCost(level) {
    // рост стоимости
    return Math.floor(100 * Math.pow(1.6, level - 1));
  }

  function tickMining() {
    const now = Date.now();
    const dt = Math.max(0, (now - state.mining.lastTick) / 1000);
    state.mining.lastTick = now;

    const gain = miningRatePerSecond(state.mining.level) * dt;
    state.mining.available += gain;
    setState(state);
  }

  function regenEnergy() {
    // +1 энергия каждые 1.2с (≈ 50/мин)
    if (state.energy < state.maxEnergy) {
      state.energy = Math.min(state.maxEnergy, state.energy + 1);
      setState(state);
    }
  }

  // ===== Tap handling (фикс Telegram Android) =====
  function doTap() {
    if (state.energy <= 0) return;

    state.energy -= 1;
    state.bones += 1;

    state.tasks.tapCount += 1;

    // маленький бонус в $ZOO за тапы (опционально)
    state.zoo += 0.001;

    setState(state);
    updateUI();

    // animation
    el.dogImg.classList.add("tap");
    setTimeout(() => el.dogImg.classList.remove("tap"), 120);
  }

  function bindTapZone() {
    // Важно: pointerdown/touchstart надёжнее click в Telegram Android
    const handler = (e) => {
      e.preventDefault();
      e.stopPropagation();
      doTap();
    };

    el.tapZone.addEventListener("pointerdown", handler, { passive: false });
    el.tapZone.addEventListener("touchstart", handler, { passive: false });
    el.tapZone.addEventListener("click", handler); // fallback
  }

  function bindMiningButtons() {
    el.btnCollect.addEventListener("click", () => {
      if (state.mining.available <= 0.01) return;
      state.zoo += state.mining.available;
      state.mining.available = 0;
      setState(state);
      updateUI();
    });

    el.btnUpgradeMining.addEventListener("click", () => {
      const cost = miningUpgradeCost(state.mining.level);
      if (state.bones < cost) {
        alert("Недостаточно bones");
        return;
      }
      state.bones -= cost;
      state.mining.level += 1;
      setState(state);
      updateUI();
    });
  }

  function bindWalletButtons() {
    el.btnSendTon.addEventListener("click", () => TonConnectManager.sendTransactionDemo());
  }

  // ===== Telegram init =====
  function initTelegramUI() {
    if (!tg) return;

    try {
      tg.ready();
      tg.expand();
      tg.disableVerticalSwipes?.();

      const u = tg.initDataUnsafe?.user;
      if (u) {
        const name = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
        el.userName.textContent = name || "Игрок";
      }
    } catch {}
  }

  // ===== Main init after splash =====
  async function startGame() {
    if (inited) return;
    inited = true;

    el.app.classList.remove("hidden");

    initTelegramUI();
    bindNav();
    bindTapZone();
    bindMiningButtons();
    bindWalletButtons();

    // load state
    const loaded = await StorageManager.loadStateAsync();
    state = loaded || StorageManager.defaultState();

    // init TON connect
    await TonConnectManager.init("./tonconnect-manifest.json");
    // при коннекте — обновляем адрес в стейте
    setInterval(() => {
      const addr = TonConnectManager.getAddress();
      if (addr && addr !== state.wallet.address) {
        state.wallet.address = addr;
        setState(state);
        updateWalletUI();
      }
    }, 1000);

    // first render
    showPage("clicker");
    updateUI();

    // loops
    setInterval(() => {
      tickMining();
      updateMiningUI();
    }, 1000);

    setInterval(() => {
      regenEnergy();
      updateEnergyUI();
    }, 1200);

    // safety autosave UI refresh
    setInterval(() => updateTopUI(), 2000);
  }

  // ===== Splash finish hook =====
  SplashController.onFinish(() => {
    startGame();
  });

  // если Telegram не даёт видео/сплеш — можно запускать по клику на body
  document.addEventListener("keydown", (e) => {
    if (e.key === "Enter") SplashController.finish();
  });
})();