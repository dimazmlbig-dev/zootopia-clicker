// ================== СОСТОЯНИЕ ИГРЫ ==================
const game = {
    energy: 1000,
    maxEnergy: 1000,
    regen: 10,

    clicks: 0,
    totalClicks: 0,

    clickPower: 1,
    autoClickers: 0,

    balance: 0,
    tokens: 0,

    level: 1,

    upgrades: {
        power: { level: 0, cost: 1000 },
        battery: { level: 0, cost: 5000 },
        auto: { level: 0, cost: 10000 },
        speed: { level: 0, cost: 25000 }
    },

    boost: {
        active: false,
        endTime: 0
    }
};

// ================== DOM ==================
const el = id => document.getElementById(id);

// ================== ЗАГРУЗКА / СОХРАНЕНИЕ ==================
function saveGame() {
    localStorage.setItem("zootopiaSave", JSON.stringify(game));
}

function loadGame() {
    const save = localStorage.getItem("zootopiaSave");
    if (save) Object.assign(game, JSON.parse(save));
}

// ================== УВЕДОМЛЕНИЯ ==================
function notify(text, type = "info") {
    const n = document.createElement("div");
    n.className = `notification ${type}`;
    n.innerHTML = `<i class="fas fa-info-circle"></i>${text}`;
    el("notification-container").appendChild(n);

    setTimeout(() => {
        n.style.animation = "fadeOut 0.5s";
        setTimeout(() => n.remove(), 500);
    }, 2500);
}

// ================== ОБНОВЛЕНИЕ UI ==================
function updateUI() {
    el("energy-display").textContent = `${Math.floor(game.energy)}/${game.maxEnergy}`;
    el("energy-bar").style.width = `${(game.energy / game.maxEnergy) * 100}%`;

    el("regen-rate").textContent = game.regen;
    el("total-clicks").textContent = game.totalClicks;
    el("click-power").textContent = game.clickPower;
    el("click-power-display").textContent = game.clickPower;
    el("auto-clickers").textContent = game.autoClickers;
    el("clicks-per-second").textContent = game.autoClickers;

    el("balance").textContent = Math.floor(game.balance);
    el("tokens").textContent = game.tokens.toFixed(4);
    el("player-level").textContent = game.level;

    updateUpgrades();
    updateProgress();
}

// ================== КЛИК ==================
el("click-button").addEventListener("click", () => {
    if (game.energy < game.clickPower) return;

    const power = game.boost.active ? game.clickPower * 2 : game.clickPower;

    game.energy -= power;
    game.balance += power;
    game.tokens += power * 0.0001;

    game.totalClicks += 1;
    game.clicks += 1;

    el("click-button").classList.add("pulse");
    setTimeout(() => el("click-button").classList.remove("pulse"), 200);

    updateLevel();
    updateUI();
    saveGame();
});

// ================== УРОВЕНЬ ==================
function updateLevel() {
    game.level = Math.floor(game.totalClicks / 100) + 1;
}

// ================== РЕГЕН ЭНЕРГИИ ==================
setInterval(() => {
    if (game.energy < game.maxEnergy) {
        game.energy += game.regen / 10;
        if (game.energy > game.maxEnergy) game.energy = game.maxEnergy;
        updateUI();
    }
}, 100);

// ================== АВТОКЛИКЕР ==================
setInterval(() => {
    if (game.autoClickers > 0 && game.energy >= game.autoClickers) {
        game.energy -= game.autoClickers;
        game.balance += game.autoClickers;
        game.tokens += game.autoClickers * 0.0001;
        game.totalClicks += game.autoClickers;
        updateUI();
        saveGame();
    }
}, 1000);

// ================== УЛУЧШЕНИЯ ==================
document.querySelectorAll(".buy-button").forEach(btn => {
    btn.addEventListener("click", () => {
        const type = btn.dataset.upgrade;
        const upg = game.upgrades[type];

        if (game.balance < upg.cost) {
            notify("Недостаточно средств", "error");
            return;
        }

        game.balance -= upg.cost;
        upg.level++;
        upg.cost = Math.floor(upg.cost * 1.6);

        switch (type) {
            case "power":
                game.clickPower++;
                break;
            case "battery":
                game.maxEnergy += 100;
                game.energy += 100;
                break;
            case "auto":
                game.autoClickers++;
                break;
            case "speed":
                game.regen = Math.floor(game.regen * 1.2);
                break;
        }

        notify("Улучшение куплено!", "success");
        updateUI();
        saveGame();
    });
});

function updateUpgrades() {
    el("power-level").textContent = game.upgrades.power.level;
    el("battery-level").textContent = game.upgrades.battery.level;
    el("auto-level").textContent = game.upgrades.auto.level;
    el("speed-level").textContent = game.upgrades.speed.level;

    el("power-cost").textContent = game.upgrades.power.cost.toLocaleString();
    el("battery-cost").textContent = game.upgrades.battery.cost.toLocaleString();
    el("auto-cost").textContent = game.upgrades.auto.cost.toLocaleString();
    el("speed-cost").textContent = game.upgrades.speed.cost.toLocaleString();
}

// ================== ПРОГРЕСС ==================
function updateProgress() {
    const required = 1_000_000;
    const percent = Math.min((game.tokens / required) * 100, 100);
    el("progress-fill").style.width = percent + "%";
    el("progress-percent").textContent = percent.toFixed(2) + "%";
}

// ================== МОДАЛКИ ==================
function openModal(id) {
    el(id).style.display = "flex";
}

function closeModals() {
    document.querySelectorAll(".modal").forEach(m => m.style.display = "none");
}

document.querySelectorAll(".modal-close").forEach(btn =>
    btn.addEventListener("click", closeModals)
);

el("connect-wallet").addEventListener("click", () => openModal("wallet-modal"));
el("boost-button").addEventListener("click", () => openModal("boost-modal"));

// ================== БУСТ ==================
el("activate-boost").addEventListener("click", () => {
    if (game.tokens < 500) {
        notify("Недостаточно SZOO", "error");
        return;
    }

    game.tokens -= 500;
    game.boost.active = true;
    game.boost.endTime = Date.now() + 3600000;

    notify("Буст x2 активирован на 1 час!", "success");
    closeModals();
    updateUI();
    saveGame();
});

setInterval(() => {
    if (game.boost.active && Date.now() > game.boost.endTime) {
        game.boost.active = false;
        notify("Буст закончился", "info");
        saveGame();
    }
}, 1000);

// ================== СТАРТ ==================
loadGame();
updateUI();
