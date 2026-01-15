// Магазин игровых предметов
class Shop {
    constructor() {
        this.items = [
            {
                id: 'energy_pack',
                name: 'Энергетик',
                description: '+1000 энергии',
                icon: 'fa-bolt',
                price: 50,
                type: 'energy',
                action: (game) => {
                    game.energy += 1000;
                    if (game.energy > game.maxEnergy) {
                        game.energy = game.maxEnergy;
                    }
                    return { success: true, message: 'Энергия восстановлена!' };
                }
            },
            {
                id: 'boost_1h',
                name: 'Буст x2 (1 час)',
                description: 'Удваивает силу клика на 1 час',
                icon: 'fa-rocket',
                price: 100,
                type: 'boost',
                duration: 3600000, // 1 час в миллисекундах
                action: (game) => {
                    if (game.boost.active) {
                        return { success: false, message: 'Буст уже активен!' };
                    }
                    
                    game.boost.active = true;
                    game.boost.multiplier = 2;
                    game.boost.endTime = Date.now() + 3600000;
                    game.clickPower *= 2;
                    
                    return { success: true, message: 'Буст x2 активирован на 1 час!' };
                }
            },
            {
                id: 'boost_24h',
                name: 'Буст x2 (24 часа)',
                description: 'Удваивает силу клика на 24 часа',
                icon: 'fa-rocket',
                price: 500,
                type: 'boost',
                duration: 86400000, // 24 часа
                action: (game) => {
                    if (game.boost.active) {
                        return { success: false, message: 'Буст уже активен!' };
                    }
                    
                    game.boost.active = true;
                    game.boost.multiplier = 2;
                    game.boost.endTime = Date.now() + 86400000;
                    game.clickPower *= 2;
                    
                    return { success: true, message: 'Буст x2 активирован на 24 часа!' };
                }
            },
            {
                id: 'vip_status',
                name: 'VIP статус',
                description: 'Навсегда +20% к скорости восстановления',
                icon: 'fa-crown',
                price: 1000,
                type: 'permanent',
                action: (game) => {
                    if (game.vip) {
                        return { success: false, message: 'VIP статус уже активирован!' };
                    }
                    
                    game.vip = true;
                    game.regenerationRate = Math.floor(game.regenerationRate * 1.2);
                    
                    return { success: true, message: 'VIP статус активирован! +20% к скорости' };
                }
            },
            {
                id: 'auto_cliker_pack',
                name: 'Набор автокликеров',
                description: '+5 автокликеров',
                icon: 'fa-robot',
                price: 250,
                type: 'auto',
                action: (game) => {
                    game.autoClickers += 5;
                    game.clicksPerSecond += 5;
                    game.upgrades.auto.level += 5;
                    
                    return { success: true, message: 'Добавлено 5 автокликеров!' };
                }
            },
            {
                id: 'power_upgrade_pack',
                name: 'Набор улучшений',
                description: '+5 уровней Мощного удара',
                icon: 'fa-fist-raised',
                price: 300,
                type: 'upgrade',
                action: (game) => {
                    game.upgrades.power.level += 5;
                    game.clickPower += 5;
                    
                    // Обновляем стоимость следующего улучшения
                    game.upgrades.power.cost = Math.floor(
                        game.upgrades.power.baseCost * 
                        Math.pow(game.upgrades.power.multiplier, game.upgrades.power.level)
                    );
                    
                    return { success: true, message: 'Добавлено +5 к силе клика!' };
                }
            }
        ];
        
        // Инициализируем магазин
        this.init();
    }
    
    init() {
        // Загружаем историю покупок
        this.loadPurchaseHistory();
        
        // Настраиваем UI
        this.setupUI();
        
        // Запускаем проверку бустов
        this.startBoostChecker();
    }
    
    loadPurchaseHistory() {
        try {
            const saved = localStorage.getItem('zootopia_shop_history');
            if (saved) {
                const data = JSON.parse(saved);
                this.purchases = data.purchases || [];
                this.vip = data.vip || false;
            } else {
                this.purchases = [];
                this.vip = false;
            }
        } catch (error) {
            console.error('Ошибка загрузки истории покупок:', error);
            this.purchases = [];
            this.vip = false;
        }
    }
    
    savePurchaseHistory() {
        try {
            const data = {
                purchases: this.purchases,
                vip: this.vip,
                timestamp: Date.now()
            };
            localStorage.setItem('zootopia_shop_history', JSON.stringify(data));
        } catch (error) {
            console.error('Ошибка сохранения истории покупок:', error);
        }
    }
    
    setupUI() {
        const shopButton = document.getElementById('shop-button');
        if (shopButton) {
            shopButton.addEventListener('click', () => this.openShopModal());
        }
        
        // Настраиваем кнопки покупки в модалке
        document.addEventListener('click', (e) => {
            if (e.target.classList.contains('buy-item-button')) {
                const itemId = e.target.dataset.item;
                this.buyItem(itemId);
            }
        });
    }
    
