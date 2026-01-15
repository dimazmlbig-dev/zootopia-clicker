// Telegram WebApp интеграция
class TelegramIntegration {
    constructor() {
        this.tg = window.Telegram?.WebApp;
        this.user = null;
        this.initData = null;
        
        if (this.tg) {
            this.init();
        }
    }
    
    init() {
        try {
            // Инициализация Telegram WebApp
            this.tg.ready();
            this.tg.expand();
            
            // Получаем данные пользователя
            this.initData = this.tg.initDataUnsafe;
            this.user = this.initData?.user;
            
            console.log('Telegram WebApp инициализирован');
            console.log('Пользователь:', this.user);
            
            // Настройка темы
            this.setupTheme();
            
            // Настройка основной кнопки
            this.setupMainButton();
            
        } catch (error) {
            console.error('Ошибка инициализации Telegram:', error);
        }
    }
    
    setupTheme() {
        // Установка цвета заголовка и фона
        this.tg.setHeaderColor('#7B61FF');
        this.tg.setBackgroundColor('#1A1A2E');
        
        // Обработчик изменения темы
        this.tg.onEvent('themeChanged', () => {
            console.log('Тема изменена:', this.tg.colorScheme);
        });
    }
    
    setupMainButton() {
        // Основная кнопка Telegram
        this.tg.MainButton.setText('Открыть меню');
        this.tg.MainButton.onClick(() => {
            this.showMainMenu();
        });
        this.tg.MainButton.show();
    }
    
    showMainMenu() {
        // Показываем меню магазина
        window.Shop?.openShopModal();
    }
    
    // Тактильная обратная связь
    haptic(type = "light") {
        if (this.tg?.HapticFeedback) {
            const types = {
                light: "light",
                medium: "medium",
                heavy: "heavy",
                rigid: "rigid",
                soft: "soft"
            };
            
            this.tg.HapticFeedback.impactOccurred(types[type] || "light");
        }
    }
    
    // Отправка данных в бота
    sendData(data) {
        if (this.tg) {
            this.tg.sendData(JSON.stringify(data));
            return true;
        }
        return false;
    }
    
    // Открытие ссылки в Telegram
    openLink(url) {
        if (this.tg) {
            this.tg.openLink(url);
        } else {
            window.open(url, '_blank');
        }
    }
    
    // Закрытие WebApp
    close() {
        if (this.tg) {
            this.tg.close();
        }
    }
    
    // Проверка, запущен ли в Telegram
    isTelegram() {
        return !!this.tg;
    }
    
    // Получить ID пользователя
    getUserId() {
        return this.user?.id;
    }
    
    // Получить username
    getUsername() {
        return this.user?.username || "";
    }
    
    // Получить полное имя
    getFullName() {
        if (!this.user) return "";
        return [this.user.first_name, this.user.last_name].filter(Boolean).join(' ');
    }
}

// Экспортируем глобально
window.TelegramIntegration = new TelegramIntegration();

// Короткие функции для удобства
function haptic(type = "light") {
    window.TelegramIntegration.haptic(type);
}

function isTelegram() {
    return window.TelegramIntegration.isTelegram();
}

function getTelegramUser() {
    return window.TelegramIntegration.user;
}
