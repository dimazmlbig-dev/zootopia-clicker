// TON Wallet интеграция через TonConnect
class TONWallet {
    constructor() {
        this.tonConnectUI = null;
        this.wallet = null;
        this.isInitialized = false;
        this.manifestUrl = window.location.origin + '/tonconnect-manifest.json';
        
        this.init();
    }
    
    async init() {
        try {
            // Проверяем, доступен ли TonConnect
            if (typeof TON_CONNECT_UI === 'undefined') {
                console.warn('TON_CONNECT_UI не загружен');
                this.setupFallback();
                return;
            }
            
            // Инициализируем TonConnect UI
            this.tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
                manifestUrl: this.manifestUrl,
                buttonRootId: "connect-wallet",
                actionsConfiguration: {
                    twaReturnUrl: 'https://t.me/ZootopiaClickerBot' // Замени на своего бота
                }
            });
            
            // Подписываемся на изменения статуса кошелька
            this.tonConnectUI.onStatusChange(async (wallet) => {
                await this.handleWalletChange(wallet);
            });
            
            // Проверяем текущий статус
            const currentWallet = await this.tonConnectUI.getWallet();
            if (currentWallet) {
                await this.handleWalletChange(currentWallet);
            }
            
            this.isInitialized = true;
            console.log('TON Wallet инициализирован');
            
        } catch (error) {
            console.error('Ошибка инициализации TON Wallet:', error);
            this.setupFallback();
        }
    }
    
    async handleWalletChange(wallet) {
        if (wallet) {
            this.wallet = wallet;
            console.log('TON кошелёк подключён:', wallet);
            
            // Обновляем состояние игры
            if (window.Game) {
                window.Game.state.walletConnected = true;
                window.Game.state.walletAddress = wallet.account.address;
                window.Game.state.walletType = wallet.device.appName;
                window.Game.saveGame();
            }
            
            // Показываем уведомление
            this.showNotification('TON кошелёк подключён!', 'success');
            
            // Обновляем кнопку
            this.updateConnectButton(true);
            
            // Отправляем событие в Telegram
            if (window.TelegramIntegration?.isTelegram()) {
                window.TelegramIntegration.sendData({
                    type: 'wallet_connected',
                    address: wallet.account.address
                });
            }
            
        } else {
            this.wallet = null;
            
            // Обновляем состояние игры
            if (window.Game) {
                window.Game.state.walletConnected = false;
                window.Game.state.walletAddress = null;
                window.Game.saveGame();
            }
            
            // Обновляем кнопку
            this.updateConnectButton(false);
        }
    }
    
    updateConnectButton(connected) {
        const button = document.getElementById('connect-wallet');
        if (!button) return;
        
        if (connected) {
            button.innerHTML = '<i class="fas fa-check-circle"></i><span>Кошелёк подключен</span>';
            button.style.background = 'linear-gradient(135deg, var(--success), #2E7D32)';
            button.disabled = true;
        } else {
            button.innerHTML = '<i class="fas fa-wallet"></i><span>Подключить TON кошелёк</span>';
            button.style.background = 'linear-gradient(135deg, var(--primary), var(--primary-dark))';
            button.disabled = false;
        }
    }
    
    setupFallback() {
        console.log('Используем fallback для TON Wallet');
        
        const button = document.getElementById('connect-wallet');
        if (button) {
            button.addEventListener('click', () => {
                this.showNotification('Веб-версия: подключите кошелёк через Tonkeeper или Tonhub', 'info');
                this.openWalletModal();
            });
        }
    }
    
    openWalletModal() {
        const modal = document.createElement('div');
        modal.className = 'modal';
        modal.style.display = 'flex';
        modal.innerHTML = `
            <div class="modal-content">
                <div class="modal-header">
                    <h3><i class="fas fa-wallet"></i> Подключение кошелька</h3>
                    <button class="modal-close">&times;</button>
                </div>
                <div class="modal-body">
                    <p>Выберите способ подключения:</p>
                    <div class="wallet-options">
                        <button class="wallet-option" onclick="window.open('https://tonkeeper.com', '_blank')">
                            <i class="fas fa-shield-alt"></i>
                            <span>Tonkeeper</span>
                        </button>
                        <button class="wallet-option" onclick="window.open('https://tonhub.com', '_blank')">
                            <i class="fas fa-cube"></i>
                            <span>Tonhub</span>
                        </button>
                        <button class="wallet-option" onclick="window.open('https://mytonwallet.io', '_blank')">
                            <i class="fas fa-user-circle"></i>
                            <span>MyTonWallet</span>
                        </button>
                    </div>
                    <div class="modal-info">
                        <p><i class="fas fa-exclamation-triangle"></i> После подключения обновите страницу</p>
                    </div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        // Закрытие модалки
        modal.querySelector('.modal-close').addEventListener('click', () => {
            modal.remove();
        });
        
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                modal.remove();
            }
        });
    }
    
    // Отправка транзакции
    async sendTransaction(to, amount, comment = '') {
        if (!this.wallet) {
            throw new Error('Кошелёк не подключен');
        }
        
        try {
            const transaction = {
                validUntil: Math.floor(Date.now() / 1000) + 60, // 60 секунд
                messages: [
                    {
                        address: to,
                        amount: amount.toString(),
                        payload: comment
                    }
                ]
            };
            
            const result = await this.tonConnectUI.sendTransaction(transaction);
            return result;
            
        } catch (error) {
            console.error('Ошибка отправки транзакции:', error);
            throw error;
        }
    }
    
    // Получить баланс
    async getBalance() {
        if (!this.wallet?.account?.address) {
            return '0';
        }
        
        try {
            // Здесь можно реализовать получение баланса через TON API
            // Например, через toncenter.com API
            const response = await fetch(`https://toncenter.com/api/v2/getAddressBalance?address=${this.wallet.account.address}`);
            const data = await response.json();
            return data.result || '0';
        } catch (error) {
            console.error('Ошибка получения баланса:', error);
            return '0';
        }
    }
    
    showNotification(message, type = 'info') {
        if (window.Game?.showNotification) {
            window.Game.showNotification(message, type);
        } else {
            alert(message);
        }
    }
    
    // Отключить кошелёк
    async disconnect() {
        if (this.tonConnectUI) {
            await this.tonConnectUI.disconnect();
            this.wallet = null;
            this.updateConnectButton(false);
        }
    }
}

// Инициализируем при загрузке страницы
document.addEventListener('DOMContentLoaded', () => {
    window.TONWallet = new TONWallet();
});
