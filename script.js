// script.js - Основной скрипт игры

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.setHeaderColor('#0a0a14');
tg.setBackgroundColor('#0a0a14');

// Данные игры
let gameData = JSON.parse(localStorage.getItem('zoo_elite_v3')) || {
    bones: 0,
    zooTokens: 0.0015,
    energy: 1000,
    maxEnergy: 1000,
    clickPower: 1,
    totalClicks: 15,
    level: 1,
    upgrades: {
        clickPower: { level: 0, cost: 1000 },
        energyMax: { level: 0, cost: 5000 }
    },
    referrals: 0,
    walletConnected: false
};

// Инициализация при загрузке
document.addEventListener('DOMContentLoaded', () => {
    initGame();
    loadSplashScreen();
});

// Загрузочный экран
function loadSplashScreen() {
    let progress = 0;
    const loadingBar = document.getElementById('loadingProgress');
    const splashScreen = document.getElementById('splashScreen');
    
    const interval = setInterval(() => {
        progress += Math.random() * 20;
        if (progress >= 100) {
            progress = 100;
            clearInterval(interval);
            
            // Задержка перед показом игры
            setTimeout(() => {
                splashScreen.style.opacity = '0';
                setTimeout(() => {
                    splashScreen.style.display = 'none';
                    document.getElementById('mainApp').style.display = 'flex';
                    updateUI();
                    
                    // Старт игровых интервалов
                    startGameIntervals();
                    
                    // Показать приветственное сообщение
                    showNotification('🎮 Добро пожаловать в Zootopia!', 'success');
                }, 500);
            }, 500);
        }
        loadingBar.style.width = progress + '%';
    }, 50);
}

// Инициализация игры
function initGame() {
    // Установка имени пользователя из Telegram
    if (tg.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        document.getElementById('userName').textContent = 
            user.first_name || user.username || 'Игрок';
    }
    
    // Инициализация обработчиков
    initEventListeners();
    initTONConnect();
}

// Обработчики событий
function initEventListeners() {
    // Клик по питомцу
    const clickTarget = document.getElementById('clickTarget');
    if (clickTarget) {
        clickTarget.addEventListener('click', handleClick);
        clickTarget.addEventListener('touchstart', handleClick);
    }
    
    // Переключение табов
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tab = this.getAttribute('data-tab');
            switchTab(tab);
            
            // Виброотклик
            tg.HapticFeedback.selectionChanged();
        });
    });
}

// Обработка клика
function handleClick(event) {
    event.preventDefault();
    
    // Проверка через анти-бот систему
    if (window.antiBotSystem && !window.antiBotSystem.handleGameClick()) {
        return;
    }
    
    // Проверка энергии
    if (gameData.energy <= 0) {
        showNotification('⚡ Закончилась энергия!', 'warning');
        return;
    }
    
    // Обновление данных
    gameData.bones += gameData.clickPower;
    gameData.totalClicks++;
    gameData.energy--;
    gameData.zooTokens += 0.0001 * (gameData.walletConnected ? 2 : 1);
    
    // Визуальные эффекты
    createClickEffect(event);
    
    // Виброотклик
    tg.HapticFeedback.impactOccurred('medium');
    
    // Обновление UI
    updateUI();
    
    // Автосохранение
    saveGame();
}

// Создание эффекта клика
function createClickEffect(event) {
    const effect = document.createElement('div');
    effect.className = 'click-effect';
    effect.textContent = `+${gameData.clickPower}`;
    effect.style.cssText = `
        position: absolute;
        left: ${event.clientX || event.touches[0].clientX}px;
        top: ${event.clientY || event.touches[0].clientY}px;
        color: var(--neon-gold);
        font-weight: 900;
        font-size: 24px;
        pointer-events: none;
        animation: floatUp 1s ease-out forwards;
        text-shadow: 0 0 10px rgba(255, 215, 0, 0.7);
        z-index: 100;
    `;
    
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 1000);
}

