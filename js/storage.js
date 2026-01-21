// --- Модуль сохранения и загрузки прогресса ---

const StorageManager = {
    
    STORAGE_KEY: 'zootopia_game_state',

    // Сохраняет текущее состояние игры в localStorage
    saveState: function(stateToSave) {
        try {
            const jsonState = JSON.stringify(stateToSave);
            localStorage.setItem(this.STORAGE_KEY, jsonState);
            // console.log("Игра сохранена!");
        } catch (e) {
            console.error("Ошибка при сохранении игры:", e);
        }
    },

    // Загружает состояние игры из localStorage
    loadState: function() {
        try {
            const jsonState = localStorage.getItem(this.STORAGE_KEY);
            if (jsonState) {
                // console.log("Прогресс загружен!");
                return JSON.parse(jsonState);
            }
            return null; // Если сохранений нет
        } catch (e) {
            console.error("Ошибка при загрузке сохранения:", e);
            return null;
        }
    },
    
    // Сброс прогресса (для отладки)
    resetState: function() {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log("Прогресс сброшен!");
        window.location.reload(); // Перезагружаем страницу, чтобы начать с нуля
    }
};
