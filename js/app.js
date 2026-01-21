const tg = window.Telegram.WebApp;

let state = {
  bones: 0,
  zoo: 0,
  energy: 1000,
  maxEnergy: 1000,
  totalTaps: 0,
  referredCount: 0,
  refCode: null,
  referredBy: null,
  tasks: {}
};

function loadGame() {
  const saved = StorageManager.loadState();
  if (saved) {
    Object.assign(state, saved);
    if (typeof state.totalTaps !== 'number') state.totalTaps = 0;
    if (typeof state.referredCount !== 'number') state.referredCount = 0;
    if (!state.refCode) state.refCode = 'guest_' + Date.now();
  }
}

const ReferralManager = {
  claimReferralBonus() {
    const param = tg?.initDataUnsafe?.start_param;
    if (param && param.startsWith('ref_') && !state.referredBy) {
      state.referredBy = param.slice(4);
      state.bones += 10000;
      tg?.showAlert('По реферальной ссылке! +10 000 bones');
      updateUI();
    }
  },

  shareReferral() {
    const username = tg.initDataUnsafe?.bot_username || 'zooclikbot';
    const link = `https://t.me/${username}?start=ref_${state.refCode}`;
    tg?.shareUrl(link, 'Залетай в Zootopia Clicker!');
  }
};

function initializeApp() {
  tg.ready();
  tg.expand();

  loadGame();

  const user = tg.initDataUnsafe?.user;
  if (user) {
    document.getElementById('user-name').innerText = user.first_name || 'Игрок';
    if (!state.refCode && user.id) state.refCode = user.id.toString();
  }

  ReferralManager.claimReferralBonus();

  // Кнопка рефералки
  document.getElementById('share-ref-btn')?.addEventListener('click', ReferralManager.shareReferral);

  // Тапы
  document.getElementById('tap-zone')?.addEventListener('click', () => {
    if (state.energy > 0) {
      state.bones += 1;
      state.energy -= 1;
      state.totalTaps += 1;
      TaskManager.checkProgress();
      updateUI();
      tg?.HapticFeedback?.impactOccurred('light');
    } else {
      tg?.HapticFeedback?.notificationOccurred('error');
    }
  });

  // Показываем игру
  document.getElementById('splash-screen').style.display = 'none';
  document.getElementById('main-content').classList.remove('hidden');

  updateUI();
  setInterval(() => {
    if (state.energy < state.maxEnergy) {
      state.energy += 1;
      updateUI();
    }
  }, 5000);

  setInterval(() => StorageManager.saveState(state), 10000);
}

function updateUI() {
  document.getElementById('bones-count').innerText = Math.floor(state.bones);
  document.getElementById('zoo-count').innerText = Math.floor(state.zoo);
  document.getElementById('current-energy').innerText = `${Math.floor(state.energy)} / ${state.maxEnergy}`;
  document.getElementById('energy-bar').style.width = (state.energy / state.maxEnergy * 100) + '%';

  document.getElementById('share-ref-btn').innerText = `Поделиться (${state.referredCount}/5)`;
  document.getElementById('ref-code-display').innerText = state.refCode || '---';
}

// Запуск
window.addEventListener('load', initializeApp);
