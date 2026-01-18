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
    WalletManager.init();

    const user = tg.initDataUnsafe?.user;
    if (user) {
        document.getElementById('user-name').innerText = user.first_name || 'Player';
        const avatarImg = document.querySelector('.avatar');
        if (user.photo_url) {
            avatarImg.src = user.photo_url;
        }
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
    
    // Назначаем обработчики
    const tapZone = document.getElementById('tap-zone');
    tapZone.addEventListener('touchstart', handleTap);
    tapZone.addEventListener('mousedown', handleTap);
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
    // ... (код без изменений)
}

// --- ЕДИНЫЙ ОБРАБОТЧИК ТАПОВ/КЛИКОВ ---
function handleTap(e) {
    e.preventDefault();
    
    // Для mousedown используем сам объект события, для touchstart - массив touches
    const points = e.touches ? e.touches : [e];

    if (state.energy < state.tapCost * points.length) {
        // Эффект тряски, если нет энергии
        return;
    }

    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        let power = state.tapPower;

        state.bones += power;
        state.zoo += (power * 0.0001);
        state.energy -= state.tapCost;
        state.tasks.totalTaps++;

        createParticle(point.clientX, point.clientY, `+${power}`);
    }

    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
    updateUI();
}

// --- Восстановление энергии ---
function regenerateEnergy() {
    if (state.energy < state.maxEnergy) {
        state.energy = Math.min(state.energy + 1, state.maxEnergy);
        updateUI();
    }
}

// --- ВИЗУАЛЬНЫЕ ЭФФЕКТЫ (ВОССТАНОВЛЕНО) ---
function createParticle(x, y, text) {
    const p = document.createElement('div');
    p.className = 'tap-particle';
    p.innerText = text;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 900);
}

// --- Запуск приложения ---
init();

// --- СТИЛИ ДЛЯ ЧАСТИЦ (чтобы не зависеть от css) ---
(function() {
    const style = document.createElement('style');
    style.innerHTML = `
        .tap-particle {
            position: fixed;
            pointer-events: none;
            font-size: 32px;
            font-weight: 800;
            color: #ffffff;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.8);
            z-index: 1001;
            animation: flyUp 1s ease-out forwards;
        }
        @keyframes flyUp {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            100% { transform: translateY(-150px) scale(1.5); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
})();
