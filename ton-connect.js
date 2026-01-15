const tonConnectUI = new TONConnectUI.TonConnectUI({
    manifestUrl: 'https://dimazmlbig-dev.github.io/zootopia-clicker/tonconnect-manifest.json',
    buttonRootId: 'ton-connect-button'
});

tonConnectUI.onStatusChange(wallet => {
    const statusDot = document.querySelector('.status-dot');
    const statusText = document.getElementById('walletStatus');
    
    if (wallet) {
        statusDot.classList.replace('disconnected', 'connected');
        statusText.innerText = 'Кошелек подключен';
        gameData.multiplier = 2; // Бонус x2
        document.getElementById('multiplierBadge').style.display = 'inline-block';
    } else {
        statusDot.classList.replace('connected', 'disconnected');
        statusText.innerText = 'Не подключен';
        gameData.multiplier = 1;
    }
});
