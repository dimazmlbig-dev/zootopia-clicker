const State = {
  data: StorageManager.loadState(),

  get() {
    return this.data;
  },

  addBones(amount) {
    if (!Number.isFinite(amount)) return;
    this.data.bones += amount;
    UI.updateBalance();
  },

  spendEnergy(amount) {
    if (this.data.energy < amount) return false;
    this.data.energy -= amount;
    UI.updateEnergy();
    return true;
  },

  save() {
    StorageManager.saveState(this.data);
  }
};

window.State = State;
