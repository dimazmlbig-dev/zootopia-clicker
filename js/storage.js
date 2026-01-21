const StorageManager = {
  STORAGE_KEY: 'zootopia_clicker_state_v1',

  saveState(stateToSave) {
    try {
      let sum = 0;
      for (let key in stateToSave) {
        if (typeof stateToSave[key] === 'number') {
          sum += stateToSave[key];
        }
      }
      const stateWithCheck = { ...stateToSave, _checksum: sum };
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateWithCheck));
    } catch (e) {
      console.error('Ошибка сохранения', e);
    }
  },

  loadState() {
    try {
      const json = localStorage.getItem(this.STORAGE_KEY);
      if (!json) return null;

      const saved = JSON.parse(json);
      let sum = 0;
      for (let key in saved) {
        if (key !== '_checksum' && typeof saved[key] === 'number') {
          sum += saved[key];
        }
      }

      if (saved._checksum !== sum) {
        console.warn('Данные изменены! Сброс.');
        this.resetState();
        return null;
      }

      delete saved._checksum;
      return saved;
    } catch (e) {
      console.error('Ошибка загрузки', e);
      return null;
    }
  },

  resetState() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
};

window.StorageManager = StorageManager;
