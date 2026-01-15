// ============================================
// ZOOTOPIA CLICKER — FINAL (HTML COMPATIBLE)
// ============================================

const Game = {
  state: {
    energy: 1000,
    maxEnergy: 1000,

    totalClicks: 0,
    balance: 0,
    tokens: 0,

    baseClickPower: 1,
    clickMultiplier: 1,

    autoClickers: 0,
    regenerationRate: 10,

    progress: 0,
    requiredTokens: 1_000_000,

    upgrades: {
      power:   { level: 0, base: 1000, cost: 1000, mult: 1.5 },
      battery: { level: 0, base: 5000, cost: 5000, mult: 1.5 },
      auto:    { level: 0, base: 10000, cost: 10000, mult: 1.8 },
      speed:   { level: 0, base: 25000, cost: 25000, mult: 1.6 }
    },

    level: 1,
    exp: 0,

    boostActive: false,
    boostEnd: 0
  },

  get clickPower() {
    return this.state.baseClickPower * this.state.clickMultiplier;
  },

  // ================= INIT =================
  init() {
    this.cacheDOM();
    this.load();
    this.bindEvents();
    this.startLoops();
    this.initTelegram();
    this.updateUI();
    this.notify("Добро пожаловать в Zootopia Clicker!", "success");
  },

  cacheDOM() {
    this.el = {
      clickBtn: document.getElementById("click-button"),
      energyBar: document.getElementById("energy-bar"),
      energyText: document.getElementById("energy-display"),
      regenRate: document.getElementById("regen-rate"),
      regenTime: document.getElementById("regen-time"),

      totalClicks: document.getElementById("total-clicks"),
      clickPower: document.getElementById("click-power"),
      clickPowerDisplay: document.getElementById("click-power-display"),
      cps: document.getElementById("clicks-per-second"),
      autoClickers: document.getElementById("auto-clickers"),

      balance: document.getElementById("balance"),
      tokens: document.getElementById("tokens"),

      level: document.getElementById("player-level"),

      progress: document.getElementById("progress-fill"),
      progressText: document.getElementById("progress-percent"),
      required: document.getElementById("required-tokens"),

      powerLevel: document.getElementById("power-level"),
      powerCost: document.getElementById("power-cost"),
      batteryLevel: document.getElementById("battery-level"),
      batteryCost: document.getElementById("battery-cost"),
      autoLevel: document.getElementById("auto-level"),
      autoCost: document.getElementById("auto-cost"),
      speedLevel: document.getElementById("speed-level"),
      speedCost: document.getElementById("speed-cost"),

      boostBtn: document.getElementById("boost-button"),
      boostConfirm: document.getElementById("activate-boost"),

      walletBtn: document.getElementById("connect-wallet"),
      walletModal: document.getElementById("wallet-modal"),
      boostModal: document.getElementById("boost-modal"),

      notify: document.getElementById("notification-container")
    };
  },

  bindEvents() {
    this.el.clickBtn.onclick = e => this.handleClick(e);

    document.querySelectorAll(".buy-button").forEach(btn =>
      btn.onclick = () => this.buyUpgrade(btn.dataset.upgrade)
    );

    this.el.boostBtn.onclick = () => this.openModal(this.el.boostModal);
    this.el.boostConfirm.onclick = () => this.activateBoost();

    this.el.walletBtn.onclick = () => this.openModal(this.el.walletModal);

    document.querySelectorAll(".modal-close").forEach(b =>
      b.onclick = () => this.closeModals()
    );

    document.querySelectorAll(".modal").forEach(m =>
      m.onclick = e => e.target === m && this.closeModals()
    );

    window.addEventListener("beforeunload", () => this.save());
  },

  // ================= GAMEPLAY =================
  handleClick(e) {
    if (this.state.energy < this.clickPower) return;

    this.state.energy -= this.clickPower;
    this.state.totalClicks += this.clickPower;
    this.state.balance += this.clickPower;
    this.state.tokens += this.clickPower * 0.001;

    this.state.progress = Math.min(
      100,
      this.state.progress + this.clickPower * 0.0001
    );

    this.gainExp(this.clickPower);
    this.updateUI();
  },

  gainExp(amount) {
    this.state.exp += amount;
    const need = this.state.level * 1000;
    if (this.state.exp >= need) {
      this.state.exp -= need;
      this.state.level++;
      this.notify(`Новый уровень: ${this.state.level}`, "success");
    }
  },

  // ================= UPGRADES =================
  buyUpgrade(type) {
    const u = this.state.upgrades[type];
    if (this.state.balance < u.cost) return;

    this.state.balance -= u.cost;
    u.level++;

    if (type === "power") this.state.baseClickPower++;
    if (type === "battery") this.state.maxEnergy += 100;
    if (type === "auto") this.state.autoClickers++;
    if (type === "speed") this.state.regenerationRate += 2;

    u.cost = Math.floor(u.base * Math.pow(u.mult, u.level));
    this.updateUI();
  },

  // ================= BOOST =================
  activateBoost() {
    if (this.state.boostActive || this.state.tokens < 500) return;

    this.state.tokens -= 500;
    this.state.boostActive = true;
    this.state.clickMultiplier = 2;
    this.state.boostEnd = Date.now() + 3600000;

    this.closeModals();
    this.notify("Буст x2 активирован!", "success");
  },

  // ================= LOOPS =================
  startLoops() {
    // regen
    setInterval(() => {
      this.state.energy = Math.min(
        this.state.maxEnergy,
        this.state.energy + this.state.regenerationRate
      );
      this.updateUI();
    }, 1000);

    // auto click
    setInterval(() => {
      const max = Math.floor(this.state.energy / this.clickPower);
      const clicks = Math.min(this.state.autoClickers, max);
      if (clicks <= 0) return;

      this.state.energy -= clicks * this.clickPower;
      this.state.totalClicks += clicks;
      this.state.balance += clicks;
      this.state.tokens += clicks * 0.0005;
      this.state.progress = Math.min(
        100,
        this.state.progress + clicks * 0.00005
      );

      this.gainExp(clicks);
      this.updateUI();
    }, 1000);

    // boost end
    setInterval(() => {
      if (this.state.boostActive && Date.now() >= this.state.boostEnd) {
        this.state.boostActive = false;
        this.state.clickMultiplier = 1;
        this.notify("Буст закончился", "info");
      }
    }, 1000);
  },

  // ================= UI =================
  updateUI() {
    this.el.energyBar.style.width =
      (this.state.energy / this.state.maxEnergy) * 100 + "%";
    this.el.energyText.textContent =
      `${this.state.energy}/${this.state.maxEnergy}`;

    const need = this.state.maxEnergy - this.state.energy;
    const sec = Math.ceil(need / this.state.regenerationRate);
    this.el.regenTime.textContent =
      `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, "0")}`;

    this.el.regenRate.textContent = this.state.regenerationRate;

    this.el.totalClicks.textContent = this.format(this.state.totalClicks);
    this.el.clickPower.textContent = this.clickPower;
    this.el.clickPowerDisplay.textContent = this.clickPower;
    this.el.cps.textContent = this.state.autoClickers;
    this.el.autoClickers.textContent = this.state.autoClickers;

    this.el.balance.textContent = this.format(this.state.balance);
    this.el.tokens.textContent = this.state.tokens.toFixed(4);
    this.el.level.textContent = this.state.level;

    this.el.progress.style.width = this.state.progress + "%";
    this.el.progressText.textContent = this.state.progress.toFixed(1) + "%";
    this.el.required.textContent = this.format(this.state.requiredTokens);

    this.el.powerLevel.textContent = this.state.upgrades.power.level;
    this.el.powerCost.textContent = this.format(this.state.upgrades.power.cost);
    this.el.batteryLevel.textContent = this.state.upgrades.battery.level;
    this.el.batteryCost.textContent = this.format(this.state.upgrades.battery.cost);
    this.el.autoLevel.textContent = this.state.upgrades.auto.level;
    this.el.autoCost.textContent = this.format(this.state.upgrades.auto.cost);
    this.el.speedLevel.textContent = this.state.upgrades.speed.level;
    this.el.speedCost.textContent = this.format(this.state.upgrades.speed.cost);
  },

  // ================= MODALS =================
  openModal(m) {
    m.style.display = "flex";
    document.body.style.overflow = "hidden";
  },

  closeModals() {
    document.querySelectorAll(".modal").forEach(m => m.style.display = "none");
    document.body.style.overflow = "auto";
  },

  // ================= UTIL =================
  notify(text, type = "info") {
    const n = document.createElement("div");
    n.className = `notification ${type}`;
    n.textContent = text;
    this.el.notify.appendChild(n);
    setTimeout(() => n.remove(), 3000);
  },

  format(n) {
    if (n >= 1e6) return (n / 1e6).toFixed(1) + "M";
    if (n >= 1e3) return (n / 1e3).toFixed(1) + "K";
    return Math.floor(n);
  },

  save() {
    localStorage.setItem("zootopia_save", JSON.stringify(this.state));
  },

  load() {
    const s = localStorage.getItem("zootopia_save");
    if (s) Object.assign(this.state, JSON.parse(s));
  },

  initTelegram() {
    if (window.Telegram?.WebApp) Telegram.WebApp.expand();
  }
};

document.addEventListener("DOMContentLoaded", () => Game.init());
