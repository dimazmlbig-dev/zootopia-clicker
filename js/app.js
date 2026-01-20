const tg = window.Telegram.WebApp;

// --- КОНФИГУРАЦИЯ УРОВНЕЙ ---
const LEVEL_CONFIG = [
    { level: 1, xpToNext: 100, tapPower: 1 },
    { level: 2, xpToNext: 250, tapPower: 1.5 },
    { level: 3, xpToNext: 500, tapPower: 2 },
    { level: 4, xpToNext: 800, tapPower: 2.5 },
    { level: 5, xpToNext: 1200, tapPower: 3 },
    { level: 6, xpToNext: 1700, tapPower: 3.5 },
    { level: 7, xpToNext: 2500, tapPower: 4 },
    { level: 8, xpToNext: 4000, tapPower: 4.5 },
    { level: 9, xpToNext: Infinity, tapPower: 5 },
];

// --- ГЛОБАЛЬНОЕ СОСТОЯНИЕ ---
const state = {
    bones: 1000,
    zoo: 0,
    energy: 1000,
    maxEnergy: 1000,
    level: 1,
    xp: 0,
    tapPower: LEVEL_CONFIG[0].tapPower,
    mining: {
        level: 1,
        availableToCollect: 0,
        lastUpdate: new Date().getTime(),
    },
    tasks: {
        totalTaps: 0,
    }
};

let isAppInitialized = false;

// --- ЛОГИКА ЗАСТАВКИ ---
function handleSplashScreen() {
    const splashScreen = document.getElementById('splash-screen');
    const splashVideo = document.getElementById('splash-video');
    const appContainer = document.querySelector('.app-container');

    function showApp() {
        if (isAppInitialized) return;
        
        if (splashScreen) {
            splashScreen.classList.add('hidden');
        }
        if (appContainer) {
            appContainer.style.visibility = 'visible';
        }
        initializeApp();
    }

    if (splashVideo) {
        splashVideo.onended = showApp;
        splashVideo.onerror = showApp;
        splashVideo.play().catch(e => { 
            console.error('Video play failed, showing app immediately.', e);
            showApp(); 
        });
        setTimeout(showApp, 4000);
    } else {
        showApp();
    }
}

// --- ИНИЦИАЛИЗАЦИЯ ПРИЛОЖЕНИЯ ---
function initializeApp() {
    if (isAppInitialized) return;
    isAppInitialized = true;

    tg.ready();
    WalletManager.init();
    SwapManager.init();

    const user = tg.initDataUnsafe?.user;
    if (user) {
        document.getElementById('user-name').innerText = user.first_name || 'Player';
        if (user.photo_url) {
            document.querySelector('.avatar').src = user.photo_url;
        }
    }

    showTab('main');
    updateUI();
    MiningManager.updateMiningUI();
    TaskManager.updateTasksUI();
    
    setInterval(() => {
        regenerateEnergy();
        if (document.getElementById('page-mine').style.display === 'block') {
            MiningManager.updateMiningUI();
        }
    }, 1000);
    
    const tapZone = document.getElementById('tap-zone');
    tapZone.addEventListener('touchstart', handleTap);
    tapZone.addEventListener('mousedown', handleTap);
}

// --- ОБНОВЛЕНИЕ UI ---
function updateUI() {
    document.getElementById('balance').innerText = Math.floor(state.bones);
    document.getElementById('zoo-balance').innerText = `${state.zoo.toFixed(4)} $ZOO`;
    document.getElementById('current-energy').innerText = `${Math.floor(state.energy)}/${state.maxEnergy}`;
    document.getElementById('energy-bar').style.width = `${(state.energy / state.maxEnergy) * 100}%`;

    const currentLevelInfo = LEVEL_CONFIG[state.level - 1];
    const xpForCurrentLevel = (state.level > 1) ? LEVEL_CONFIG[state.level - 2].xpToNext : 0;
    const currentLevelXp = state.xp - xpForCurrentLevel;
    const neededXp = currentLevelInfo.xpToNext - xpForCurrentLevel;

    document.getElementById('current-level').innerText = state.level;
    
    if (isFinite(neededXp)) {
        document.getElementById('level-progress').innerText = `${Math.floor(currentLevelXp)}/${neededXp}`;
        document.getElementById('level-bar').style.width = `${(currentLevelXp / neededXp) * 100}%`;
    } else {
        document.getElementById('level-progress').innerText = 'МАКС';
        document.getElementById('level-bar').style.width = '100%';
    }
}

