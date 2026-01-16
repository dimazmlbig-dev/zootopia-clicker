// Логика управления уникальными NFT
const NFTManager = {
    // Генерация уникального цифрового отпечатка предмета
    generateUniqueCode: function(itemType) {
        const prefix = itemType.toUpperCase().substring(0, 3);
        const randomHex = Math.floor(Math.random() * 0xffffff).toString(16).toUpperCase();
        const timestamp = Date.now().toString().slice(-4);
        return `${prefix}-${randomHex}-${timestamp}`; // Пример: GLA-A1B2C3-4567
    },

    // Создание объекта NFT для сохранения в профиль игрока
    mint: function(baseItem) {
        const uniqueId = this.generateUniqueCode(baseItem.type);
        return {
            ...baseItem,
            token_id: uniqueId,
            minted_at: new Date().toISOString(),
            owner_wallet: window.userWalletAddress || "Not Connected",
            qr_link: `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${uniqueId}`
        };
    }
};

window.NFTManager = NFTManager;
