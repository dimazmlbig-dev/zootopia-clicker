const tg = window.Telegram.WebApp;

// --- Глобальное состояние приложения ---
const state = {
    bones: 1000,
    zoo: 0,
    energy: 1000,
    maxEnergy: 1000,
    tapPower: 1,
    tapCost: 1,
    mining: {
        level: 1,
        availableToCollect: 0,
        lastUpdate: new Date().getTime(),
    },
    tasks: {
        totalTaps: 0,
    }
};

// --- Инициализация приложения ---
function init() {
    tg.ready();
    WalletManager.init(); // <--- ИНИЦИАЛИЗИРУЕМ КОШЕЛЕК

    const user = tg.initDataUnsafe?.user;
    if (user) {
        document.getElementById('user-name').innerText = user.first_name || 'Player';
    }

    showTab('main');
    updateUI();
    MiningManager.updateMiningUI();
    TaskManager.updateTasksUI();
    
    // Основной игровой цикл
    setInterval(() => {
        regenerateEnergy();
        if (document.getElementById('page-mine').style.display === 'block') {
            MiningManager.updateMiningUI();
        }
    }, 1000);
}

// --- Обновление UI ---
function updateUI() {
    document.getElementById('balance').innerText = Math.floor(state.bones);
    document.getElementById('zoo-balance').innerText = `${state.zoo.toFixed(4)} $ZOO`;
    document.getElementById('current-energy').innerText = state.energy;
    
    const energyPercentage = (state.energy / state.maxEnergy) * 100;
    document.getElementById('energy-bar').style.width = `${energyPercentage}%`;
}

// --- Логика вкладок ---
function showTab(tabName) {
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(p => p.style.display = 'none');
    
    if (tabName === 'nft') {
        document.getElementById('nft-sheet').classList.add('visible');
        document.getElementById('page-main').style.display = 'block';
    } else {
        document.getElementById('nft-sheet').classList.remove('visible');
        const pageToShow = document.getElementById(`page-${tabName}`);
        if (pageToShow) pageToShow.style.display = 'block';
    }

    if (tabName === 'mine') MiningManager.updateMiningUI();
    if (tabName === 'tasks') TaskManager.updateTasksUI();

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        if (item.getAttribute('onclick').includes(`'${tabName}'`)) {
            item.classList.add('active');
        }
    });
}

// --- Обработка тапа ---
document.getElementById('tap-zone').addEventListener('touchstart', (e) => {
    // ... (код без изменений)
});

// --- Восстановление энергии ---
function regenerateEnergy() {
    // ... (код без изменений)
}

// --- Визуальные эффекты (без изменений) ---
function createParticle(x, y, text) { /* ... */ }
function createRipple(x, y) { /* ... */ }

// --- Запуск приложения ---
init();
