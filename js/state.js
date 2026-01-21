const State = {
  data: StorageManager.loadState(),

  get() {
    return this.data;
  },

  addBones(amount) {
    if (!Number.isFinite(amount)) return;
    this.data.bones += amount;
  },

  incrementTaps() {
    this.data.totalTaps = (this.data.totalTaps || 0) + 1;
  }
};

window.State = State;