// --- ЛОГИКА ВКЛАДОК ---
function showTab(tabName) {
    const pages = document.querySelectorAll('.page-content');
    pages.forEach(p => { if(p) p.style.display = 'none'; });
    
    const nftSheet = document.getElementById('nft-sheet');
    if (tabName === 'nft') {
        nftSheet.classList.add('visible');
        const mainPage = document.getElementById('page-main');
        if(mainPage) mainPage.style.display = 'block';
    } else {
        nftSheet.classList.remove('visible');
        const pageToShow = document.getElementById(`page-${tabName}`);
        if (pageToShow) pageToShow.style.display = 'block';
    }

    if (tabName === 'mine') MiningManager.updateMiningUI();
    if (tabName === 'tasks') TaskManager.updateTasksUI();
    if (tabName === 'swap') SwapManager.updateUI();

    const navItems = document.querySelectorAll('.nav-item');
    navItems.forEach(item => {
        item.classList.remove('active');
        const onclickAttr = item.getAttribute('onclick');
        if (onclickAttr && (onclickAttr.includes(`'${tabName}'`))) {
            item.classList.add('active');
        }
    });
}

// --- ПРОВЕРКА И ПОВЫШЕНИЕ УРОВНЯ ---
function checkLevelUp() {
    if (state.level >= LEVEL_CONFIG.length) return;

    const currentLevelInfo = LEVEL_CONFIG[state.level - 1];
    if (state.xp >= currentLevelInfo.xpToNext) {
        state.level++;
        const newLevelInfo = LEVEL_CONFIG[state.level - 1];
        state.tapPower = newLevelInfo.tapPower;
        alert(`Поздравляем! Вы достигли ${state.level} уровня! Сила клика увеличена до ${state.tapPower}.`);
    }
}

// --- ОБРАБОТЧИК ТАПОВ/КЛИКОВ ---
function handleTap(e) {
    e.preventDefault();
    const points = e.touches ? e.touches : [e];
    if (state.energy < points.length) return;

    for (let i = 0; i < points.length; i++) {
        const point = points[i];
        if (state.energy >= 1) {
            state.bones += state.tapPower;
            state.zoo += (state.tapPower * 0.0001);
            state.energy--;
            state.xp++; 
            createParticle(point.clientX, point.clientY, `+${state.tapPower.toFixed(1)}`);
        }
    }

    checkLevelUp();
    if (tg.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
    updateUI();
}

// --- РЕГЕНЕРАЦИЯ ЭНЕРГИИ ---
function regenerateEnergy() {
    if (state.energy < state.maxEnergy) {
        state.energy = Math.min(state.energy + 3, state.maxEnergy);
        updateUI();
    }
}

// --- ВИЗУАЛЬНЫЕ ЭФФЕКТЫ ---
function createParticle(x, y, text) {
    const p = document.createElement('div');
    p.className = 'tap-particle';
    p.innerText = text;
    p.style.left = `${x}px`;
    p.style.top = `${y}px`;
    document.body.appendChild(p);
    setTimeout(() => p.remove(), 900);
}

// --- СТИЛИ ДЛЯ ЧАСТИЦ ---
(function() {
    const style = document.createElement('style');
    style.innerHTML = `
        .tap-particle {
            position: fixed; pointer-events: none; font-size: 32px; font-weight: 800; color: #ffffff;
            text-shadow: 0 0 10px rgba(255, 255, 255, 0.8); z-index: 1001; animation: flyUp 1s ease-out forwards;
        }
        @keyframes flyUp {
            0% { transform: translateY(0) scale(1); opacity: 1; }
            100% { transform: translateY(-150px) scale(1.5); opacity: 0; }
        }
    `;
    document.head.appendChild(style);
})();

// --- ГЛАВНАЯ ТОЧКА ВХОДА ---
window.addEventListener('load', handleSplashScreen);
