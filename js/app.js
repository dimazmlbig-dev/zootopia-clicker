const tg = window.Telegram.WebApp;
tg.expand();

// TonConnect
const tonConnectUI = new TON_CONNECT_UI.TonConnectUI({
    manifestUrl: 'https://raw.githubusercontent.com/ton-connect/demo-dapp-with-react-ui/master/public/tonconnect-manifest.json',
    buttonRootId: 'ton-btn'
});

// --- STATE ---
let state = {
    bones: 1000,
    zoo: 50.00,
    energy: 1000,
    tapLvl: 1,
    inventory: [] 
};

// --- UTILS ---
function generateUUID() {
    return 'ZOO-' + Math.random().toString(36).substr(2, 6).toUpperCase();
}

function generateQR(data) {
    return `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${data}&color=3b82f6&bgcolor=1e293b`;
}

// --- CORE LOGIC ---
function updateUI() {
    document.getElementById('bones-display').innerText = Math.floor(state.bones).toLocaleString();
    document.getElementById('zoo-display').innerText = state.zoo.toFixed(4);
    document.getElementById('en-curr').innerText = Math.floor(state.energy);
    document.getElementById('en-fill').style.width = (state.energy / 1000 * 100) + '%';
    document.getElementById('tap-lvl').innerText = state.tapLvl;
    document.getElementById('upg-cost').innerText = state.tapLvl * 500;
}

// Tap System
document.getElementById('tap-zone').addEventListener('touchstart', (e) => {
    e.preventDefault();
    if(state.energy >= 2) {
        let totalPower = state.tapLvl; 
        const wearingGlasses = document.getElementById('layer-glasses').classList.contains('visible');
        const wearingHat = document.getElementById('layer-hat').classList.contains('visible');
        if(wearingGlasses) totalPower += 5;
        if(wearingHat) totalPower += 15;

        state.bones += totalPower;
        state.zoo += (0.0001 * totalPower);
        state.energy -= 2;
        
        updateUI();
        tg.HapticFeedback.impactOccurred('light');

        let t = e.touches[0];
        let floatEl = document.createElement('div');
        floatEl.innerText = `+${totalPower}`;
        floatEl.style.position = 'fixed';
        floatEl.style.left = t.clientX + 'px';
        floatEl.style.top = t.clientY + 'px';
        floatEl.style.color = '#fbbf24';
        floatEl.style.fontWeight = '800';
        floatEl.style.zIndex = 1000;
        floatEl.style.animation = 'floatUp 0.8s forwards';
        document.body.appendChild(floatEl);
        setTimeout(()=>floatEl.remove(), 800);
    }
});

// --- NFT SYSTEM ---
window.openNFTModal = function() {
    document.getElementById('nft-modal').classList.add('active');
    renderInventory();
}

window.switchNftTab = function(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    if(tab === 'market') {
        document.getElementById('view-market').style.display = 'grid';
        document.getElementById('view-inventory').style.display = 'none';
        document.querySelector('.tab:first-child').classList.add('active');
    } else {
        document.getElementById('view-market').style.display = 'none';
        document.getElementById('view-inventory').style.display = 'grid';
        document.querySelectorAll('.tab')[1].classList.add('active');
        renderInventory();
    }
}

window.mintNFT = function(type, name, price, power) {
    if(state.zoo >= price) {
        state.zoo -= price;
        const uniqueId = generateUUID();
        const qrCode = generateQR(uniqueId);
        
        const newItem = {
            uid: uniqueId,
            type: type,
            name: name,
            qr: qrCode,
            power: power,
            date: new Date().toLocaleDateString()
        };

        state.inventory.push(newItem);
        updateUI();
        
        tg.showPopup({
            title: 'Минтинг успешен!',
            message: `Вы получили ${name} ID: ${uniqueId}`,
            buttons: [{type: 'ok'}]
        });

        switchNftTab('inventory');
    } else {
        tg.showAlert('Недостаточно $ZOO!');
    }
}

function renderInventory() {
    const container = document.getElementById('view-inventory');
    container.innerHTML = '';

    if(state.inventory.length === 0) {
        container.innerHTML = '<div style="grid-column: span 2; text-align:center; padding:20px; color:#94a3b8">Инвентарь пуст</div>';
        return;
    }

    state.inventory.forEach((item) => {
        const isWearing = document.getElementById(`layer-${item.type}`).classList.contains('visible');
        
        const card = document.createElement('div');
        card.className = 'nft-card';
        card.innerHTML = `
            <div class="nft-id">${item.uid}</div>
            <img src="${item.qr}" class="nft-qr" alt="QR">
            <div style="font-size:12px; font-weight:bold">${item.name}</div>
            <div style="font-size:9px; color:#94a3b8">${item.date}</div>
            <button class="btn" style="margin-top:8px; font-size:11px; background:${isWearing ? '#ef4444' : '#22c55e'}" 
            onclick="toggleWear('${item.type}')">
                ${isWearing ? 'Снять' : 'Надеть'}
            </button>
        `;
        container.appendChild(card);
    });
}

window.toggleWear = function(type) {
    const layer = document.getElementById(`layer-${type}`);
    layer.classList.toggle('visible');
    renderInventory();
}

// --- GAME LOGIC ---
function initGame() {
    const grid = document.getElementById('game-grid');
    grid.innerHTML = '';
    const icons = ['🔷', '🔶', '🦴', '🍖'];
    for(let i=0; i<20; i++) {
        let d = document.createElement('div');
        d.style = "aspect-ratio:1; background:rgba(255,255,255,0.05); border-radius:8px; display:flex; align-items:center; justify-content:center; font-size:24px; cursor:pointer;";
        d.innerText = icons[Math.floor(Math.random()*icons.length)];
        d.onclick = function() {
            this.style.transform = "scale(0)";
            setTimeout(() => {
                this.innerText = icons[Math.floor(Math.random()*icons.length)];
                this.style.transform = "scale(1)";
            }, 200);
            let score = document.getElementById('game-score');
            state.zoo += 0.005;
            score.innerText = (parseFloat(score.innerText) + 0.005).toFixed(3);
            updateUI();
            tg.HapticFeedback.selectionChanged();
        }
        grid.appendChild(d);
    }
}

// --- SYSTEM ---
window.openModal = function(id) { 
    document.getElementById(id).classList.add('active'); 
    if(id === 'game-modal') initGame();
}
window.closeModal = function(id) { document.getElementById(id).classList.remove('active'); }
window.upgradeTap = function() {
    let cost = state.tapLvl * 500;
    if(state.bones >= cost) {
        state.bones -= cost;
        state.tapLvl++;
        updateUI();
    }
}

// Init
window.onload = () => {
    setTimeout(() => {
        document.getElementById('loader').style.opacity = '0';
        setTimeout(()=>document.getElementById('loader').style.display='none', 500);
    }, 1500);
    setInterval(() => {
        if(state.energy < 1000) { state.energy++; updateUI(); }
    }, 1000);
    updateUI();
};
