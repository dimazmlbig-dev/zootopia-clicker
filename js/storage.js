const StorageManager = {
  STORAGE_KEY: 'zoo_clicker_state',

  saveState(state) {
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(state));
  },

  loadState() {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : null;
  }
};

window.StorageManager = StorageManager;
