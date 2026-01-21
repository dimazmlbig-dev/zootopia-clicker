const UI = {
  updateEnergy() {
    const s = State.get();
    document.getElementById('current-energy')
      .innerText = `${Math.floor(s.energy)} / ${s.maxEnergy}`;

    document.getElementById('energy-bar')
      .style.width = (s.energy / s.maxEnergy * 100) + '%';
  },

  updateBalance() {
    const s = State.get();
    document.getElementById('bones-count')
      .innerText = Math.floor(s.bones);
  }
};

window.UI = UI;
