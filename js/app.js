const tg = window.Telegram.WebApp;

// ... (LEVEL_CONFIG)

// --- ГЛОБАЛЬНОЕ СОСТОЯНИЕ ---
let state = {
    bones: 0,
    zoo: 0,
    energy: 1000,
    maxEnergy: 1000,
    level: 1,
    xp: 0,
    tapPower: 1,
    mining: { /* ... */ },
    tasks: { /* ... */ }
};

let isAppInitialized = false;

// --- ЗАГРУЗКА И СОХРАНЕНИЕ --- 
function loadGame() {
    const savedState = StorageManager.loadState();
    if (savedState) {
        // Важно: аккуратно объединяем сохранения с базовым состоянием,
        // чтобы новые свойства в state не пропадали при загрузке старых сохранений.
        Object.assign(state, savedState);
    }
    // Устанавливаем tapPower в соответствии с загруженным уровнем
    state.tapPower = LEVEL_CONFIG[state.level - 1].tapPower;
}

// --- ЛОГИКА ЗАСТАВКИ ---
function handleSplashScreen() {
    // ... (код заставки без изменений)
}

// --- ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ---
function initializeApp() {
    if (isAppInitialized) return;
    isAppInitialized = true;

    loadGame(); // <--- ЗАГРУЖАЕМ ПРОГРЕСС

    tg.ready();
    const user = tg.initDataUnsafe?.user;

    WalletManager.init();
    SwapManager.init();
    AdminManager.init(user); // <--- ИНИЦИАЛИЗИРУЕМ АДМИН-ПАНЕЛЬ

    if (user) {
        document.getElementById('user-name').innerText = user.first_name || 'Player';
        if (user.photo_url) document.querySelector('.avatar').src = user.photo_url;
    }

    // Настраиваем АВТОСОХРАНЕНИЕ каждые 5 секунд
    setInterval(() => {
        StorageManager.saveState(state);
    }, 5000);

    // Сохранение при сворачивании
    tg.onEvent('viewportChanged', (isStable) => {
        if (!isStable) {
            StorageManager.saveState(state);
        }
    });
    
    showTab('main');
    updateUI();
    MiningManager.updateMiningUI();
    TaskManager.updateTasksUI();
    
    // ... (остальной код инициализации)
}

// ... (Все остальные функции: updateUI, showTab, handleTap, и т.д. остаются без изменений)

window.addEventListener('load', handleSplashScreen);
