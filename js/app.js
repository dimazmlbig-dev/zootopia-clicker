const tg = window.Telegram.WebApp;

const LEVEL_CONFIG = [
  { tapPower: 1, xpToNext: 100 },
  { tapPower: 2, xpToNext: 250 },
  { tapPower: 3, xpToNext: 500 },
  { tapPower: 4, xpToNext: 1000 },
  // добавь остальные уровни по необходимости
];

let state = {
  bones: 0,
  zoo: 0,
  energy: 1000,
  maxEnergy: 1000,
  level: 1,
  xp: 0,
  tapPower: 1,
  totalTaps: 0,
  referredCount: 0,
  refCode: null,
  referredBy: null,
  mining: { level: 1, availableToCollect: 0, lastUpdate: Date.now() },
  tasks: {}
};

let isAppInitialized = false;

function loadGame() {
  const saved = StorageManager.loadState();
  if (saved) {
    Object.assign(state, saved);
    if (typeof state.totalTaps !== 'number') state.totalTaps = 0;
    if (typeof state.referredCount !== 'number') state.referredCount = 0;
    if (!state.refCode) state.refCode = 'guest_' + Date.now();
  }
  state.tapPower = LEVEL_CONFIG[state.level - 1]?.tapPower || 1;
}

const ReferralManager = {
  claimReferralBonus() {
    const startParam = tg?.initDataUnsafe?.start_param;
    if (startParam && startParam.startsWith('ref_') && !state.referredBy) {
      const referrerId = startParam.slice(4);
      state.referredBy = referrerId;
      state.bones += 10000;
      tg?.showAlert('Ты пришёл по реферальной ссылке! +10 000 bones 🎉');
      updateUI();
    }
  },

  shareReferral() {
    if (!state.refCode) return;

    const botUsername = tg.initDataUnsafe?.bot_username || 'zooclikbot';
    const refLink = `https://t.me/${botUsername}?start=ref_${state.refCode}`;
    tg?.shareUrl(refLink, 'Заходи в Zootopia Clicker и фарми bones вместе со мной! 🐶💰');
  }
};

function initializeApp() {
  if (isAppInitialized) return;
  isAppInitialized = true;

  loadGame();
  tg.ready();
  tg.expand();

  const user = tg.initDataUnsafe?.user;
  if (user) {
    document.getElementById('user-name')?.innerText = user.first_name || 'Игрок';
    if (user.photo_url) document.querySelector('.avatar')?.setAttribute('src', user.photo_url);

    if (!state.refCode && user.id) {
      state.refCode = user.id.toString();
    }
  }

  ReferralManager.claimReferralBonus();

  setInterval(() => StorageManager.saveState(state), 5000);

  tg.onEvent('viewportChanged', (payload) => {
    if (!payload.isStateStable) StorageManager.saveState(state);
  });

  setInterval(() => {
    if (state.energy < state.maxEnergy) {
      state.energy += 1;
      updateUI();
    }
  }, 3000);

  window.addEventListener('focus', () => {
    if (typeof MiningManager !== 'undefined' && MiningManager.calculateOfflineProduction) {
      MiningManager.calculateOfflineProduction();
      if (MiningManager.updateMiningUI) MiningManager.updateMiningUI();
      updateUI();
    }
  });

  document.getElementById('share-ref-btn')?.addEventListener('click', ReferralManager.shareReferral);

  document.getElementById('tap-zone')?.addEventListener('click', handleTap);

  showTab('main');
  updateUI();
  if (typeof MiningManager !== 'undefined' && MiningManager.updateMiningUI) MiningManager.updateMiningUI();
  if (typeof TaskManager !== 'undefined' && TaskManager.updateTasksUI) TaskManager.updateTasksUI();
}

function handleTap() {
  if (state.energy <= 0) {
    tg?.HapticFeedback?.notificationOccurred('error');
    return;
  }

  state.bones += state.tapPower;
  state.energy -= 1;
  state.xp += 1;
  state.totalTaps += 1;

  if (typeof TaskManager !== 'undefined' && TaskManager.checkProgress) {
    TaskManager.checkProgress();
  }

  updateUI();
  tg?.HapticFeedback?.impactOccurred('light');
}

function updateUI() {
  document.getElementById('current-energy').textContent = `${Math.floor(state.energy)}/${state.maxEnergy}`;
  document.getElementById('energy-bar').style.width = `${(state.energy / state.maxEnergy) * 100}%`;

  document.getElementById('bones-count').textContent = Math.floor(state.bones).toLocaleString();
  document.getElementById('zoo-count').textContent = Math.floor(state.zoo).toLocaleString();

  document.getElementById('level-text').textContent = `Уровень ${state.level}`;

  const refBtn = document.getElementById('share-ref-btn');
  if (refBtn) refBtn.textContent = `Поделиться рефералкой (${state.referredCount}/5)`;

  const refCodeEl = document.getElementById('ref-code-display');
  if (refCodeEl) refCodeEl.textContent = state.refCode || '---';
}

function showTab(tabId) {
  document.querySelectorAll('.tab-content').forEach(tab => tab.classList.add('hidden'));
  document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));

  document.getElementById(`tab-${tabId}`).classList.remove('hidden');
  document.querySelector(`[data-tab="${tabId}"]`).classList.add('active');
}

window.addEventListener('load', initializeApp);
