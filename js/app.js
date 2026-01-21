// Безопасный Telegram wrapper
const tg = window.Telegram?.WebApp || null;

function initTelegram() {
  if (!tg) {
    console.log('Открыто вне Telegram');
    return;
  }

  tg.ready();
  tg.expand();

  const user = tg.initDataUnsafe?.user;
  if (user) {
    document.getElementById('user-name').innerText =
      user.first_name || 'Игрок';

    // refCode по user.id (если нет)
    const s = State.get();
    if (!s.refCode && user.id) {
      s.refCode = user.id.toString();
    }
  }
}

// Splash → игра
function showGame() {
  document.getElementById('splash-screen').style.display = 'none';
  document.getElementById('main-content').classList.remove('hidden');
}

// События UI
function bindUI() {
  document
    .getElementById('tap-zone')
    ?.addEventListener('click', () => Clicker.tap());

  document
    .getElementById('share-ref-btn')
    ?.addEventListener('click', () => ReferralManager.shareReferral());

  document
    .getElementById('collect-btn')
    ?.addEventListener('click', () => Mining.collect());
}

// Автосейв
function startAutosave() {
  setInterval(() => {
    State.save();
  }, 3000);
}

// Запуск игры
function startGame() {
  initTelegram();

  ReferralManager.claimReferralBonus();

  Energy.start();
  startAutosave();

  UI.updateBalance();
  UI.updateEnergy();
  UI.updateReferral?.();

  showGame();
}

// ENTRY POINT
window.addEventListener('load', startGame);
