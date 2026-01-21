// js/storage.js
const tg = window.Telegram?.WebApp || null;

const StorageManager = {
  STORAGE_KEY: "zoo_clicker_state",
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
        lastCollect: Date.now(),
      },
      tasks: {},
      referrals: 0,
      refCode: null,
    };
  },

  isCloudAvailable() {
    return !!(
      tg &&
      tg.CloudStorage &&
      typeof tg.CloudStorage.getItem === "function"
    );
  },

  cloudGet(key) {
    return new Promise((resolve) => {
      tg.CloudStorage.getItem(key, (err, value) => {
        if (err) {
          console.warn("CloudStorage.getItem error:", err);
          resolve(null);
          return;
        }
        resolve(value ?? null);
      });
    });
  },

  cloudSet(key, value) {
    return new Promise((resolve) => {
      tg.CloudStorage.setItem(key, value, (err, ok) => {
        if (err) {
          console.warn("CloudStorage.setItem error:", err);
          resolve(false);
          return;
        }
        resolve(!!ok);
      });
    });
  },

  cloudRemove(key) {
    return new Promise((resolve) => {
      tg.CloudStorage.removeItem(key, (err, ok) => {
        if (err) {
          console.warn("CloudStorage.removeItem error:", err);
          resolve(false);
          return;
        }
        resolve(!!ok);
      });
    });
  },

  async migrateLocalToCloudIfNeeded() {
    if (!this.isCloudAvailable()) return;

    try {
      const legacy = localStorage.getItem(this.STORAGE_KEY);
      if (!legacy) return;

      const ok = await this.cloudSet(this.STORAGE_KEY, legacy);
      if (ok) {
        localStorage.removeItem(this.STORAGE_KEY);
        console.log("localStorage → CloudStorage миграция выполнена");
      }
    } catch (e) {
      console.warn("Migration error:", e);
    }
  },

  async loadStateAsync() {
    const def = this.defaultState();

    if (this.isCloudAvailable()) {
      await this.migrateLocalToCloudIfNeeded();

      const raw = await this.cloudGet(this.STORAGE_KEY);
      if (!raw) return def;

      try {
        const parsed = JSON.parse(raw);
        if (parsed.version !== this.VERSION) return def;
        return { ...def, ...parsed };
      } catch (e) {
        console.warn("Cloud save повреждён, сброс", e);
        return def;
      }
    }

    // fallback вне Telegram
    try {
      const data = localStorage.getItem(this.STORAGE_KEY);
      if (!data) return def;

      const parsed = JSON.parse(data);
      if (parsed.version !== this.VERSION) return def;

      return { ...def, ...parsed };
    } catch (e) {
      console.warn("Local save повреждён, сброс", e);
      return def;
    }
  },

  async saveStateAsync(state) {
    const payload = JSON.stringify(state);

    if (this.isCloudAvailable()) {
      await this.cloudSet(this.STORAGE_KEY, payload);
      return;
    }

    try {
      localStorage.setItem(this.STORAGE_KEY, payload);
    } catch (e) {
      console.error("Ошибка сохранения:", e);
    }
  },

  async resetAsync() {
    if (this.isCloudAvailable()) {
      await this.cloudRemove(this.STORAGE_KEY);
      return;
    }
    localStorage.removeItem(this.STORAGE_KEY);
  },
};

window.StorageManager = StorageManager;
