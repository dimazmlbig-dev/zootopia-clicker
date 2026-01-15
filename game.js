const tg = window.Telegram?.WebApp;
if (tg) tg.expand();

let gameData = JSON.parse(localStorage.getItem('zoo_save_v1')) || {
    bones: 0,
    zooTokens: 0,
    energy: 1000,
    maxEnergy: 1000,
    tapPower: 1,
    multiplier: 1,
    totalClicks: 0
};

function updateUI() {
    document.getElementById('coins').innerText = Math.floor(gameData.bones).toLocaleString();
    document.getElementById('zooBalance').innerText = gameData.zooTokens.toFixed(4);
    document.getElementById('energyText').innerText = `Энергия: ${gameData.energy}/${gameData.maxEnergy}`;
    document.getElementById('energyFill').style.width = (gameData.energy / gameData.maxEnergy * 100) + '%';
    document.getElementById('totalClicks').innerText = gameData.totalClicks;
    document.getElementById('tapPower').innerText = gameData.tapPower;
    
    localStorage.setItem('zoo_save_v1', JSON.stringify(gameData));
}

function handleTap(e) {
    if (gameData.energy <= 0) {
        if (tg) tg.HapticFeedback.notificationOccurred('warning');
        return;
    }

    // Логика начисления
    gameData.bones += gameData.tapPower;
    gameData.zooTokens += (0.0001 * gameData.multiplier);
    gameData.energy -= 1;
    gameData.totalClicks += 1;

    // Визуальный эффект +1
    const indicator = document.getElementById('tapIndicator');
    indicator.style.left = e.pageX + 'px';
    indicator.style.top = e.pageY + 'px';
    indicator.classList.remove('animate');
    void indicator.offsetWidth; // рестарт анимации
    indicator.classList.add('animate');

    if (tg) tg.HapticFeedback.impactOccurred('medium');
    updateUI();
}

// Регенерация энергии раз в секунду
setInterval(() => {
    if (gameData.energy < gameData.maxEnergy) {
        gameData.energy += 1;
        updateUI();
    }
}, 1500);

window.onload = () => {
    setTimeout(() => {
        document.getElementById('loader').style.display = 'none';
        document.getElementById('mainApp').style.display = 'block';
        updateUI();
    }, 1000);
};
