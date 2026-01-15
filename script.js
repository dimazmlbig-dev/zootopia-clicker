// script.js - Основной скрипт игры (без капчи и защиты от ботов)

// Инициализация Telegram Web App
const tg = window.Telegram.WebApp;
tg.expand();
tg.setHeaderColor('#0a0a14');
tg.setBackgroundColor('#0a0a14');

// Данные игры
let gameData = JSON.parse(localStorage.getItem('zoo_save_v1')) || {
    bones: 0,
    zooTokens: 0.0,
    energy: 1000,
    maxEnergy: 1000,
    clickPower: 1,
    totalClicks: 0,
    level: 1,
    upgrades: {
        clickPower: { level: 0, cost: 1000 },
        energyMax: { level: 0, cost: 5000 }
    },
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
        loadingBar.style.width = progress + '%';
        
        if (progress >= 100) {
            clearInterval(interval);
            setTimeout(() => {
                splashScreen.style.opacity = '0';
                setTimeout(() => {
                    splashScreen.style.display = 'none';
                    document.getElementById('mainApp').style.display = 'block';
                    updateUI();
                    startGameIntervals(); // Запускаем фоновые процессы
                    showNotification('🎮 Добро пожаловать в Zootopia!', 'success');
                }, 500);
            }, 500);
        }
    }, 50);
}

// Инициализация игры
function initGame() {
    // Установка имени пользователя из Telegram
    if (tg.initDataUnsafe?.user) {
        const user = tg.initDataUnsafe.user;
        document.getElementById('userName').textContent = user.first_name || user.username || 'Игрок';
    }
    // Инициализация TON Connect
    initTONConnect();
    // Инициализация обработчиков кликов
    initEventListeners();
}

// Обработчики событий
function initEventListeners() {
    const clickTarget = document.getElementById('clickTarget');
    if (clickTarget) {
        // Обработчик для мыши и касаний
        clickTarget.addEventListener('click', handleClick);
        clickTarget.addEventListener('touchstart', function(e) {
            e.preventDefault(); // Предотвращаем вторичный клик на мобильных
            handleClick(e);
        }, { passive: false });
    }
}

// Обработка клика (ОСНОВНАЯ ЛОГИКА)
function handleClick(event) {
    // Проверка энергии
    if (gameData.energy <= 0) {
        showNotification('⚡ Закончилась энергия!', 'warning');
        return;
    }
    
    // Обновление данных игры
    gameData.bones += gameData.clickPower;
    gameData.totalClicks++;
    gameData.energy--;
    
    // Начисление токенов (x2 если кошелёк подключен)
    const tokenMultiplier = gameData.walletConnected ? 2 : 1;
    gameData.zooTokens += 0.0001 * tokenMultiplier;
    
    // Визуальный эффект
    createClickEffect(event);
    
    // Виброотклик в Telegram
    tg.HapticFeedback.impactOccurred('medium');
    
    // Обновление интерфейса и сохранение
    updateUI();
    saveGame();
}

// Создание эффекта при клике
function createClickEffect(event) {
    const x = event.clientX || (event.touches && event.touches[0].clientX) || 100;
    const y = event.clientY || (event.touches && event.touches[0].clientY) || 100;
    
    const effect = document.createElement('div');
    effect.className = 'click-effect';
    effect.textContent = `+${gameData.clickPower}`;
    effect.style.cssText = `
        position: fixed;
        left: ${x - 15}px;
        top: ${y - 30}px;
        color: #FFD700;
        font-weight: 900;
        font-size: 22px;
        pointer-events: none;
        z-index: 10000;
        text-shadow: 0 0 8px rgba(255,215,0,0.8);
        animation: floatUp 0.8s ease-out forwards;
    `;
    
    document.body.appendChild(effect);
    setTimeout(() => effect.remove(), 800);
}

