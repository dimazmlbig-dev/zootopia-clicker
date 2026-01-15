// anti-bot.js - Система защиты от ботов с reCAPTCHA

class AntiBotSystem {
    constructor() {
        // Настройки капчи
        this.config = {
            captchaInterval: 100,        // Каждые 100 кликов
            maxClicksPerSecond: 15,      // Макс 15 кликов в секунду
            botDetectionEnabled: true,
            useRecaptcha: true,          // Использовать Google reCAPTCHA
            recaptchaSiteKey: '6Lc6BpApAAAAAJKd3bJd2QwQkXQ7QYQwQwQwQwQwQ', // ТЕСТОВЫЙ КЛЮЧ
            simpleCaptchaQuestions: [
                { q: "Сколько лап у собаки?", a: "4" },
                { q: "Сколько ушей у кошки?", a: "2" },
                { q: "Первая буква алфавита?", a: "а" },
                { q: "Сколько пальцев на одной руке?", a: "5" },
                { q: "Столица России?", a: "москва" }
            ]
        };
        
        // Статистика кликов
        this.clickStats = {
            totalClicks: 0,
            clickTimes: [],
            lastClickTime: 0,
            captchaCounter: 0,
            isBotSuspected: false,
            captchaSolved: false
        };
        
        // Инициализация
        this.init();
    }
    
    init() {
        console.log('🛡️ Anti-Bot System initialized');
        this.bindEvents();
        this.checkRecaptchaAvailability();
    }
    
    bindEvents() {
        // Отслеживаем все клики
        document.addEventListener('click', (e) => {
            if (e.target.id === 'clickTarget' || e.target.closest('#clickTarget')) {
                this.handleGameClick();
            }
        });
        
        // Проверяем рекапчу при загрузке
        window.addEventListener('load', () => {
            this.renderRecaptcha();
        });
    }
    
    // Основная функция обработки кликов
    handleGameClick() {
        const now = Date.now();
        const timeSinceLastClick = now - this.clickStats.lastClickTime;
        
        // Защита от слишком быстрых кликов (менее 50мс)
        if (timeSinceLastClick < 50 && this.config.botDetectionEnabled) {
            this.showNotification('Слишком быстро! Замедлите темп.', 'warning');
            return false;
        }
        
        // Анализ паттерна кликов
        this.clickStats.clickTimes.push(now);
        if (this.clickStats.clickTimes.length > 10) {
            this.clickStats.clickTimes.shift();
            
            // Проверка на бота (одинаковый интервал)
            if (this.detectBotPattern()) {
                this.triggerCaptcha();
                return false;
            }
            
            // Проверка скорости (CPS)
            const cps = this.calculateCPS();
            if (cps > this.config.maxClicksPerSecond) {
                this.triggerCaptcha();
                return false;
            }
        }
        
        // Обновление статистики
        this.clickStats.totalClicks++;
        this.clickStats.lastClickTime = now;
        this.clickStats.captchaCounter++;
        
        // Проверка необходимости капчи
        if (this.clickStats.captchaCounter >= this.config.captchaInterval && !this.clickStats.captchaSolved) {
            this.triggerCaptcha();
            return false;
        }
        
        return true;
    }
    
    // Обнаружение паттерна бота
    detectBotPattern() {
        if (this.clickStats.clickTimes.length < 5) return false;
        
        const intervals = [];
        for (let i = 1; i < this.clickStats.clickTimes.length; i++) {
            intervals.push(this.clickStats.clickTimes[i] - this.clickStats.clickTimes[i-1]);
        }
        
        // Если все интервалы почти одинаковы (разница < 10мс) - подозрительно
        const variance = Math.max(...intervals) - Math.min(...intervals);
        return variance < 10 && intervals.length >= 5;
    }
    
    // Расчет кликов в секунду
    calculateCPS() {
        if (this.clickStats.clickTimes.length < 2) return 0;
        
        const firstTime = this.clickStats.clickTimes[0];
        const lastTime = this.clickStats.clickTimes[this.clickStats.clickTimes.length - 1];
        const timeDiff = (lastTime - firstTime) / 1000;
        
        return timeDiff > 0 ? this.clickStats.clickTimes.length / timeDiff : 0;
    }
    
    // Показать капчу
    triggerCaptcha() {
        if (this.clickStats.captchaSolved) return;
        
        this.showCaptchaModal();
        this.clickStats.isBotSuspected = true;
        this.showNotification('Требуется проверка безопасности', 'warning');
        
        // Виброотклик в Telegram
        if (window.Telegram && Telegram.WebApp) {
            Telegram.WebApp.HapticFeedback.impactOccurred('heavy');
        }
    }
    
