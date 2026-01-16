// --- Конфигурация майнинга ---
const MINING_LEVELS = [
    { level: 1, cost: 500, rate: 10, storage: 100 },
    { level: 2, cost: 1500, rate: 25, storage: 250 },
    { level: 3, cost: 5000, rate: 70, storage: 800 },
    { level: 4, cost: 12000, rate: 150, storage: 2000 },
];

// --- Логика майнинга ---
const MiningManager = {
    
    // Рассчитывает, сколько накопилось за время отсутствия
    calculateOfflineProduction: function() {
        const now = new Date().getTime();
        const elapsedSeconds = (now - state.mining.lastUpdate) / 1000;
        
        const currentLevelData = MINING_LEVELS[state.mining.level - 1];
        const ratePerSecond = currentLevelData.rate / 3600;
        const produced = elapsedSeconds * ratePerSecond;
        
        state.mining.availableToCollect = Math.min(
            state.mining.availableToCollect + produced,
            currentLevelData.storage
        );
        
        state.mining.lastUpdate = now;
    },

    // Собрать накопленное
    collect: function() {
        const collectedAmount = Math.floor(state.mining.availableToCollect);
        if (collectedAmount <= 0) return;

        state.bones += collectedAmount;
        state.mining.availableToCollect -= collectedAmount;

        updateUI();
        this.updateMiningUI();
        
        if (window.Telegram.WebApp.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.notificationOccurred('success');
        }
    },

    // Улучшить шахту
    upgrade: function() {
        const nextLevel = state.mining.level + 1;
        if (nextLevel > MINING_LEVELS.length) {
            alert("Максимальный уровень!");
            return;
        }

        const upgradeData = MINING_LEVELS[nextLevel - 1];
        if (state.bones >= upgradeData.cost) {
            state.bones -= upgradeData.cost;
            state.mining.level = nextLevel;
            
            this.updateMiningUI();
            updateUI();
            alert("Шахта улучшена!");
        } else {
            alert("Недостаточно костей для улучшения!");
        }
    },
    
    // Обновление UI майнинга
    updateMiningUI: function() {
        this.calculateOfflineProduction();

        const levelData = MINING_LEVELS[state.mining.level - 1];
        const nextLevelData = MINING_LEVELS[state.mining.level] || null;

        document.getElementById('mining-level').innerText = levelData.level;
        document.getElementById('mining-rate').innerText = levelData.rate;
        document.getElementById('mining-storage-fill').style.width = `${(state.mining.availableToCollect / levelData.storage) * 100}%`;
        document.getElementById('mining-storage-value').innerText = `${Math.floor(state.mining.availableToCollect)} / ${levelData.storage}`;

        if (nextLevelData) {
            document.getElementById('upgrade-cost').innerText = nextLevelData.cost;
            document.getElementById('btn-upgrade-mine').disabled = false;
        } else {
            document.getElementById('upgrade-cost').innerText = 'МАКС';
            document.getElementById('btn-upgrade-mine').disabled = true;
        }
    }
};
