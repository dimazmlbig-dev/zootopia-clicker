const Energy = {
  regenRate: 1,
  regenInterval: 5000,

  canSpend(amount) {
    return State.get().energy >= amount;
  },

  spend(amount) {
    const s = State.get();
    if (s.energy < amount) return false;

    s.energy -= amount;
    UI.updateEnergy();
    return true;
  },

  regen() {
    const s = State.get();
    if (s.energy >= s.maxEnergy) return;

    s.energy = Math.min(
      s.energy + this.regenRate,
      s.maxEnergy
    );

    UI.updateEnergy();
  },

  start() {
    setInterval(() => this.regen(), this.regenInterval);
  }
};

window.Energy = Energy;
