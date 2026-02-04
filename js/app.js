(function () {
  const initialState = {
    user: { id: null, name: "Гость", username: null },
    ui: {
      tab: "click",
      loading: true,
      toast: null,
      reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    },
    wallet: { connected: false, address: null },
    game: {
      balance: 0,
      energy: 0,
      energyMax: 20,
      level: 1,
      levelProgress: 0,
      multiplier: 1,
    },
    server: { version: 0, lastSync: null },
    collection: [],
    market: { listings: [] },
  };

  const store = window.App.createStore(initialState);
  window.App.store = store;

  const screen = document.getElementById("screen");
  const toastRoot = document.getElementById("toast-root");
  const modalRoot = document.getElementById("modal-root");
  const sheetRoot = document.getElementById("sheet-root");

  const refs = {};

  const mintState = {
    mode: "quick",
    status: "idle",
    requestId: null,
    previewUrl: null,
    nftAddress: null,
    tokenId: null,
    listingMode: false,
  };

  let tonConnectInstance = null;
  let pendingWalletLink = null;
  let mintPollTimer = null;
  let lastActiveTab = "click";

  function formatNumber(value) {
    return new Intl.NumberFormat("ru-RU").format(Math.floor(value));
  }

  function formatTon(value) {
    if (!value && value !== 0) return "—";
    return Number(value).toLocaleString("ru-RU", { maximumFractionDigits: 2 });
  }

  function showToast(message) {
    if (!toastRoot) return;
    toastRoot.innerHTML = "";
    const toast = document.createElement("div");
    toast.className = "toast";
    toast.textContent = message;
    toastRoot.appendChild(toast);
    setTimeout(() => {
      toastRoot.innerHTML = "";
    }, 2500);
  }

  function showModal({ title, message, actions = [] }) {
    if (!modalRoot) return;
    const actionsHtml = actions
      .map(
        (action, index) =>
          `<button class="button ${action.secondary ? "button-secondary" : ""}" data-modal-action="${index}">${action.label}</button>`
      )
      .join("");

    modalRoot.innerHTML = `
      <div class="modal">
        <h3>${title}</h3>
        <p>${message}</p>
        <div class="mint-actions">${actionsHtml}</div>
      </div>
    `;
    modalRoot.classList.add("is-visible");
    modalRoot.querySelectorAll("[data-modal-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const index = Number(btn.dataset.modalAction);
        const action = actions[index];
        if (action?.onClick) action.onClick();
        hideModal();
      });
    });
  }

  function hideModal() {
    if (!modalRoot) return;
    modalRoot.classList.remove("is-visible");
    modalRoot.innerHTML = "";
  }

  window.App.onSyncError = function () {
    showToast("Синхронизация недоступна");
  };

  function buildLayout() {
    if (!screen) return;
    screen.innerHTML = `
      <div class="header">
        <div class="header-title">Zootopia Clicker</div>
        <div class="header-subtitle" id="user-title">Загрузка...</div>
      </div>

      <section class="section is-active" data-section="click">
        <div class="card">
          <div class="card-header">
            <div class="metric">
              <div class="metric-label">Баланс</div>
              <div class="metric-value" id="balance-value">0</div>
            </div>
            <span class="tag" id="level-tag">Ур. 1</span>
          </div>
          <div class="progress" aria-label="Прогресс уровня">
            <div class="progress-bar" id="level-progress"></div>
          </div>
        </div>

        <button class="clicker-button" id="clicker-button" aria-label="Кликер">
          Тапай быстрее!
        </button>

        <div class="stats-grid">
          <div class="card">
            <div class="metric">
              <div class="metric-label">Энергия</div>
              <div class="metric-value" id="energy-value">0/0</div>
            </div>
          </div>
          <div class="card">
            <div class="metric">
              <div class="metric-label">Множитель</div>
              <div class="metric-value" id="multiplier-value">x1</div>
            </div>
          </div>
        </div>
      </section>

      <section class="section" data-section="tasks">
        <div class="card">
          <div class="card-header">
            <div>
              <div class="metric-label">Бонусы</div>
              <div class="metric-value">Ежедневные награды</div>
            </div>
            <button class="button button-secondary" id="claim-reward">Забрать</button>
          </div>
          <div class="list" id="bonus-list"></div>
        </div>
      </section>

      <section class="section" data-section="nft">
        <div class="card">
          <div class="metric-value">Коллекция NFT</div>
          <p class="header-subtitle">Храните и управляйте своими NFT.</p>
          <div class="list" id="nft-list"></div>
          <div class="empty" id="nft-empty">Пока нет NFT</div>
        </div>
      </section>

      <section class="section" data-section="mint">
        <div class="card">
          <div class="card-header">
            <div>
              <div class="metric-label">Mint</div>
              <div class="metric-value">Создать NFT</div>
            </div>
            <span class="tag">TON</span>
          </div>
          <div class="pill-group" id="mint-mode-group">
            <button class="pill is-active" data-mint-mode="quick">Quick · 0.5 TON</button>
            <button class="pill" data-mint-mode="forge">Forge · 5 TON</button>
          </div>
          <div class="mint-actions" style="margin-top: 16px;">
            <button class="button" id="mint-start">Создать NFT</button>
            <div class="header-subtitle" id="mint-status">Готовы к минта?</div>
          </div>
        </div>

        <div class="card">
          <div class="metric-value">Результат минта</div>
          <div class="mint-preview" id="mint-preview" hidden>
            <img id="mint-preview-image" src="" alt="NFT preview" />
          </div>
          <div class="mint-result" id="mint-result" hidden></div>
          <div class="mint-actions" id="mint-result-actions" hidden>
            <button class="button button-secondary" id="mint-keep">Оставить в коллекции</button>
            <button class="button" id="mint-list">Выставить на Market</button>
          </div>
          <div class="mint-actions" id="mint-listing" hidden>
            <input class="input" id="mint-price" type="number" inputmode="decimal" min="0" step="0.1" placeholder="Цена в TON" />
            <div class="price-presets">
              <button class="pill" data-price="0.8">0.8 TON</button>
              <button class="pill" data-price="1.5">1.5 TON</button>
              <button class="pill" data-price="3">3 TON</button>
            </div>
            <button class="button" id="mint-list-submit">Выставить</button>
          </div>
        </div>
      </section>

      <section class="section" data-section="market">
        <div class="card">
          <div class="metric-value">Market</div>
          <p class="header-subtitle">Листинги и покупки за TON.</p>
          <div class="list" id="market-list"></div>
          <div class="empty" id="market-empty">Пока нет активных листингов</div>
        </div>
      </section>

      <section class="section" data-section="wallet">
        <div class="card">
          <div class="metric-value">Кошелёк</div>
          <p class="header-subtitle" id="wallet-status">Не подключён</p>
          <button class="button" id="wallet-button">Подключить</button>
        </div>
      </section>

      <section class="section" data-section="ai">
        <div class="card">
          <div class="metric-value">AI</div>
          <p class="header-subtitle">Персональные рекомендации скоро.</p>
          <div class="empty">Нет сценариев</div>
        </div>
      </section>

      <section class="section" data-section="settings">
        <div class="card">
          <div class="metric-value">Настройки</div>
          <p class="header-subtitle">Управляйте уведомлениями и приватностью.</p>
          <div class="empty">Скоро появятся новые параметры</div>
        </div>
      </section>
    `;

    refs.userTitle = document.getElementById("user-title");
    refs.balance = document.getElementById("balance-value");
    refs.energy = document.getElementById("energy-value");
    refs.multiplier = document.getElementById("multiplier-value");
    refs.levelTag = document.getElementById("level-tag");
    refs.levelProgress = document.getElementById("level-progress");
    refs.clickerButton = document.getElementById("clicker-button");
    refs.walletStatus = document.getElementById("wallet-status");
    refs.walletButton = document.getElementById("wallet-button");
    refs.claimReward = document.getElementById("claim-reward");
    refs.bonusList = document.getElementById("bonus-list");
    refs.nftList = document.getElementById("nft-list");
    refs.nftEmpty = document.getElementById("nft-empty");
    refs.marketList = document.getElementById("market-list");
    refs.marketEmpty = document.getElementById("market-empty");
    refs.mintStatus = document.getElementById("mint-status");
    refs.mintPreview = document.getElementById("mint-preview");
    refs.mintPreviewImage = document.getElementById("mint-preview-image");
    refs.mintResult = document.getElementById("mint-result");
    refs.mintResultActions = document.getElementById("mint-result-actions");
    refs.mintListing = document.getElementById("mint-listing");
    refs.mintPrice = document.getElementById("mint-price");
  }

  function renderCollection(state) {
    if (!refs.nftList || !refs.nftEmpty) return;
    const items = state.collection || [];
    refs.nftList.innerHTML = items
      .map(
        (item) => `
        <div class="list-item">
          <div>
            <div>Token #${item.tokenId || "—"}</div>
            <div class="header-subtitle">${item.address || "NFT minted"}</div>
          </div>
          <span class="tag">${item.source || "Mint"}</span>
        </div>
      `
      )
      .join("");
    refs.nftEmpty.style.display = items.length ? "none" : "block";
  }

  function renderMarket(state) {
    if (!refs.marketList || !refs.marketEmpty) return;
    const listings = state.market?.listings || [];
    refs.marketList.innerHTML = listings
      .map(
        (item) => `
        <div class="list-item">
          <div>
            <div>Token #${item.tokenId || "—"}</div>
            <div class="header-subtitle">${formatTon(item.price)} TON</div>
          </div>
          <span class="tag">${item.status || "Listed"}</span>
        </div>
      `
      )
      .join("");
    refs.marketEmpty.style.display = listings.length ? "none" : "block";
  }

  function renderMint() {
    if (!refs.mintStatus) return;
    const statusMap = {
      idle: "Готовы к минта?",
      preparing: "Подготовка транзакции...",
      pending: "Ожидаем подтверждение...",
      minted: "NFT успешно создан!",
      error: "Ошибка минта",
    };

    refs.mintStatus.textContent = statusMap[mintState.status] || "";

    if (mintState.previewUrl) {
      refs.mintPreview.hidden = false;
      refs.mintPreviewImage.src = mintState.previewUrl;
    } else {
      refs.mintPreview.hidden = true;
      refs.mintPreviewImage.src = "";
    }

    if (mintState.status === "minted") {
      refs.mintResult.hidden = false;
      refs.mintResult.textContent = `NFT ${mintState.tokenId ? `#${mintState.tokenId}` : ""} ${mintState.nftAddress || ""}`.trim();
      refs.mintResultActions.hidden = false;
    } else {
      refs.mintResult.hidden = true;
      refs.mintResultActions.hidden = true;
    }

    refs.mintListing.hidden = !mintState.listingMode;
  }

  function render(state) {
    if (!refs.balance) return;

    const fullName = state.user.name || "Игрок";
    refs.userTitle.textContent = `Привет, ${fullName}`;
    refs.balance.textContent = formatNumber(state.game.balance);
    refs.energy.textContent = `${state.game.energy}/${state.game.energyMax}`;
    refs.multiplier.textContent = `x${state.game.multiplier}`;
    refs.levelTag.textContent = `Ур. ${state.game.level}`;
    const progress = Math.min(100, Math.max(0, state.game.levelProgress * 100));
    refs.levelProgress.style.width = `${progress}%`;

    if (state.wallet.connected) {
      refs.walletStatus.textContent = `Подключён: ${state.wallet.address}`;
      refs.walletButton.textContent = "Сменить кошелёк";
    } else {
      refs.walletStatus.textContent = "Не подключён";
      refs.walletButton.textContent = "Подключить";
    }

    if (state.ui.loading) {
      refs.balance.classList.add("skeleton");
    } else {
      refs.balance.classList.remove("skeleton");
    }

    renderCollection(state);
    renderMarket(state);
  }

  function setActiveTab(tabId) {
    if (tabId === "menu") {
      openMenuSheet();
      return;
    }

    lastActiveTab = tabId;

    document.querySelectorAll(".tab").forEach((tab) => {
      const isActive = tab.dataset.tab === tabId;
      tab.classList.toggle("is-active", isActive);
      tab.setAttribute("aria-selected", isActive ? "true" : "false");
    });

    document.querySelectorAll(".section").forEach((section) => {
      section.classList.toggle("is-active", section.dataset.section === tabId);
    });

    store.update((draft) => {
      draft.ui.tab = tabId;
    });
  }

  function bindTabs() {
    document.querySelectorAll(".tab").forEach((tab) => {
      tab.addEventListener("click", () => setActiveTab(tab.dataset.tab));
    });
  }

  function openMenuSheet() {
    if (!sheetRoot) return;
    sheetRoot.classList.add("is-visible");
    sheetRoot.setAttribute("aria-hidden", "false");
    const menuTab = document.querySelector(".tab[data-tab=\"menu\"]");
    if (menuTab) menuTab.classList.add("is-active");
  }

  function closeMenuSheet() {
    if (!sheetRoot) return;
    sheetRoot.classList.remove("is-visible");
    sheetRoot.setAttribute("aria-hidden", "true");
    const menuTab = document.querySelector(".tab[data-tab=\"menu\"]");
    if (menuTab) menuTab.classList.remove("is-active");
  }

  function bindMenuSheet() {
    if (!sheetRoot) return;
    sheetRoot.querySelector("[data-sheet-close]")?.addEventListener("click", closeMenuSheet);
    sheetRoot.querySelectorAll("[data-sheet-target]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const target = btn.dataset.sheetTarget;
        closeMenuSheet();
        if (target) setActiveTab(target);
      });
    });
  }

  function setupClicker() {
    refs.clickerButton?.addEventListener("click", async () => {
      const state = store.getState();
      if (state.game.energy <= 0) {
        showToast("Энергия закончилась");
        return;
      }

      store.update((draft) => {
        draft.game.energy = Math.max(0, draft.game.energy - 1);
        draft.game.balance += draft.game.multiplier;
        draft.game.levelProgress = (draft.game.balance % 100) / 100;
        draft.game.level = Math.floor(draft.game.balance / 100) + 1;
      });

      try {
        window.App.stateSync.enqueueTap(store, 1);
      } catch (error) {
        showToast("Не удалось отправить тап");
      }
    });
  }

  function setupBonuses() {
    const bonuses = [
      { id: "daily", title: "Ежедневный бонус", value: "+50" },
      { id: "streak", title: "Серия", value: "+20" },
    ];

    refs.bonusList.innerHTML = bonuses
      .map(
        (bonus) => `
        <div class="list-item">
          <div>
            <div>${bonus.title}</div>
            <div class="header-subtitle">Доступно сейчас</div>
          </div>
          <span class="tag">${bonus.value}</span>
        </div>
      `
      )
      .join("");

    refs.claimReward?.addEventListener("click", async () => {
      try {
        await window.App.stateSync.sendCommand(store, "/command/claim", { reward_id: "daily" });
        showToast("Бонус получен");
      } catch (error) {
        showToast("Не удалось забрать бонус");
      }
    });
  }

  async function linkWallet(address) {
    if (!address) return;
    if (!window.Auth.isAuthenticated()) {
      pendingWalletLink = address;
      showToast("Сначала авторизуйтесь");
      return;
    }

    try {
      await window.App.apiFetch("/wallet/link", {
        method: "POST",
        body: JSON.stringify({ wallet_address: address }),
      });
      showToast("Кошелёк подключён");
      pendingWalletLink = null;
    } catch (error) {
      showToast("Не удалось сохранить кошелёк");
    }
  }

  async function initAuthAndState() {
    try {
      await window.Auth.authenticate();
    } catch (error) {
      if (error?.code === "init_data_missing") {
        showModal({
          title: "Откройте приложение в Telegram",
          message: "Для входа нужен Telegram ID. Запустите мини-приложение из Telegram.",
          actions: [{ label: "Понятно", secondary: true }],
        });
      } else if (error?.code === "auth_failed") {
        showModal({
          title: "Ошибка авторизации",
          message: "Не удалось подтвердить Telegram ID. Попробуйте открыть мини-приложение снова.",
          actions: [{ label: "Закрыть", secondary: true }],
        });
      } else {
        showToast("Не удалось пройти авторизацию");
      }
    }

    const user = window.Auth.getUser();
    if (user) {
      store.update((draft) => {
        draft.user.name = user.username ? `@${user.username}` : user.first_name || "Игрок";
      });
    }

    if (window.Auth.isAuthenticated()) {
      try {
        await window.App.stateSync.loadState(store);
        const me = await window.App.apiFetch("/me", { method: "GET" });
        const primaryWallet = me.wallets?.find((wallet) => wallet.is_primary);
        if (primaryWallet) {
          store.update((draft) => {
            draft.wallet.connected = true;
            draft.wallet.address = primaryWallet.wallet_address;
          });
        }
      } catch (error) {
        showToast("Не удалось загрузить прогресс");
        store.update((draft) => {
          draft.ui.loading = false;
        });
      }
    } else {
      store.update((draft) => {
        draft.ui.loading = false;
      });
    }

    if (pendingWalletLink) {
      await linkWallet(pendingWalletLink);
    }
  }

  function resolveTonConnect() {
    return (
      window.TON_CONNECT_UI?.TonConnectUI ||
      window.TON_CONNECT_UI?.default?.TonConnectUI ||
      window.TON_CONNECT_UI?.default ||
      window.TonConnectUI ||
      null
    );
  }

  async function initTonConnect() {
    if (tonConnectInstance) return tonConnectInstance;

    const TonConnectUI = resolveTonConnect();
    if (!TonConnectUI) {
      showToast("TonConnect недоступен");
      return null;
    }

    try {
      tonConnectInstance = new TonConnectUI({ manifestUrl: window.AppConfig.manifestUrl });
    } catch (error) {
      showToast("Не удалось инициализировать TonConnect");
      return null;
    }

    tonConnectInstance.onStatusChange(async (walletInfo) => {
      if (walletInfo?.account?.address) {
        const address = walletInfo.account.address;
        store.update((draft) => {
          draft.wallet.connected = true;
          draft.wallet.address = address;
        });

        await linkWallet(address);
      } else {
        store.update((draft) => {
          draft.wallet.connected = false;
          draft.wallet.address = null;
        });
      }
    });

    return tonConnectInstance;
  }

  async function initWallet(tc) {
    refs.walletButton?.addEventListener("click", async () => {
      if (!tc) {
        showToast("TonConnect недоступен");
        return;
      }

      try {
        await tc.openModal();
      } catch (error) {
        showToast("Не удалось открыть TonConnect");
      }
    });
  }

  async function sendTonTransaction(tc, tx) {
    if (!tc) {
      showToast("TonConnect недоступен");
      return false;
    }
    if (typeof tc.sendTransaction !== "function") {
      showToast("TonConnect не поддерживает транзакции");
      return false;
    }
    try {
      await tc.sendTransaction(tx);
      return true;
    } catch (error) {
      showToast("Не удалось отправить транзакцию");
      return false;
    }
  }

  function setMintState(patch) {
    Object.assign(mintState, patch);
    renderMint();
  }

  async function pollMintStatus(requestId) {
    if (!requestId) return;
    try {
      const response = await window.App.apiFetch(`/mint/status?request_id=${requestId}`, {
        method: "GET",
      });
      const status = response.status || response.state || "pending";
      setMintState({
        status: status === "minted" ? "minted" : "pending",
        previewUrl: response.image_url || response.preview_url || mintState.previewUrl,
        nftAddress: response.nft_address || mintState.nftAddress,
        tokenId: response.token_id || response.tokenId,
      });
      if (status === "minted") {
        stopMintPolling();
      }
    } catch (error) {
      setMintState({ status: "error" });
      stopMintPolling();
    }
  }

  function startMintPolling(requestId) {
    stopMintPolling();
    mintPollTimer = setInterval(() => pollMintStatus(requestId), 2500);
    pollMintStatus(requestId);
  }

  function stopMintPolling() {
    if (mintPollTimer) {
      clearInterval(mintPollTimer);
      mintPollTimer = null;
    }
  }

  async function handleMint(tc) {
    const wallet = store.getState().wallet.address;
    if (!wallet) {
      showToast("Подключите кошелёк");
      await tc?.openModal?.();
      return;
    }

    setMintState({ status: "preparing", listingMode: false });

    try {
      const response = await window.App.apiFetch("/mint/prepare", {
        method: "POST",
        body: JSON.stringify({ wallet, mode: mintState.mode }),
      });

      const requestId = response.request_id || response.requestId;
      const tx = response.tonconnect_tx || response.tx;

      if (!requestId || !tx) {
        throw new Error("invalid_mint_response");
      }

      const sent = await sendTonTransaction(tc, tx);
      if (!sent) {
        setMintState({ status: "error" });
        return;
      }

      setMintState({ status: "pending", requestId });
      startMintPolling(requestId);
    } catch (error) {
      setMintState({ status: "error" });
      showToast("Не удалось подготовить mint");
    }
  }

  async function handleListOnMarket(tc) {
    if (!mintState.tokenId) {
      showToast("Нет токена для листинга");
      return;
    }
    const wallet = store.getState().wallet.address;
    if (!wallet) {
      showToast("Подключите кошелёк");
      return;
    }
    const priceValue = refs.mintPrice ? refs.mintPrice.value : "";
    const price = Number(priceValue || 0);
    if (!price || price <= 0) {
      showToast("Введите цену в TON");
      return;
    }

    try {
      const response = await window.App.apiFetch("/tx/prepare-list", {
        method: "POST",
        body: JSON.stringify({
          wallet,
          token_id: mintState.tokenId,
          price_nanoton: Math.round(price * 1e9),
        }),
      });
      const tx = response.tonconnect_tx || response.tx;
      const sent = await sendTonTransaction(tc, tx);
      if (!sent) return;

      store.update((draft) => {
        draft.market.listings.unshift({
          tokenId: mintState.tokenId,
          price,
          status: "Listed",
        });
      });
      showToast("NFT выставлен на Market");
      setMintState({ listingMode: false });
      if (refs.mintPrice) refs.mintPrice.value = "";
      setActiveTab("market");
    } catch (error) {
      showToast("Не удалось выставить NFT");
    }
  }

  function setupMint(tc) {
    document.querySelectorAll("[data-mint-mode]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const mode = btn.dataset.mintMode;
        setMintState({ mode });
        document.querySelectorAll("[data-mint-mode]").forEach((other) => {
          other.classList.toggle("is-active", other.dataset.mintMode === mode);
        });
      });
    });

    document.getElementById("mint-start")?.addEventListener("click", () => handleMint(tc));
    document.getElementById("mint-keep")?.addEventListener("click", () => {
      store.update((draft) => {
        draft.collection.unshift({
          tokenId: mintState.tokenId,
          address: mintState.nftAddress,
          source: "Mint",
        });
      });
      showToast("NFT добавлен в коллекцию");
      setMintState({ listingMode: false });
      setActiveTab("nft");
    });
    document.getElementById("mint-list")?.addEventListener("click", () => {
      setMintState({ listingMode: true });
    });
    document.getElementById("mint-list-submit")?.addEventListener("click", () => handleListOnMarket(tc));
    document.querySelectorAll("[data-price]").forEach((btn) => {
      btn.addEventListener("click", () => {
        if (refs.mintPrice) refs.mintPrice.value = btn.dataset.price;
      });
    });
  }

  async function start() {
    window.Telegram?.WebApp?.ready?.();
    window.Telegram?.WebApp?.expand?.();

    buildLayout();
    bindTabs();
    bindMenuSheet();
    setupClicker();
    setupBonuses();
    store.subscribe(render);
    render(store.getState());
    renderMint();

    await initAuthAndState();
    const tc = await initTonConnect();
    await initWallet(tc);
    setupMint(tc);
  }

  document.addEventListener("DOMContentLoaded", () => {
    start().catch((error) => {
      console.error(error);
      showToast("Ошибка запуска приложения");
    });
  });
})();
