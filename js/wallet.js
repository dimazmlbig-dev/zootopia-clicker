// --- Логика подключения кошелька TON ---

const WalletManager = {
    tonConnectUI: null,

    init: function() {
        // КЛЮЧЕВОЕ ИСПРАВЛЕНИЕ: Убираем buttonRootId, чтобы библиотека НЕ создавала свою кнопку.
        // Мы будем использовать свою, кастомную кнопку для вызова модального окна.
        this.tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
            manifestUrl: 'https://dimazmlbig-dev.github.io/zootopia-clicker/tonconnect-manifest.json'
        });

        this.tonConnectUI.onStatusChange(wallet => {
            if (wallet) {
                // Можно будет добавить логику для отображения адреса кошелька
                console.log("Кошелек подключен:", wallet.account.address);
            } else {
                console.log("Кошелек отключен.");
            }
        });
    },

    // Публичный метод для вызова модального окна из любой нашей кнопки
    openModal: function() {
        if (this.tonConnectUI) {
            this.tonConnectUI.openModal();
        }
    }
};