    // Показать модальное окно с капчей
    showCaptchaModal() {
        const modal = document.getElementById('captchaModal');
        const verifyBtn = document.getElementById('verifyCaptchaBtn');
        
        if (!modal) {
            console.error('Captcha modal not found');
            this.showFallbackCaptcha();
            return;
        }
        
        modal.classList.add('active');
        
        // Сбрасываем состояние
        this.clickStats.captchaSolved = false;
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<i class="fas fa-check"></i> Подтвердить';
        
        // Показываем reCAPTCHA или простую капчу
        if (this.config.useRecaptcha && window.grecaptcha) {
            document.getElementById('captchaFallback').style.display = 'none';
            document.getElementById('recaptchaWidget').style.display = 'block';
            
            // Перерендерим reCAPTCHA
            setTimeout(() => {
                if (window.grecaptcha && window.grecaptcha.render) {
                    window.grecaptcha.reset();
                }
            }, 100);
        } else {
            this.showFallbackCaptcha();
        }
    }
    
    // Простая капча (фолбэк)
    showFallbackCaptcha() {
        const fallback = document.getElementById('captchaFallback');
        const recaptcha = document.getElementById('recaptchaWidget');
        
        if (fallback && recaptcha) {
            fallback.style.display = 'block';
            recaptcha.style.display = 'none';
            
            // Генерируем случайный вопрос
            const questions = this.config.simpleCaptchaQuestions;
            const randomQuestion = questions[Math.floor(Math.random() * questions.length)];
            
            document.getElementById('simpleCaptchaQuestion').textContent = randomQuestion.q;
            document.getElementById('simpleCaptchaAnswer').value = '';
            window.currentSimpleCaptchaAnswer = randomQuestion.a.toLowerCase();
        }
    }
    
    // Скрыть модальное окно
    hideCaptchaModal() {
        const modal = document.getElementById('captchaModal');
        if (modal) {
            modal.classList.remove('active');
            this.showNotification('Проверка отменена', 'info');
        }
    }
    
    // Проверка reCAPTCHA
    async verifyRecaptcha() {
        const verifyBtn = document.getElementById('verifyCaptchaBtn');
        const statusDiv = document.createElement('div');
        statusDiv.className = 'captcha-status verifying';
        statusDiv.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Проверка...';
        
        // Вставляем статус перед кнопками
        const modalActions = document.querySelector('.modal-actions');
        modalActions.parentNode.insertBefore(statusDiv, modalActions);
        
        verifyBtn.disabled = true;
        verifyBtn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Проверяется...';
        
        try {
            // Получаем токен от reCAPTCHA
            const token = await this.getRecaptchaToken();
            
            if (!token) {
                throw new Error('Не получен токен reCAPTCHA');
            }
            
            // Здесь должна быть проверка токена на сервере
            // Для демо просто проверяем что токен есть
            if (token && token.length > 50) {
                // Успешная проверка
                statusDiv.className = 'captcha-status success';
                statusDiv.innerHTML = '<i class="fas fa-check-circle"></i> Проверка пройдена!';
                
                this.clickStats.captchaSolved = true;
                this.clickStats.captchaCounter = 0;
                this.clickStats.isBotSuspected = false;
                
                setTimeout(() => {
                    this.hideCaptchaModal();
                    this.showNotification('✅ Проверка безопасности пройдена!', 'success');
                    
                    // Анимация успеха
                    if (window.Telegram && Telegram.WebApp) {
                        Telegram.WebApp.HapticFeedback.notificationOccurred('success');
                    }
                }, 1500);
            } else {
                throw new Error('Неверный токен');
            }
        } catch (error) {
            console.error('Captcha error:', error);
            statusDiv.className = 'captcha-status error';
            statusDiv.innerHTML = '<i class="fas fa-times-circle"></i> Ошибка проверки';
            
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = '<i class="fas fa-redo"></i> Попробовать снова';
            
            setTimeout(() => statusDiv.remove(), 3000);
        }
    }
    
    // Получить токен reCAPTCHA
    getRecaptchaToken() {
        return new Promise((resolve, reject) => {
            if (!window.grecaptcha) {
                reject(new Error('reCAPTCHA not loaded'));
                return;
            }
            
            try {
                const widgetId = document.querySelector('.g-recaptcha').getAttribute('data-widget-id') || 0;
                const token = window.grecaptcha.getResponse(widgetId);
                
                if (token) {
                    resolve(token);
                } else {
                    // Пользователь не отметил капчу
                    this.showNotification('Пожалуйста, отметьте "Я не робот"', 'warning');
                    reject(new Error('Captcha not completed'));
                }
            } catch (error) {
                reject(error);
            }
        });
    }
    
