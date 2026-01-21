const Clicker = {
  tapPower: 1,
  energyCost: 1,

  tap() {
    if (!Energy.spend(this.energyCost)) {
      tg?.HapticFeedback?.notificationOccurred('error');
      return;
    }

    State.addBones(this.tapPower);
    State.incrementTaps();

    TaskManager.checkProgress();
    UI.updateBalance();

    tg?.HapticFeedback?.impactOccurred('light');
  }
};

window.Clicker = Clicker;
