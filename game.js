// ============================================
// ZOOTOPIA CLICKER GAME - основной игровой скрипт
// ============================================

// Основной игровой объект
const Game = {
    // Состояние игры
    state: {
        energy: 1000,
        maxEnergy: 1000,
        totalClicks: 0,
        clickPower: 1,
        balance: 0,
        tokens: 0.0000,
        progress: 0.0,
        requiredTokens: 1000000,
        
        // Уровни улучшений
        upgrades: {
            power: { level: 0, cost: 1000, baseCost: 1000, multiplier: 1.5 },
            battery: { level: 0, cost: 5000, baseCost: 5000, multiplier: 1.5 },
            auto: { level: 0, cost: 10000, baseCost: 10000, multiplier: 1.8 },
            speed: { level: 0, cost: 25000, baseCost: 25000, multiplier: 1.6 }
        },
        
        // Автокликеры
        autoClickers: 0,
        clicksPerSecond: 0,
        regenerationRate: 10, // энергии в секунду
        boostActive: false,
        boostEndTime: 0,
        playerLevel: 1,
        experience: 0,
        
        // Состояние кошелька
        walletConnected: false,
        walletAddress: null,
        walletType: null,
        
        // Игровые бонусы
        achievements: [],
        dailyBonus: {
            lastClaim: null,
            streak: 0
        }
    },
    
    // DOM элементы
    elements: {},
    
    // Инициализация игры
    init: function() {
        console.log('🚀 Инициализация Zootopia Clicker...');
        
        // Инициализация элементов
        this.initElements();
        
        // Восстановление сохранения
        this.loadGame();
        
        // Настройка обработчиков событий
        this.setupEventListeners();
        
        // Запуск игровых циклов
        this.startGameLoops();
        
        // Интеграция с Telegram WebApp
        this.initTelegramWebApp();
        
        // Обновление интерфейса
        this.updateUI();
        
        console.log('✅ Игра успешно инициализирована!');
        this.showNotification('Добро пожаловать в Zootopia Clicker!', 'success');
    },
    
    // Инициализация DOM элементов
    initElements: function() {
        // Основные элементы
        this.elements = {
            // Энергия
            energyDisplay: document.getElementById('energy-display'),
            energyBar: document.getElementById('energy-bar'),
            maxEnergy: document.getElementById('max-energy'),
            regenRate: document.getElementById('regen-rate'),
            regenTime: document.getElementById('regen-time'),
            
            // Статистика
            totalClicks: document.getElementById('total-clicks'),
            clickPower: document.getElementById('click-power'),
            clickPowerDisplay: document.getElementById('click-power-display'),
            clicksPerSecond: document.getElementById('clicks-per-second'),
            autoClickers: document.getElementById('auto-clickers'),
            
            // Улучшения
            powerLevel: document.getElementById('power-level'),
            powerCost: document.getElementById('power-cost'),
            batteryLevel: document.getElementById('battery-level'),
            batteryCost: document.getElementById('battery-cost'),
            autoLevel: document.getElementById('auto-level'),
            autoCost: document.getElementById('auto-cost'),
            speedLevel: document.getElementById('speed-level'),
            speedCost: document.getElementById('speed-cost'),
            
            // Баланс и токены
            balance: document.getElementById('balance'),
            tokens: document.getElementById('tokens'),
            progressPercent: document.getElementById('progress-percent'),
            progressFill: document.getElementById('progress-fill'),
            requiredTokens: document.getElementById('required-tokens'),
            
            // Игрок
            playerLevel: document.getElementById('player-level'),
            
            // Кнопки
            clickButton: document.getElementById('click-button'),
            connectWallet: document.getElementById('connect-wallet'),
            boostButton: document.getElementById('boost-button'),
            
            // Модальные окна
            walletModal: document.getElementById('wallet-modal'),
            boostModal: document.getElementById('boost-modal'),
            modalCloses: document.querySelectorAll('.modal-close'),
            
            // Другие элементы
            notificationContainer: document.getElementById('notification-container')
        };
    },
    
    // Настройка обработчиков событий
    setupEventListeners: function() {
        // Кнопка клика
        this.elements.clickButton.addEventListener('click', (e) => this.handleClick(e));
        
        // Кнопка подключения кошелька
        this.elements.connectWallet.addEventListener('click', () => this.openWalletModal());
        
        // Кнопка буста
        this.elements.boostButton.addEventListener('click', () => this.openBoostModal());
        
        // Кнопки покупки улучшений
        document.querySelectorAll('.buy-button').forEach(button => {
            button.addEventListener('click', (e) => this.buyUpgrade(e.target.dataset.upgrade));
        });
        
        // Кнопки кошельков в модалке
        document.querySelectorAll('.wallet-option').forEach(option => {
            option.addEventListener('click', (e) => this.connectWalletProvider(e.target.id || e.target.closest('.wallet-option').id));
        });
        
        // Кнопка активации буста
        document.getElementById('activate-boost')?.addEventListener('click', () => this.activateBoost());
        
        // Закрытие модальных окон
        this.elements.modalCloses.forEach(closeBtn => {
            closeBtn.addEventListener('click', () => this.closeAllModals());
        });
        
        // Закрытие модалок по клику на фон
        document.querySelectorAll('.modal').forEach(modal => {
            modal.addEventListener('click', (e) => {
                if (e.target === modal) this.closeAllModals();
            });
        });
        
        // Сохранение игры при закрытии вкладки
        window.addEventListener('beforeunload', () => this.saveGame());
        
        // Сохранение каждые 30 секунд
        setInterval(() => this.saveGame(), 30000);
    },
    
    // Обработка клика
    handleClick: function(event) {
        // Проверка энергии
        if (this.state.energy < this.state.clickPower) {
            this.showNotification('Недостаточно энергии!', 'error');
            return;
        }
        
        // Уменьшение энергии
        this.state.energy -= this.state.clickPower;
        
        // Увеличение счетчиков
        this.state.totalClicks += this.state.clickPower;
        this.state.balance += this.state.clickPower;
        
        // Начисление токенов (0.001 SZOO за клик)
        const tokensEarned = this.state.clickPower * 0.001;
        this.state.tokens += tokensEarned;
        
        // Прогресс до листинга (0.0001% за клик)
        this.state.progress += (this.state.clickPower * 0.0001);
        if (this.state.progress > 100) this.state.progress = 100;
        
        // Опыт за клик
        this.gainExperience(this.state.clickPower);
        
        // Создание эффекта клика
        this.createClickEffect(event);
        
        // Звук клика (если поддерживается)
        this.playClickSound();
        
        // Обновление интерфейса
        this.updateUI();
        
        // Периодическое сохранение
        if (this.state.totalClicks % 50 === 0) {
            this.saveGame();
        }
    },
    
    // Покупка улучшения
    buyUpgrade: function(type) {
        const upgrade = this.state.upgrades[type];
        
        // Проверка баланса
        if (this.state.balance < upgrade.cost) {
            this.showNotification(`Недостаточно денег! Нужно: ${this.formatNumber(upgrade.cost)}`, 'error');
            return;
        }
        
        // Списание денег
        this.state.balance -= upgrade.cost;
        
        // Применение улучшения
        switch(type) {
            case 'power':
                this.state.clickPower += 1;
                this.state.upgrades.power.level++;
                this.showNotification(`Мощный удар улучшен до уровня ${this.state.upgrades.power.level}!`, 'success');
                break;
                
            case 'battery':
                this.state.maxEnergy += 100;
                this.state.upgrades.battery.level++;
                this.showNotification(`Батарея улучшена! +100 энергии`, 'success');
                break;
                
            case 'auto':
                this.state.autoClickers += 1;
                this.state.clicksPerSecond += 1;
                this.state.upgrades.auto.level++;
                this.showNotification(`Автокликер куплен!`, 'success');
                break;
                
            case 'speed':
                this.state.regenerationRate += 2;
                this.state.upgrades.speed.level++;
                this.showNotification(`Скорость восстановления увеличена!`, 'success');
                break;
        }
        
        // Увеличение стоимости следующего улучшения
        upgrade.cost = Math.floor(upgrade.baseCost * Math.pow(upgrade.multiplier, upgrade.level));
        
        // Обновление интерфейса
        this.updateUI();
        
        // Сохранение игры
        this.saveGame();
    },
    
    // Активация буста
    activateBoost: function() {
        const boostCost = 500;
        
        // Проверка токенов
        if (this.state.tokens < boostCost) {
            this.showNotification(`Недостаточно токенов! Нужно: ${boostCost} SZOO`, 'error');
            return;
        }
        
        // Списание токенов
        this.state.tokens -= boostCost;
        
        // Активация буста
        this.state.boostActive = true;
        this.state.boostEndTime = Date.now() + (60 * 60 * 1000); // 1 час
        this.state.clickPower *= 2;
        
        this.showNotification('Буст активирован! Сила клика удвоена на 1 час!', 'success');
        
        // Закрытие модалки
        this.closeAllModals();
        
        // Обновление интерфейса
        this.updateUI();
        
        // Таймер буста
        setTimeout(() => {
            this.state.boostActive = false;
            this.state.clickPower = Math.floor(this.state.clickPower / 2);
            this.showNotification('Буст закончился!', 'info');
            this.updateUI();
        }, 60 * 60 * 1000);
    },
    
    // Подключение кошелька
    connectWalletProvider: function(provider) {
        // Имитация подключения кошелька
        this.state.walletConnected = true;
        this.state.walletType = provider;
        this.state.walletAddress = 'EQ' + '0'.repeat(48) + Math.random().toString(36).substr(2, 6);
        
        this.showNotification(`Кошелек ${provider} подключен!`, 'success');
        
        // Закрытие модалки
        this.closeAllModals();
        
        // Обновление кнопки
        this.elements.connectWallet.innerHTML = `
            <i class="fas fa-check-circle"></i>
            <span>Кошелек подключен</span>
        `;
        this.elements.connectWallet.style.background = 'linear-gradient(135deg, var(--success), #2E7D32)';
    },
    
    // Открытие модалки кошелька
    openWalletModal: function() {
        if (this.state.walletConnected) {
            this.showNotification('Кошелек уже подключен!', 'info');
            return;
        }
        
        this.elements.walletModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    },
    
    // Открытие модалки буста
    openBoostModal: function() {
        if (this.state.boostActive) {
            this.showNotification('Буст уже активен!', 'info');
            return;
        }
        
        this.elements.boostModal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
    },
    
    // Закрытие всех модалок
    closeAllModals: function() {
        document.querySelectorAll('.modal').forEach(modal => {
            modal.style.display = 'none';
        });
        document.body.style.overflow = 'auto';
    },
    
    // Получение опыта
    gainExperience: function(amount) {
        this.state.experience += amount;
        
        // Проверка повышения уровня (1000 опыта за уровень)
        const requiredExp = this.state.playerLevel * 1000;
        if (this.state.experience >= requiredExp) {
            this.state.experience -= requiredExp;
            this.state.playerLevel++;
            this.showNotification(`Поздравляем! Вы достигли уровня ${this.state.playerLevel}!`, 'success');
        }
    },
    
    // Создание эффекта клика
    createClickEffect: function(event) {
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        effect.style.left = (event.clientX - 25) + 'px';
        effect.style.top = (event.clientY - 25) + 'px';
        
        document.body.appendChild(effect);
        
        // Удаление эффекта после анимации
        setTimeout(() => effect.remove(), 500);
    },
    
    // Воспроизведение звука клика
    playClickSound: function() {
        // Создаем аудио контекст если нет
        if (!window.audioContext) {
            window.AudioContext = window.AudioContext || window.webkitAudioContext;
            window.audioContext = new AudioContext();
        }
        
        try {
            const oscillator = window.audioContext.createOscillator();
            const gainNode = window.audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(window.audioContext.destination);
            
            oscillator.frequency.value = 800 + (Math.random() * 200);
            oscillator.type = 'sine';
            
            gainNode.gain.setValueAtTime(0.1, window.audioContext.currentTime);
            gainNode.gain.exponentialRampToValueAtTime(0.01, window.audioContext.currentTime + 0.1);
            
            oscillator.start(window.audioContext.currentTime);
            oscillator.stop(window.audioContext.currentTime + 0.1);
        } catch (e) {
            console.log('Аудио не поддерживается');
        }
    },
    
    // Показать уведомление
    showNotification: function(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        
        // Иконка в зависимости от типа
        let icon = 'info-circle';
        if (type === 'success') icon = 'check-circle';
        if (type === 'error') icon = 'exclamation-circle';
        
        notification.innerHTML = `
            <i class="fas fa-${icon}"></i>
            <span>${message}</span>
        `;
        
        this.elements.notificationContainer.appendChild(notification);
        
        // Автоудаление через 3 секунды
        setTimeout(() => {
            notification.style.animation = 'fadeOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    },
    
    // Обновление интерфейса
    updateUI: function() {
        // Энергия
        const energyPercent = (this.state.energy / this.state.maxEnergy) * 100;
        this.elements.energyBar.style.width = energyPercent + '%';
        this.elements.energyDisplay.textContent = `${this.formatNumber(this.state.energy)}/${this.formatNumber(this.state.maxEnergy)}`;
        
        // Время восстановления
        const energyNeeded = this.state.maxEnergy - this.state.energy;
        const secondsToFull = Math.ceil(energyNeeded / this.state.regenerationRate);
        const minutes = Math.floor(secondsToFull / 60);
        const seconds = secondsToFull % 60;
        this.elements.regenTime.textContent = `${minutes}:${seconds.toString().padStart(2, '0')}`;
        this.elements.regenRate.textContent = this.state.regenerationRate;
        
        // Статистика
        this.elements.totalClicks.textContent = this.formatNumber(this.state.totalClicks);
        this.elements.clickPower.textContent = this.formatNumber(this.state.clickPower);
        this.elements.clickPowerDisplay.textContent = this.formatNumber(this.state.clickPower);
        this.elements.clicksPerSecond.textContent = this.formatNumber(this.state.clicksPerSecond);
        this.elements.autoClickers.textContent = this.formatNumber(this.state.autoClickers);
        
        // Улучшения
        this.elements.powerLevel.textContent = this.state.upgrades.power.level;
        this.elements.powerCost.textContent = this.formatNumber(this.state.upgrades.power.cost);
        this.elements.batteryLevel.textContent = this.state.upgrades.battery.level;
        this.elements.batteryCost.textContent = this.formatNumber(this.state.upgrades.battery.cost);
        this.elements.autoLevel.textContent = this.state.upgrades.auto.level;
        this.elements.autoCost.textContent = this.formatNumber(this.state.upgrades.auto.cost);
        this.elements.speedLevel.textContent = this.state.upgrades.speed.level;
        this.elements.speedCost.textContent = this.formatNumber(this.state.upgrades.speed.cost);
        
        // Баланс и токены
        this.elements.balance.textContent = this.formatNumber(this.state.balance);
        this.elements.tokens.textContent = this.state.tokens.toFixed(4);
        this.elements.progressPercent.textContent = this.state.progress.toFixed(1) + '%';
        this.elements.progressFill.style.width = this.state.progress + '%';
        this.elements.requiredTokens.textContent = this.formatNumber(this.state.requiredTokens);
        
        // Уровень игрока
        this.elements.playerLevel.textContent = this.state.playerLevel;
        
        // Обновление доступности кнопок улучшений
        this.updateButtonsState();
    },
    
    // Обновление состояния кнопок
    updateButtonsState: function() {
        document.querySelectorAll('.buy-button').forEach(button => {
            const upgradeType = button.dataset.upgrade;
            const upgrade = this.state.upgrades[upgradeType];
            
            if (this.state.balance >= upgrade.cost) {
                button.disabled = false;
                button.style.opacity = '1';
            } else {
                button.disabled = true;
                button.style.opacity = '0.5';
            }
        });
        
        // Кнопка буста
        const boostButton = document.getElementById('boost-button');
        if (this.state.boostActive) {
            boostButton.innerHTML = '<i class="fas fa-rocket"></i><span>Буст активен</span>';
            boostButton.style.background = 'linear-gradient(135deg, var(--success), #2E7D32)';
            boostButton.disabled = true;
        } else {
            boostButton.innerHTML = '<i class="fas fa-rocket"></i><span>Буст x2 (1 час)</span>';
            boostButton.style.background = '';
            boostButton.disabled = false;
        }
    },
    
    // Запуск игровых циклов
    startGameLoops: function() {
        // Восстановление энергии
        setInterval(() => {
            if (this.state.energy < this.state.maxEnergy) {
                this.state.energy = Math.min(
                    this.state.maxEnergy,
                    this.state.energy + this.state.regenerationRate
                );
                this.updateUI();
            }
        }, 1000);
        
        // Автокликеры
        setInterval(() => {
            if (this.state.autoClickers > 0 && this.state.energy >= this.state.clickPower) {
                const autoClicks = this.state.autoClickers;
                const energyCost = this.state.clickPower * autoClicks;
                
                if (this.state.energy >= energyCost) {
                    this.state.energy -= energyCost;
                    this.state.totalClicks += autoClicks;
                    this.state.balance += autoClicks;
                    
                    // Токены за автоклики (в 2 раза меньше)
                    this.state.tokens += (autoClicks * 0.0005);
                    this.state.progress += (autoClicks * 0.00005);
                    
                    this.updateUI();
                }
            }
        }, 1000);
        
        // Обновление времени буста
        setInterval(() => {
            if (this.state.boostActive && Date.now() >= this.state.boostEndTime) {
                this.state.boostActive = false;
                this.state.clickPower = Math.floor(this.state.clickPower / 2);
                this.showNotification('Буст закончился!', 'info');
                this.updateUI();
            }
        }, 1000);
    },
    
    // Инициализация Telegram WebApp
    initTelegramWebApp: function() {
        if (window.Telegram && Telegram.WebApp) {
            console.log('📱 Telegram WebApp обнаружен');
            
            // Раскрываем на весь экран
            Telegram.WebApp.expand();
            
            // Настройка основной кнопки
            Telegram.WebApp.MainButton.setText('Открыть меню');
            Telegram.WebApp.MainButton.show();
            Telegram.WebApp.MainButton.onClick(() => {
                this.showNotification('Меню скоро будет доступно!', 'info');
            });
            
            // Настройка темы
            Telegram.WebApp.setHeaderColor('#7B61FF');
            Telegram.WebApp.setBackgroundColor('#1A1A2E');
            
            // Обработчик изменения темы
            Telegram.WebApp.onEvent('themeChanged', () => {
                const theme = Telegram.WebApp.colorScheme;
                console.log('Тема изменена:', theme);
            });
            
            // Показываем данные пользователя
            if (Telegram.WebApp.initDataUnsafe.user) {
                const user = Telegram.WebApp.initDataUnsafe.user;
                console.log('Пользователь Telegram:', user);
                
                // Можно использовать user.id для сохранения прогресса
                this.state.telegramUserId = user.id;
            }
        } else {
            console.log('ℹ️ Telegram WebApp не обнаружен, запуск в браузере');
        }
    },
    
    // Форматирование чисел
    formatNumber: function(num) {
        if (num >= 1000000) {
            return (num / 1000000).toFixed(1) + 'M';
        }
        if (num >= 1000) {
            return (num / 1000).toFixed(1) + 'K';
        }
        return Math.floor(num).toString();
    },
    
    // Сохранение игры
    saveGame: function() {
        try {
            const saveData = {
                state: this.state,
                timestamp: Date.now()
            };
            localStorage.setItem('zootopia_clicker_save', JSON.stringify(saveData));
            console.log('💾 Игра сохранена');
        } catch (e) {
            console.error('Ошибка сохранения:', e);
        }
    },
    
    // Загрузка игры
    loadGame: function() {
        try {
            const saved = localStorage.getItem('zootopia_clicker_save');
            if (saved) {
                const saveData = JSON.parse(saved);
                
                // Проверка времени сохранения (не старше 30 дней)
                const daysSinceSave = (Date.now() - saveData.timestamp) / (1000 * 60 * 60 * 24);
                if (daysSinceSave < 30) {
                    this.state = { ...this.state, ...saveData.state };
                    console.log('💾 Игра загружена');
                    this.showNotification('Прогресс загружен!', 'success');
                }
            }
        } catch (e) {
            console.error('Ошибка загрузки:', e);
            // Создаем новый сохраненный файл при ошибке
            this.saveGame();
        }
    },
    
    // Сброс игры (для тестирования)
    resetGame: function() {
        if (confirm('Вы уверены? Весь прогресс будет потерян!')) {
            localStorage.removeItem('zootopia_clicker_save');
            location.reload();
        }
    }
};

// ============================================
// ЗАПУСК ИГРЫ ПРИ ЗАГРУЗКЕ СТРАНИЦЫ
// ============================================

// Ждем полной загрузки DOM
document.addEventListener('DOMContentLoaded', function() {
    console.log('📄 DOM загружен, запускаем игру...');
    
    // Запускаем игру
    Game.init();
    
    // Добавляем кнопку сброса для разработки (только в development)
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        const resetBtn = document.createElement('button');
        resetBtn.textContent = '🔄 Сброс';
        resetBtn.style.position = 'fixed';
        resetBtn.style.bottom = '10px';
        resetBtn.style.left = '10px';
        resetBtn.style.zIndex = '9999';
        resetBtn.style.padding = '5px 10px';
        resetBtn.style.background = 'var(--danger)';
        resetBtn.style.color = 'white';
        resetBtn.style.border = 'none';
        resetBtn.style.borderRadius = '5px';
        resetBtn.style.cursor = 'pointer';
        resetBtn.addEventListener('click', () => Game.resetGame());
        document.body.appendChild(resetBtn);
    }
});

// Обработка ошибок
window.addEventListener('error', function(e) {
    console.error('❌ Ошибка в игре:', e.error);
    Game.showNotification('Произошла ошибка в игре. Пожалуйста, обновите страницу.', 'error');
});

// ============================================
// ДОПОЛНИТЕЛЬНЫЕ ФУНКЦИИ ДЛЯ TELEGRAM
// ============================================

// Функция для отправки данных в Telegram бота
function sendDataToBot(data) {
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.sendData(JSON.stringify(data));
        return true;
    }
    return false;
}

// Функция для открытия ссылки в Telegram
function openTelegramLink(url) {
    if (window.Telegram && Telegram.WebApp) {
        Telegram.WebApp.openLink(url);
    } else {
        window.open(url, '_blank');
    }
}

// Экспортируем Game для доступа из консоли
window.Game = Game;