    // Проверка простой капчи
    verifySimpleCaptcha() {
        const answer = document.getElementById('simpleCaptchaAnswer').value.toLowerCase().trim();
        const correctAnswer = window.currentSimpleCaptchaAnswer;
        
        if (answer === correctAnswer) {
            this.clickStats.captchaSolved = true;
            this.clickStats.captchaCounter = 0;
            
            this.hideCaptchaModal();
            this.showNotification('✅ Проверка пройдена!', 'success');
            
            // Анимация успеха
            if (window.Telegram && Telegram.WebApp) {
                Telegram.WebApp.HapticFeedback.notificationOccurred('success');
            }
        } else {
            this.showNotification('❌ Неверный ответ. Попробуйте снова.', 'error');
            document.getElementById('simpleCaptchaAnswer').value = '';
            document.getElementById('simpleCaptchaAnswer').focus();
            
            // Генерируем новый вопрос
            this.showFallbackCaptcha();
        }
    }
    
    // Коллбек при успешной проверке reCAPTCHA
    onCaptchaSuccess(token) {
        const verifyBtn = document.getElementById('verifyCaptchaBtn');
        if (verifyBtn) {
            verifyBtn.disabled = false;
            verifyBtn.innerHTML = '<i class="fas fa-check"></i> Подтвердить';
        }
        
        // Автоматически проверяем через 1 секунду
        setTimeout(() => {
            const antiBot = window.antiBotSystem;
            if (antiBot && !antiBot.clickStats.captchaSolved) {
                antiBot.verifyRecaptcha();
            }
        }, 1000);
    }
    
    // Проверка доступности reCAPTCHA
    checkRecaptchaAvailability() {
        setTimeout(() => {
            if (!window.grecaptcha) {
                console.warn('reCAPTCHA not available, using fallback');
                this.config.useRecaptcha = false;
            }
        }, 3000);
    }
    
    // Рендер reCAPTCHA
    renderRecaptcha() {
        if (window.grecaptcha && this.config.useRecaptcha) {
            try {
                const widgetId = window.grecaptcha.render('recaptchaWidget', {
                    'sitekey': this.config.recaptchaSiteKey,
                    'callback': (token) => this.onCaptchaSuccess(token),
                    'theme': 'dark',
                    'size': 'normal'
                });
                
                document.querySelector('.g-recaptcha').setAttribute('data-widget-id', widgetId);
            } catch (error) {
                console.error('Error rendering reCAPTCHA:', error);
                this.config.useRecaptcha = false;
            }
        }
    }
    
    // Показать уведомление
    showNotification(message, type = 'info') {
        if (window.showNotification) {
            window.showNotification(message, type);
        } else {
            console.log(`${type.toUpperCase()}: ${message}`);
        }
    }
    
    // Получить статистику
    getStats() {
        return {
            totalClicks: this.clickStats.totalClicks,
            cps: this.calculateCPS().toFixed(1),
            isBotSuspected: this.clickStats.isBotSuspected,
            captchaSolved: this.clickStats.captchaSolved,
            captchaCounter: this.clickStats.captchaCounter
        };
    }
    
    // Сбросить статистику
    reset() {
        this.clickStats = {
            totalClicks: 0,
            clickTimes: [],
            lastClickTime: 0,
            captchaCounter: 0,
            isBotSuspected: false,
            captchaSolved: false
        };
        
        console.log('🔄 Anti-Bot stats reset');
    }
}

// Глобальный экспорт
window.antiBotSystem = new AntiBotSystem();

// Экспорт функций для использования в других модулях
export default window.antiBotSystem;

// Экспорт отдельных функций
export const handleGameClick = () => window.antiBotSystem.handleGameClick();
export const showCaptchaModal = () => window.antiBotSystem.showCaptchaModal();
export const hideCaptchaModal = () => window.antiBotSystem.hideCaptchaModal();
export const verifyRecaptcha = () => window.antiBotSystem.verifyRecaptcha();
export const verifySimpleCaptcha = () => window.antiBotSystem.verifySimpleCaptcha();
export const onCaptchaSuccess = (token) => window.antiBotSystem.onCaptchaSuccess(token);
export const getAntiBotStats = () => window.antiBotSystem.getStats();
export const resetAntiBotStats = () => window.antiBotSystem.reset();
