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
        // ... состояния для каждого задания будут добавляться сюда TaskManager-ом
    }
};

// --- Инициализация приложения ---
function init() {
    tg.ready();
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
    e.preventDefault();
    if (state.energy < state.tapCost * e.touches.length) return;

    for (let i = 0; i < e.touches.length; i++) {
        const touch = e.touches[i];
        let power = state.tapPower;
        if (document.getElementById('slot-glasses').getAttribute('src')) power += 5;
        if (document.getElementById('slot-hat').getAttribute('src')) power += 15;

        state.bones += power;
        state.zoo += (power * 0.0001);
        state.energy -= state.tapCost;
        state.tasks.totalTaps++; // Увеличиваем счетчик тапов

        createParticle(touch.clientX, touch.clientY, `+${power}`);
        createRipple(touch.clientX, touch.clientY);
    }

    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
    updateUI();
});

// --- Восстановление энергии ---
function regenerateEnergy() {
    if (state.energy < state.maxEnergy) {
        state.energy = Math.min(state.energy + 1, state.maxEnergy);
        updateUI();
    }
}

// --- Визуальные эффекты (без изменений) ---
function createParticle(x, y, text) {
    const p = document.createElement('div');
    p.className = 'tap-particle';
    p.innerText = text;
    p.style.left = `${x}px`; p.style.top = `${y}px`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 800);
}
function createRipple(x, y) {
    const r = document.createElement('div');
    r.className = 'tap-glow';
    r.style.left = `${x}px`; r.style.top = `${y}px`;
    document.body.appendChild(r);
    setTimeout(() => r.remove(), 400);
}

// --- Запуск приложения ---
init();
