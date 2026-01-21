const StorageManager = {
  STORAGE_KEY: 'zoo_clicker_state',
  VERSION: 1,

  defaultState() {
    return {
      version: this.VERSION,
      bones: 0,
      zoo: 0,
      energy: 1000,
      maxEnergy: 1000,
      mining: {
        level: 1,
        stored: 0,
        lastCollect: Date.now()
      },
      tasks: {},
      referrals: 0
    };
  },

  saveState(state) {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
    } catch (e) {
      console.error('Ошибка сохранения:', e);
    }
  },

  loadState() {
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return this.defaultState();

      const parsed = JSON.parse(data);

      // если версия не совпадает — сбрасываем
      if (parsed.version !== this.VERSION) {
        return this.defaultState();
      }

      // мягкий merge (на будущее)
      return { ...this.defaultState(), ...parsed };

    } catch (e) {
      console.warn('Сейв повреждён, сброс', e);
      return this.defaultState();
    }
  },

  reset() {
    localStorage.removeItem(this.STORAGE_KEY);
  }
};

window.StorageManager = StorageManager;