    openShopModal() {
        const modal = document.getElementById('shop-modal');
        if (!modal) return;
        
        // Показываем модалку
        modal.style.display = 'flex';
        document.body.style.overflow = 'hidden';
        
        // Настраиваем закрытие
        const closeBtn = modal.querySelector('.modal-close');
        if (closeBtn) {
            closeBtn.onclick = () => {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            };
        }
        
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.style.display = 'none';
                document.body.style.overflow = 'auto';
            }
        };
    }
    
    // Покупка предмета
    buyItem(itemId) {
        const game = window.Game?.state;
        if (!game) {
            this.showNotification('Игра не инициализирована', 'error');
            return;
        }
        
        const item = this.items.find(i => i.id === itemId);
        if (!item) {
            this.showNotification('Предмет не найден', 'error');
            return;
        }
        
        // Проверяем, достаточно ли токенов
        if (game.tokens < item.price) {
            this.showNotification(`Недостаточно токенов! Нужно: ${item.price} SZOO`, 'error');
            return;
        }
        
        // Проверяем, можно ли купить предмет
        if (item.id === 'vip_status' && game.vip) {
            this.showNotification('VIP статус уже активирован!', 'warning');
            return;
        }
        
        if (item.type === 'boost' && game.boost.active) {
            this.showNotification('Буст уже активен! Дождитесь окончания.', 'warning');
            return;
        }
        
        // Списание токенов
        game.tokens -= item.price;
        
        // Выполняем действие предмета
        const result = item.action(game);
        
        if (result.success) {
            // Добавляем в историю покупок
            this.purchases.push({
                id: itemId,
                name: item.name,
                price: item.price,
                timestamp: Date.now()
            });
            
            // Сохраняем историю
            this.savePurchaseHistory();
            
            // Сохраняем игру
            if (window.Game?.saveGame) {
                window.Game.saveGame();
            }
            
            // Показываем уведомление
            this.showNotification(result.message, 'success');
            
            // Обновляем UI
            if (window.Game?.updateUI) {
                window.Game.updateUI();
            }
            
            // Тактильная обратная связь
            if (window.TelegramIntegration) {
                window.TelegramIntegration.haptic('medium');
            }
            
            // Закрываем модалку магазина
            setTimeout(() => {
                const modal = document.getElementById('shop-modal');
                if (modal) {
                    modal.style.display = 'none';
                    document.body.style.overflow = 'auto';
                }
            }, 1500);
            
            // Отправляем данные о покупке на сервер
            this.sendPurchaseToServer(item);
            
        } else {
            this.showNotification(result.message, 'error');
            // Возвращаем токены
            game.tokens += item.price;
        }
    }
    
    sendPurchaseToServer(item) {
        // Отправляем данные о покупке на сервер для аналитики
        const game = window.Game?.state;
        if (!game || !game.telegramId) return;
        
        const purchaseData = {
            telegramId: game.telegramId,
            itemId: item.id,
            itemName: item.name,
            price: item.price,
            timestamp: Date.now(),
            wallet: game.walletAddress
        };
        
        // В реальном проекте здесь будет fetch на ваш сервер
        console.log('Покупка отправлена на сервер:', purchaseData);
        
        // Имитация отправки
        if (window.TelegramIntegration) {
            window.TelegramIntegration.sendData({
                type: 'purchase',
                data: purchaseData
            });
        }
    }
    
    startBoostChecker() {
        // Проверяем окончание бустов каждую секунду
        setInterval(() => {
            const game = window.Game?.state;
            if (!game || !game.boost.active) return;
            
            if (Date.now() >= game.boost.endTime) {
                // Буст закончился
                game.boost.active = false;
                game.clickPower = Math.floor(game.clickPower / game.boost.multiplier);
                
                this.showNotification('Буст закончился!', 'info');
                
                // Сохраняем игру
                if (window.Game?.saveGame) {
                    window.Game.saveGame();
                }
                
                // Обновляем UI
                if (window.Game?.updateUI) {
                    window.Game.updateUI();
                }
            }
        }, 1000);
    }
    
    showNotification(message, type = 'info') {
        if (window.Game?.showNotification) {
            window.Game.showNotification(message, type);
        } else {
            const notification = document.createElement('div');
            notification.className = `notification ${type}`;
            notification.textContent = message;
            notification.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                padding: 15px 20px;
                background: ${type === 'success' ? '#4CAF50' : type === 'error' ? '#f44336' : '#2196F3'};
                color: white;
                border-radius: 8px;
                z-index: 10000;
                animation: slideIn 0.3s ease;
            `;
            
            document.body.appendChild(notification);
            
            setTimeout(() => {
                notification.style.animation = 'slideOut 0.3s ease';
                setTimeout(() => notification.remove(), 300);
            }, 3000);
        }
    }
    
    // Получить историю покупок
    getPurchaseHistory() {
        return this.purchases;
    }
    
    // Получить потраченную сумму
    getTotalSpent() {
        return this.purchases.reduce((total, purchase) => total + purchase.price, 0);
    }
    
    // Получить статистику по предметам
    getItemStats() {
        const stats = {};
        this.purchases.forEach(purchase => {
            if (!stats[purchase.id]) {
                stats[purchase.id] = {
                    count: 0,
                    totalSpent: 0
                };
            }
            stats[purchase.id].count++;
            stats[purchase.id].totalSpent += purchase.price;
        });
        return stats;
    }
}

// Инициализируем магазин
document.addEventListener('DOMContentLoaded', () => {
    window.Shop = new Shop();
});
