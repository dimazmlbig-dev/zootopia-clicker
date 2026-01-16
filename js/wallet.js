// --- Логика подключения кошелька TON ---

const WalletManager = {
    tonConnectUI: null,

    init: function() {
        // 1. Инициализация коннектора с манифестом
        this.tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
            manifestUrl: 'https://dimazmlbig-dev.github.io/zootopia-clicker/tonconnect-manifest.json',
            buttonRootId: 'ton-connect-btn' // ID элемента, куда будет встроена кнопка
        });

        // 2. Подписка на изменение статуса кошелька
        this.tonConnectUI.onStatusChange(wallet => {
            if (wallet) {
                console.log("Кошелек подключен:", wallet.account.address);
                // Здесь можно будет обновлять UI, показывая адрес кошелька
            } else {
                console.log("Кошелек отключен.");
            }
        });
    },

    // Функция для получения адреса (если понадобится в других модулях)
    getConnectedAddress: function() {
        if (this.tonConnectUI && this.tonConnectUI.wallet) {
            return this.tonConnectUI.wallet.account.address;
        }
        return null;
    }
};
