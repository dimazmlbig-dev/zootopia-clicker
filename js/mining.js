// js/mining.js

// Элементы UI
const miningInfo = document.getElementById('mining-info');
const collectBtn = document.getElementById('collect-btn');

// Загружаем данные майнинга из локального хранилища
let miningData = JSON.parse(localStorage.getItem('miningData')) || {
    level: 1,
    lastCollected: Date.now(),
    available: 0,
    upgradeCost: 100
};

// Настройки
const BASE_RATE = 5; // базовая добыча за секунду
const MAX_OFFLINE_HOURS = 24;
const LEVEL_MULTIPLIER = 1.5; // рост добычи с уровнем

// Расчёт дохода оффлайн
function calculateOfflineMining() {
    const now = Date.now();
    let deltaTime = (now - miningData.lastCollected) / 1000; // в секундах

    // Ограничиваем максимум оффлайн времени
    const maxTime = MAX_OFFLINE_HOURS * 60 * 60;
    if (deltaTime > maxTime) deltaTime = maxTime;

    let income = deltaTime * BASE_RATE * Math.pow(LEVEL_MULTIPLIER, miningData.level - 1);

    // Анти-NaN защита
    if (!isFinite(income) || isNaN(income)) income = 0;

    miningData.available += income;
    miningData.lastCollected = now;

    updateUI();
}

// Обновление интерфейса
function updateUI() {
    miningInfo.textContent = `Уровень: ${miningData.level} | Доступно: ${Math.floor(miningData.available)} | Стоимость улучшения: ${Math.floor(miningData.upgradeCost)}`;
}

// Сбор ресурсов кнопкой
collectBtn.addEventListener('click', () => {
    const bonesCountEl = document.getElementById('bones-count');
    let bones = parseFloat(bonesCountEl.textContent) || 0;

    if (!isFinite(miningData.available) || isNaN(miningData.available)) miningData.available = 0;

    bones += miningData.available;
    miningData.available = 0;

    bonesCountEl.textContent = Math.floor(bones);
    updateUI();
    saveData();
});

// Функция улучшения уровня майнинга
function upgradeMining() {
    const bonesCountEl = document.getElementById('bones-count');
    let bones = parseFloat(bonesCountEl.textContent) || 0;

    if (bones >= miningData.upgradeCost) {
        bones -= miningData.upgradeCost;
        miningData.level += 1;
        miningData.upgradeCost *= 2; // стоимость удваивается каждый уровень
        bonesCountEl.textContent = Math.floor(bones);
        updateUI();
        saveData();
    } else {
        alert("Недостаточно костей для улучшения!");
    }
}

// Добавим кнопку для апгрейда
const upgradeBtn = document.createElement('button');
upgradeBtn.textContent = "Улучшить майнинг";
upgradeBtn.addEventListener('click', upgradeMining);
collectBtn.parentNode.insertBefore(upgradeBtn, collectBtn.nextSibling);

// Сохраняем данные
function saveData() {
    localStorage.setItem('miningData', JSON.stringify(miningData));
}

// Инициализация
calculateOfflineMining();
setInterval(() => {
    calculateOfflineMining();
    saveData();
}, 5000); // обновление каждые 5 секунд
