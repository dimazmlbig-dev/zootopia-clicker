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
  };

  const store = window.App.createStore(initialState);
  window.App.store = store;

  const screen = document.getElementById("screen");
  const toastRoot = document.getElementById("toast-root");

  const refs = {};

  function formatNumber(value) {
    return new Intl.NumberFormat("ru-RU").format(Math.floor(value));
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
          <div class="metric-value">NFT</div>
          <p class="header-subtitle">Скоро здесь появятся ваши коллекции.</p>
          <div class="empty">Пока нет NFT</div>
        </div>
      </section>

      <section class="section" data-section="mint">
        <div class="card">
          <div class="metric-value">Mint</div>
          <p class="header-subtitle">Создавайте уникальные NFT.</p>
          <button class="button button-ghost" id="mint-placeholder">Скоро</button>
        </div>
      </section>

      <section class="section" data-section="market">
        <div class="card">
          <div class="metric-value">Market</div>
          <p class="header-subtitle">Торговая площадка в разработке.</p>
          <div class="empty">Скоро будет доступно</div>
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
  }

  function setActiveTab(tabId) {
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

  async function initAuthAndState() {
    try {
      await window.Auth.authenticate();
    } catch (error) {
      showToast("Не удалось пройти авторизацию");
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
  }

  function resolveTonConnect() {
    return window.TON_CONNECT_UI?.TonConnectUI || window.TonConnectUI || null;
  }

  async function initTonConnect() {
    const TonConnectUI = resolveTonConnect();
    if (!TonConnectUI) {
      showToast("TonConnect недоступен");
      return null;
    }

    const tc = new TonConnectUI({ manifestUrl: window.AppConfig.manifestUrl });
    tc.onStatusChange(async (walletInfo) => {
      if (walletInfo?.account?.address) {
        const address = walletInfo.account.address;
        store.update((draft) => {
          draft.wallet.connected = true;
          draft.wallet.address = address;
        });

        try {
          await window.App.apiFetch("/wallet/link", {
            method: "POST",
            body: JSON.stringify({ wallet_address: address }),
          });
          showToast("Кошелёк подключён");
        } catch (error) {
          showToast("Не удалось сохранить кошелёк");
        }
      } else {
        store.update((draft) => {
          draft.wallet.connected = false;
          draft.wallet.address = null;
        });
      }
    });

    return tc;
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

  async function start() {
    window.Telegram?.WebApp?.ready?.();
    window.Telegram?.WebApp?.expand?.();

    buildLayout();
    bindTabs();
    setupClicker();
    setupBonuses();
    store.subscribe(render);
    render(store.getState());

    await initAuthAndState();
    const tc = await initTonConnect();
    await initWallet(tc);
  }

  document.addEventListener("DOMContentLoaded", () => {
    start().catch((error) => {
      console.error(error);
      showToast("Ошибка запуска приложения");
    });
  });
})();
