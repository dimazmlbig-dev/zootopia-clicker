// ============================================
// ZOOTOPIA CLICKER — FINAL GAME ENGINE
// ============================================

const Game = {
  state: {
    // core
    energy: 1000,
    maxEnergy: 1000,

    totalClicks: 0,
    balance: 0,
    tokens: 0,

    // click system
    baseClickPower: 1,
    clickMultiplier: 1,

    autoClickers: 0,
    regenerationRate: 10,

    // progress
    progress: 0,
    requiredTokens: 1_000_000,

    // upgrades
    upgrades: {
      power:   { level: 0, baseCost: 1000, cost: 1000, mult: 1.5 },
      battery: { level: 0, baseCost: 5000, cost: 5000, mult: 1.5 },
      auto:    { level: 0, baseCost: 10000, cost: 10000, mult: 1.8 },
      speed:   { level: 0, baseCost: 25000, cost: 25000, mult: 1.6 }
    },

    // player
    level: 1,
    exp: 0,

    // boost
    boostActive: false,
    boostEnd: 0,

    // wallet (mock)
    walletConnected: false,

    // meta
    lastSave: Date.now()
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
      click: document.getElementById("click-button"),
      energyBar: document.getElementById("energy-bar"),
      energyText: document.getElementById("energy-display"),
      balance: document.getElementById("balance"),
      tokens: document.getElementById("tokens"),
      power: document.getElementById("click-power"),
      total: document.getElementById("total-clicks"),
      level: document.getElementById("player-level"),
      progress: document.getElementById("progress-fill"),
      progressText: document.getElementById("progress-percent"),
      notify: document.getElementById("notification-container")
    };
  },

  bindEvents() {
    this.el.click.addEventListener("click", e => this.handleClick(e));

    document.querySelectorAll(".buy-button").forEach(btn =>
      btn.addEventListener("click", () =>
        this.buyUpgrade(btn.dataset.upgrade)
      )
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
      this.notify(`Уровень ${this.state.level}!`, "success");
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

    u.cost = Math.floor(u.baseCost * Math.pow(u.mult, u.level));
    this.updateUI();
  },

  // ================= BOOST =================
  activateBoost() {
    if (this.state.boostActive || this.state.tokens < 500) return;

    this.state.tokens -= 500;
    this.state.boostActive = true;
    this.state.clickMultiplier = 2;
    this.state.boostEnd = Date.now() + 3600000;

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

    // autoclick
    setInterval(() => {
      if (!this.state.autoClickers) return;

      const maxClicks = Math.floor(
        this.state.energy / this.clickPower
      );
      const clicks = Math.min(this.state.autoClickers, maxClicks);
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
      if (
        this.state.boostActive &&
        Date.now() >= this.state.boostEnd
      ) {
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

    this.el.balance.textContent = this.format(this.state.balance);
    this.el.tokens.textContent = this.state.tokens.toFixed(4);
    this.el.power.textContent = this.clickPower;
    this.el.total.textContent = this.format(this.state.totalClicks);
    this.el.level.textContent = this.state.level;

    this.el.progress.style.width = this.state.progress + "%";
    this.el.progressText.textContent =
      this.state.progress.toFixed(1) + "%";
  },

  notify(text, type = "info") {
    if (!this.el.notify) return;
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

  // ================= SAVE =================
  save() {
    localStorage.setItem(
      "zootopia_save",
      JSON.stringify({ state: this.state, t: Date.now() })
    );
  },

  load() {
    const s = localStorage.getItem("zootopia_save");
    if (!s) return;
    const data = JSON.parse(s);
    Object.assign(this.state, data.state);
  },

  // ================= TELEGRAM =================
  initTelegram() {
    if (!window.Telegram?.WebApp) return;
    Telegram.WebApp.expand();
  }
};

// START
document.addEventListener("DOMContentLoaded", () => Game.init());