// Обновление всего интерфейса
function updateUI() {
    // Балансы
    document.getElementById('balanceCount').textContent = Math.floor(gameData.bones).toLocaleString();
    document.getElementById('zooTokenCount').textContent = gameData.zooTokens.toFixed(4);
    document.getElementById('zooBalanceAirdrop').textContent = gameData.zooTokens.toFixed(4);
    
    // Энергия
    const energyPercent = (gameData.energy / gameData.maxEnergy) * 100;
    document.getElementById('energyText').textContent = `${gameData.energy}/${gameData.maxEnergy}`;
    document.getElementById('energyFill').style.width = `${energyPercent}%`;
    
    // Статистика
    document.getElementById('clickPowerStat').textContent = gameData.clickPower;
    document.getElementById('totalClicksStat').textContent = gameData.totalClicks;
    
    // Прогресс аирдропа
    const airdropProgress = Math.min((gameData.zooTokens / 10) * 100, 100);
    document.getElementById('airdropProgress').style.width = `${airdropProgress}%`;
    document.getElementById('progressPercent').textContent = `${airdropProgress.toFixed(1)}%`;
    
    // Улучшения
    document.getElementById('clickPowerLvl').textContent = gameData.upgrades.clickPower.level;
    document.getElementById('energyMaxLvl').textContent = gameData.upgrades.energyMax.level;
}

// Переключение вкладок
function switchTab(tabName) {
    // Скрыть все табы, убрать активность с кнопок
    document.querySelectorAll('.tab-pane').forEach(t => t.classList.remove('active'));
    document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
    
    // Показать выбранный таб, подсветить кнопку
    const tabElement = document.getElementById(`tab${tabName.charAt(0).toUpperCase() + tabName.slice(1)}`);
    const btnElement = document.querySelector(`.nav-btn[data-tab="${tabName}"]`);
    
    if (tabElement) tabElement.classList.add('active');
    if (btnElement) btnElement.classList.add('active');
    
    tg.HapticFeedback.selectionChanged(); // Тактильный отклик
}

// Покупка улучшений
function buyUpgrade(type) {
    const upgrade = gameData.upgrades[type];
    if (!upgrade || gameData.bones < upgrade.cost) {
        showNotification('❌ Недостаточно костей!', 'error');
        tg.HapticFeedback.impactOccurred('heavy');
        return;
    }
    
    gameData.bones -= upgrade.cost;
    
    if (type === 'clickPower') {
        gameData.clickPower += 1;
        upgrade.level++;
        upgrade.cost = Math.floor(upgrade.cost * 1.5);
        showNotification('✅ Сила клика увеличена!', 'success');
    } else if (type === 'energyMax') {
        gameData.maxEnergy += 100;
        upgrade.level++;
        upgrade.cost = Math.floor(upgrade.cost * 1.8);
        showNotification('✅ Ёмкость энергии увеличена!', 'success');
    }
    
    tg.HapticFeedback.notificationOccurred('success');
    updateUI();
    saveGame();
}

// Фоновые игровые процессы
function startGameIntervals() {
    // Восстановление энергии каждые 1.5 секунды
    setInterval(() => {
        if (gameData.energy < gameData.maxEnergy) {
            gameData.energy++;
            updateUI();
        }
    }, 1500);
    
    // Пассивный доход токенами (каждые 30 секунд)
    setInterval(() => {
        const multiplier = gameData.walletConnected ? 2 : 1;
        gameData.zooTokens += 0.00005 * multiplier;
        updateUI();
        saveGame(); // Автосохранение
    }, 30000);
}

// Сохранение игры
function saveGame() {
    try {
        localStorage.setItem('zoo_save_v1', JSON.stringify(gameData));
    } catch (e) {
        console.log('Ошибка сохранения:', e);
    }
}

// Функция для показа уведомлений
function showNotification(text, type = 'info') {
    const notification = document.getElementById('globalNotification');
    if (!notification) return;
    
    notification.textContent = text;
    notification.className = `notification show ${type}`;
    
    setTimeout(() => {
        notification.classList.remove('show');
    }, 3000);
}

// Заглушка для инициализации TON Connect (детали в ton-connect.js)
function initTONConnect() {
    console.log('TON Connect инициализируется...');
    // Реальная реализация будет в файле ton-connect.js
}

// Делаем функции глобальными, чтобы они работали в HTML
window.switchTab = switchTab;
window.buyUpgrade = buyUpgrade;
window.showNotification = showNotification;
