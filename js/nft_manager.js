const NFT_DATA = {
    'glasses': { name: 'Cyber Glasses', price: 10, power: 5, image: 'assets/nft/glasses_cyber.png' },
    'hat': { name: 'Sheriff Hat', price: 25, power: 15, image: 'assets/nft/glasses_cyber.png' } // Временно используем то же изображение
};

const NFTManager = {
    generateNFT: function(type) {
        const item = NFT_DATA[type];
        const randomId = Math.random().toString(36).substr(2, 6).toUpperCase();
        const tokenId = `ZOO-${type.toUpperCase()}-${randomId}`;
        
        return {
            id: tokenId,
            type: type,
            name: item.name,
            power: item.power,
            qr: `https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${tokenId}`,
            image: item.image
        };
    }
};