// Обновление интерфейса
function updateUI() {
    // Балансы
    document.getElementById('balanceCount').textContent = 
        Math.floor(gameData.bones).toLocaleString();
    
    document.getElementById('zooTokenCount').textContent = 
        gameData.zooTokens.toFixed(4);
    
    document.getElementById('zooBalanceAirdrop').textContent = 
        gameData.zooTokens.toFixed(4);
    
    // Энергия
    const energyPercent = (gameData.energy / gameData.maxEnergy) * 100;
    document.getElementById('energyText').textContent = 
        `${gameData.energy}/${gameData.maxEnergy}`;
    document.getElementById('energyFill').style.width = `${energyPercent}%`;
    
    // Статистика
    document.getElementById('clickPowerStat').textContent = gameData.clickPower;
    document.getElementById('totalClicksStat').textContent = gameData.totalClicks;
    
    // Расчет CPS
    if (window.antiBotSystem) {
        const stats = window.antiBotSystem.getStats();
        document.getElementById('cpsStat').textContent = stats.cps;
    }
    
    // Прогресс аирдропа
    const airdropProgress = Math.min((gameData.zooTokens / 10) * 100, 100);
    document.getElementById('airdropProgress').style.width = `${airdropProgress}%`;
    document.getElementById('progressPercent').textContent = `${airdropProgress.toFixed(1)}%`;
    
    // Уровень улучшений
    document.getElementById('clickPowerLvl').textContent = gameData.upgrades.clickPower.level;
    document.getElementById('energyMaxLvl').textContent = gameData.upgrades.energyMax.level;
    
    // Статус кошелька
    updateWalletStatus();
}

// Переключение табов
function switchTab(tabName) {
    // Скрыть все табы
    document.querySelectorAll('.tab-pane').forEach(tab => {
        tab.classList.remove('active');
    });
    
    // Убрать активный класс у всех кнопок
    document.querySelectorAll('.nav-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    
    // Показать выбранный таб
    const tabElement = document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    if (tabElement) {
        tabElement.classList.add('active');
    }
    
    // Активировать соответствующую кнопку
    const btnElement = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);
    if (btnElement) {
        btnElement.classList.add('active');
    }
}

// Покупка улучшений
function buyUpgrade(type) {
    const upgrade = gameData.upgrades[type];
    
    if (!upgrade || gameData.bones < upgrade.cost) {
        showNotification('❌ Недостаточно костей!', 'error');
        tg.HapticFeedback.impactOccurred('heavy');
        return;
    }
    
    // Списание стоимости
    gameData.bones -= upgrade.cost;
    
    // Применение улучшения
    switch(type) {
        case 'clickPower':
            gameData.clickPower += 1;
            upgrade.cost = Math.floor(upgrade.cost * 1.5);
            upgrade.level++;
            showNotification('✅ Сила клика увеличена!', 'success');
            break;
            
        case 'energyMax':
            gameData.maxEnergy += 100;
            upgrade.cost = Math.floor(upgrade.cost * 1.8);
            upgrade.level++;
            showNotification('✅ Ёмкость энергии увеличена!', 'success');
            break;
    }
    
    // Виброотклик
    tg.HapticFeedback.notificationOccurred('success');
    
    // Обновление UI
    updateUI();
    saveGame();
}

// Игровые интервалы
function startGameIntervals() {
    // Восстановление энергии
    setInterval(() => {
        if (gameData.energy < gameData.maxEnergy) {
            gameData.energy++;
            updateUI();
        }
    }, 1500);
    
    // Пассивный фарминг
    setInterval(() => {
        const multiplier = gameData.walletConnected ? 2 : 1;
        gameData.zooTokens += 0.00001 * multiplier;
        
        // Автосохранение каждые 30 секунд
        saveGame();
        updateUI();
    }, 30000);
}

// Сохранение игры
function saveGame() {
    try {
        localStorage.setItem('zoo_elite_v3', JSON.stringify(gameData));
    } catch (error) {
        console.error('Error saving game:', error);
    }
}

// Экспорт функций
window.switchTab = switchTab;
window.buyUpgrade = buyUpgrade;
window.hideCaptchaModal = () => {
    if (window.antiBotSystem) {
        window.antiBotSystem.hideCaptchaModal();
    }
};
window.verifyRecaptcha = () => {
    if (window.antiBotSystem) {
        window.antiBotSystem.verifyRecaptcha();
    }
};
window.verifySimpleCaptcha = () => {
    if (window.antiBotSystem) {
        window.antiBotSystem.verifySimpleCaptcha();
    }
};
window.onCaptchaSuccess = (token) => {
    if (window.antiBotSystem) {
        window.antiBotSystem.onCaptchaSuccess(token);
    }
};
