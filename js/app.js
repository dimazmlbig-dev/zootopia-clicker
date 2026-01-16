let state = {
    bones: 0,
    zoo: 0,
    energy: 1000,
    inventory: [],
    equipped: { glasses: false, hat: false }
};

const tg = window.Telegram.WebApp;
tg.expand();

// Обновление цифр
function updateUI() {
    document.getElementById('bones-display').innerText = Math.floor(state.bones).toLocaleString();
    document.getElementById('zoo-display').innerText = state.zoo.toFixed(4);
    document.getElementById('en-curr').innerText = Math.floor(state.energy);
    document.getElementById('en-fill').style.width = (state.energy / 10) + '%';
}

// Тап по таксе
document.getElementById('tap-zone').addEventListener('touchstart', (e) => {
    e.preventDefault();
    if (state.energy >= 1) {
        let power = 1;
        if(state.equipped.glasses) power += 5;
        if(state.equipped.hat) power += 15;

        state.bones += power;
        state.zoo += (power * 0.0001);
        state.energy -= 1;
        
        document.getElementById('dog-hero').style.transform = 'scale(0.95)';
        setTimeout(() => document.getElementById('dog-hero').style.transform = 'scale(1)', 50);
        
        updateUI();
        tg.HapticFeedback.impactOccurred('light');
    }
});

// Работа с модалками
function openNFTModal() {
    document.getElementById('modal-title').innerText = "Маркетплейс";
    const list = document.getElementById('nft-list');
    list.innerHTML = `
        <div class="nft-card">
            <img src="assets/nft/glasses_cyber.png">
            <b>Cyber Glasses</b><br><small>+5 к тапу</small>
            <button onclick="buyNFT('glasses')" style="width:100%; margin-top:10px;">10 $ZOO</button>
        </div>
    `;
    document.getElementById('nft-modal').style.display = 'block';
}

function buyNFT(type) {
    const price = (type === 'glasses') ? 10 : 25;
    if (state.zoo >= price) {
        state.zoo -= price;
        const newNft = NFTManager.generateNFT(type);
        state.inventory.push(newNft);
        updateUI();
        tg.showAlert("NFT куплено! Проверьте инвентарь.");
    } else {
        tg.showAlert("Недостаточно $ZOO");
    }
}

function openInventory() {
    document.getElementById('modal-title').innerText = "Мои NFT";
    const list = document.getElementById('nft-list');
    list.innerHTML = state.inventory.map((item, index) => `
        <div class="nft-card">
            <div style="font-size:10px; color:#fbbf24">${item.id}</div>
            <img src="${item.qr}" class="qr-small">
            <div>${item.name}</div>
            <button onclick="equipNFT('${item.type}', ${index})" style="width:100%; margin-top:5px;">
                ${state.equipped[item.type] ? 'Снять' : 'Надеть'}
            </button>
        </div>
    `).join('');
    document.getElementById('nft-modal').style.display = 'block';
}

function equipNFT(type, index) {
    state.equipped[type] = !state.equipped[type];
    const layer = document.getElementById(`layer-${type}`);
    if(state.equipped[type]) {
        layer.classList.add('active');
    } else {
        layer.classList.remove('active');
    }
    closeModal();
}

function closeModal() { document.getElementById('nft-modal').style.display = 'none'; }

// Регенерация энергии
setInterval(() => { if(state.energy < 1000) { state.energy++; updateUI(); }}, 1000);

// Инициализация TON Connect
const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: 'https://raw.githubusercontent.com/ton-connect/demo-dapp-with-react-ui/master/public/tonconnect-manifest.json',
    buttonRootId: 'ton-btn'
});
