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
        
        // Буст системы
        boost: {
            active: false,
            multiplier: 1,
            endTime: 0
        },
        
        // VIP статус
        vip: false,
        
        // Уровень игрока
        playerLevel: 1,
        experience: 0,
        
        // Telegram данные
        telegramId: null,
        username: "",
        
        // Кошелёк
        walletConnected: false,
        walletAddress: null,
        walletType: null,
        
        // Игровые бонусы
        achievements: [],
        dailyBonus: {
            lastClaim: null,
            streak: 0
        },
        
        // Статистика
        stats: {
            totalTimePlayed: 0,
            highestClickRate: 0,
            tokensEarned: 0
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
        
        // Обновление интерфейса
        this.updateUI();
        
        // Начальная синхронизация с сервером
        this.syncWithServer();
        
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
            
            // Другие элементы
            notificationContainer: document.getElementById('notification-container')
        };
    },
    
    // Настройка обработчиков событий
    setupEventListeners: function() {
        // Кнопка клика
        this.elements.clickButton.addEventListener('click', (e) => this.handleClick(e));
        
        // Кнопки покупки улучшений
        document.querySelectorAll('.buy-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const upgradeType = e.target.dataset.upgrade || 
                                   e.target.closest('.buy-button').dataset.upgrade;
                this.buyUpgrade(upgradeType);
            });
        });
        
        // Кнопки в магазине уже обрабатываются в shop.js
        // Кнопки достижений уже обрабатываются в achievements.js
        // Кнопка кошелька обрабатывается в wallet.js
        
        // Сохранение игры при закрытии вкладки
        window.addEventListener('beforeunload', () => this.saveGame());
        
        // Сохранение каждые 30 секунд
        setInterval(() => this.saveGame(), 30000);
        
        // Синхронизация с сервером каждые 60 секунд
        setInterval(() => this.syncWithServer(), 60000);
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
        this.state.stats.tokensEarned += tokensEarned;
        
        // Прогресс до листинга (0.0001% за клик)
        this.state.progress += (this.state.clickPower * 0.0001);
        if (this.state.progress > 100) this.state.progress = 100;
        
        // Опыт за клик
        this.gainExperience(this.state.clickPower);
        
        // Тактильная обратная связь
        if (window.TelegramIntegration) {
            window.TelegramIntegration.haptic('light');
        }
        
        // Создание эффекта клика
        this.createClickEffect(event);
        
        // Звук клика
        this.playClickSound();
        
        // Проверка достижений
        if (window.AchievementsSystem) {
            window.AchievementsSystem.checkAchievements(this.state);
        }
        
        // Обновление интерфейса
        this.updateUI();
        
        // Периодическое сохранение
        if (this.state.totalClicks % 20 === 0) {
            this.saveGame();
        }
        
        // Обновление статистики кликов в секунду
        this.updateCPS();
    },
    
    // Обновление CPS (кликов в секунду)
    updateCPS: function() {
        if (!this.lastClickTime) {
            this.lastClickTime = Date.now();
            this.clickCount = 0;
        }
        
        this.clickCount++;
        const now = Date.now();
        const elapsed = (now - this.lastClickTime) / 1000;
        
        if (elapsed >= 1) {
            this.state.clicksPerSecond = Math.floor(this.clickCount / elapsed);
            this.clickCount = 0;
            this.lastClickTime = now;
            
            // Обновляем максимальную скорость
            if (this.state.clicksPerSecond > this.state.stats.highestClickRate) {
                this.state.stats.highestClickRate = this.state.clicksPerSecond;
            }
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
        
        // Тактильная обратная связь
        if (window.TelegramIntegration) {
            window.TelegramIntegration.haptic('medium');
        }
        
        // Проверка достижений
        if (window.AchievementsSystem) {
            window.AchievementsSystem.checkAchievements(this.state);
        }
        
        // Обновление интерфейса
        this.updateUI();
        
        // Сохранение игры
        this.saveGame();
    },
    
    // Получение опыта
    gainExperience: function(amount) {
        this.state.experience += amount;
        
        // Проверка повышения уровня (1000 опыта за уровень)
        const requiredExp = this.state.playerLevel * 1000;
        if (this.state.experience >= requiredExp) {
            this.state.experience -= requiredExp;
            this.state.playerLevel++;
            
            // Награда за уровень
            const levelReward = this.state.playerLevel * 100;
            this.state.balance += levelReward;
            this.state.tokens += levelReward * 0.01;
            
            this.showNotification(`Поздравляем! Вы достигли уровня ${this.state.playerLevel}! +${levelReward}$`, 'success');
            
            // Тактильная обратная связь
            if (window.TelegramIntegration) {
                window.TelegramIntegration.haptic('heavy');
            }
        }
    },
    
    // Создание эффекта клика
    createClickEffect: function(event) {
        const effect = document.createElement('div');
        effect.className = 'click-effect';
        
        const rect = this.elements.clickButton.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        
        effect.style.left = (x - 25) + 'px';
        effect.style.top = (y - 25) + 'px';
        effect.style.width = '50px';
        effect.style.height = '50px';
        
        this.elements.clickButton.appendChild(effect);
        
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
        if (type === 'warning') icon = 'exclamation-triangle';
        
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
                    
                    // Опыт за автоклики
                    this.gainExperience(autoClicks);
                    
                    this.updateUI();
                }
            }
        }, 1000);
        
        // Обновление времени буста
        setInterval(() => {
            if (this.state.boost.active && Date.now() >= this.state.boost.endTime) {
                this.state.boost.active = false;
                this.state.clickPower = Math.floor(this.state.clickPower / this.state.boost.multiplier);
                this.showNotification('Буст закончился!', 'info');
                this.updateUI();
                this.saveGame();
            }
        }, 1000);
        
        // Обновление общего времени игры
        setInterval(() => {
            this.state.stats.totalTimePlayed += 1;
            if (this.state.stats.totalTimePlayed % 60 === 0) {
                this.saveGame();
            }
        }, 1000);
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
            // Сохраняем Telegram ID если есть
            if (window.TelegramIntegration?.getUserId()) {
                this.state.telegramId = window.TelegramIntegration.getUserId();
                this.state.username = window.TelegramIntegration.getUsername();
            }
            
            // Сохраняем данные кошелька если есть
            if (window.TONWallet?.wallet) {
                this.state.walletConnected = true;
                this.state.walletAddress = window.TONWallet.wallet.account.address;
                this.state.walletType = window.TONWallet.wallet.device.appName;
            }
            
            const saveData = {
                state: this.state,
                timestamp: Date.now(),
                version: '1.0.0'
            };
            
            localStorage.setItem('zootopia_clicker_save', JSON.stringify(saveData));
            
            // Синхронизация с сервером
            this.syncWithServer();
            
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
                
                // Проверка версии сохранения
                if (saveData.version === '1.0.0') {
                    this.state = { ...this.state, ...saveData.state };
                    console.log('💾 Игра загружена');
                    this.showNotification('Прогресс загружен!', 'success');
                } else {
                    console.log('⚠️ Версия сохранения устарела, создаём новое');
                }
            }
        } catch (e) {
            console.error('Ошибка загрузки:', e);
            // Создаем новый сохраненный файл при ошибке
            this.saveGame();
        }
    },
    
    // Синхронизация с сервером
    syncWithServer: function() {
        // Если нет Telegram ID, не синхронизируем
        if (!this.state.telegramId) return;
        
        const syncData = {
            telegramId: this.state.telegramId,
            totalClicks: this.state.totalClicks,
            tokens: this.state.tokens,
            balance: this.state.balance,
            playerLevel: this.state.playerLevel,
            achievements: window.AchievementsSystem?.getUnlockedCount() || 0,
            wallet: this.state.walletAddress,
            timestamp: Date.now()
        };
        
        // В реальном проекте здесь будет fetch на ваш сервер
        console.log('Синхронизация с сервером:', syncData);
        
        // Можно добавить реальный запрос на сервер
        /*
        fetch('https://your-server.com/sync', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(syncData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.updated) {
                console.log('Синхронизация успешна');
            }
        })
        .catch(error => {
            console.error('Ошибка синхронизации:', error);
        });
        */
    },
    
    // Сброс игры (для тестирования)
    resetGame: function() {
        if (confirm('Вы уверены? Весь прогресс будет потерян!')) {
            localStorage.removeItem('zootopia_clicker_save');
            localStorage.removeItem('zootopia_achievements');
            localStorage.removeItem('zootopia_shop_history');
            location.reload();
        }
