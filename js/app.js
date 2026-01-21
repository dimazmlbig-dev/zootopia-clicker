const tg = window.Telegram.WebApp;

// Конфигурация уровней (дополни по необходимости)
const LEVEL_CONFIG = [
    { tapPower: 1, xpToNext: 100 },
    { tapPower: 2, xpToNext: 250 },
    { tapPower: 3, xpToNext: 500 },
    { tapPower: 4, xpToNext: 1000 },
    // ... добавь остальные уровни
];

// Глобальное состояние
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

// Загрузка игры
function loadGame() {
    const savedState = StorageManager.loadState();
    if (savedState) {
        Object.assign(state, savedState);
        // Гарантируем наличие обязательных полей
        if (typeof state.totalTaps !== 'number') state.totalTaps = 0;
        if (typeof state.referredCount !== 'number') state.referredCount = 0;
        if (!state.refCode) state.refCode = 'guest_' + Date.now();
    }
    state.tapPower = LEVEL_CONFIG[state.level - 1]?.tapPower || 1;
}

// Менеджер рефералов
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
        const botUsername = tg.initDataUnsafe?.bot_username || 'YOUR_BOT_USERNAME_HERE';
        const refLink = `https://t.me/${botUsername}?start=ref_${state.refCode}`;
        tg?.shareUrl(refLink, 'Заходи в Zootopia Clicker и фарми bones вместе со мной! 🐶💰');
    }
};

// Инициализация
function initializeApp() {
    if (isAppInitialized) return;
    isAppInitialized = true;

    loadGame();

    tg.ready();
    tg.expand();

    const user = tg.initDataUnsafe?.user;

    if (user) {
        document.getElementById('user-name')?.innerText = user.first_name || 'Player';
        if (user.photo_url) {
            document.querySelector('.avatar')?.setAttribute('src', user.photo_url);
        }

        if (!state.refCode && user.id) {
            state.refCode = user.id.toString();
        }
    }

    ReferralManager.claimReferralBonus();

    // Автосохранение
    setInterval(() => {
        StorageManager.saveState(state);
    }, 5000);

    // Сохранение при сворачивании
    tg.onEvent('viewportChanged', (payload) => {
        if (!payload.isStateStable) {
            StorageManager.saveState(state);
        }
    });

    // Регенерация энергии
    setInterval(() => {
        if (state.energy < state.maxEnergy) {
            state.energy += 1;
            updateUI();
        }
    }, 3000);

    // Пересчёт оффлайн-майнинга при возвращении
    window.addEventListener('focus', () => {
        if (typeof MiningManager !== 'undefined' && MiningManager.calculateOfflineProduction) {
            MiningManager.calculateOfflineProduction();
            if (MiningManager.updateMiningUI) MiningManager.updateMiningUI();
            updateUI();
        }
    });

    // Кнопка поделиться рефералкой
    document.getElementById('share-ref-btn')?.addEventListener('click', ReferralManager.shareReferral);

    showTab('main');
    updateUI();
    if (typeof MiningManager !== 'undefined' && MiningManager.updateMiningUI) {
        MiningManager.updateMiningUI();
    }
    if (typeof TaskManager !== 'undefined' && TaskManager.updateTasksUI) {
        TaskManager.updateTasksUI();
    }
}

// Обработчик тапа
function handleTap() {
    if (state.energy <= 0) {
        tg?.HapticFeedback?.notificationOccurred('error');
        return;
    }

    state.bones += state.tapPower;
    state.energy -= 1;
    state.xp += 1;
    state.totalTaps += 1;

    // Здесь можно добавить checkLevelUp() если у тебя есть такая функция

    if (typeof TaskManager !== 'undefined' && TaskManager.checkProgress) {
        TaskManager.checkProgress();
    }

    updateUI();

    tg?.HapticFeedback?.impactOccurred('light');
}

// Обновление интерфейса
function updateUI() {
    // Обновление энергии
    const energyText = document.getElementById('current-energy');
    const energyBar = document.getElementById('energy-bar');
    if (energyText) energyText.textContent = `${Math.floor(state.energy)}/${state.maxEnergy}`;
    if (energyBar) energyBar.style.width = `${(state.energy / state.maxEnergy) * 100}%`;

    // Обновление баланса
    document.getElementById('bones-count')?.textContent = Math.floor(state.bones).toLocaleString();
    document.getElementById('zoo-count')?.textContent = Math.floor(state.zoo).toLocaleString();

    // Уровень
    document.getElementById('level-text')?.textContent = `Уровень ${state.level}`;

    // Рефералка
    const refBtn = document.getElementById('share-ref-btn');
    if (refBtn) refBtn.textContent = `Поделиться (${state.referredCount}/5)`;

    const refCodeEl = document.getElementById('ref-code-display');
    if (refCodeEl) refCodeEl.textContent = state.refCode || '---';
}

// Запуск
window.addEventListener('load', () => {
    // Если есть splash-screen — дождись его завершения
    // иначе сразу initializeApp()
    initializeApp();
});
