/*************************************************
 * STATE (async, CloudStorage-ready)
 *************************************************/
const State = (() => {
  let _state = null;

  async function init() {
    if (_state) return _state;
    _state = await StorageManager.loadStateAsync();
    return _state;
  }

  function get() {
    if (!_state)
      throw new Error("State not initialized. Call await State.init()");
    return _state;
  }

  function set(next) {
    _state = next;
    return _state;
  }

  async function save() {
    if (!_state) return;
    await StorageManager.saveStateAsync(_state);
  }

  return { init, get, set, save };
})();

window.State = State;

/*************************************************
 * TELEGRAM WRAPPER
 *************************************************/
const tg = window.Telegram?.WebApp || null;

function initTelegram() {
  if (!tg) {
    console.log("Открыто вне Telegram");
    return;
  }

  tg.ready();
  tg.expand?.();
  tg.disableVerticalSwipes?.();

  const user = tg.initDataUnsafe?.user;
  if (user) {
    const nameEl = document.getElementById("user-name");
    if (nameEl) nameEl.innerText = user.first_name || "Игрок";

    const s = State.get();
    if (!s.refCode && user.id) {
      s.refCode = String(user.id);
      State.set(s);
      State.save();
    }
  }
}

/*************************************************
 * UI
 *************************************************/
const UI = {
  updateBalance() {
    const s = State.get();
    document.getElementById("bones-count").innerText = s.bones | 0;
    document.getElementById("zoo-count").innerText = s.zoo | 0;
  },

  updateEnergy() {
    const s = State.get();
    const percent = Math.max(
      0,
      Math.min(100, (s.energy / s.maxEnergy) * 100)
    );

    document.getElementById("energy-bar").style.width = percent + "%";
    document.getElementById(
      "current-energy"
    ).innerText = `${Math.floor(s.energy)} / ${s.maxEnergy}`;
  },

  updateReferral() {
    const s = State.get();
    const codeEl = document.getElementById("ref-code-display");
    if (codeEl && s.refCode) codeEl.innerText = s.refCode;

    const btn = document.getElementById("share-ref-btn");
    if (btn)
      btn.innerText = `Поделиться (${s.referrals || 0}/5)`;
  },
};

window.UI = UI;

/*************************************************
 * ENERGY
 *************************************************/
const Energy = {
  regenPerSec: 1,

  start() {
    setInterval(() => {
      const s = State.get();
      if (s.energy < s.maxEnergy) {
        s.energy = Math.min(
          s.maxEnergy,
          s.energy + this.regenPerSec
        );
        State.save();
        UI.updateEnergy();
      }
    }, 1000);
  },
};

window.Energy = Energy;

/*************************************************
 * CLICKER
 *************************************************/
const Clicker = {
  tapCost: 1,
  reward: 1,

  tap() {
    const s = State.get();
    if (s.energy < this.tapCost) return;

    s.energy -= this.tapCost;
    s.bones += this.reward;

    State.save();
    UI.updateBalance();
    UI.updateEnergy();

    this.animate();
  },

  animate() {
    const img = document.getElementById("dog-img");
    if (!img) return;

    img.classList.add("tap");
    setTimeout(() => img.classList.remove("tap"), 150);
  },
};

window.Clicker = Clicker;

/*************************************************
 * MINING
 *************************************************/
const Mining = {
  ratePerSec(level) {
    return level;
  },

  collect() {
    const s = State.get();
    const now = Date.now();
    const delta = Math.floor(
      (now - s.mining.lastCollect) / 1000
    );
    if (delta <= 0) return;

    const earned =
      delta * this.ratePerSec(s.mining.level);

    s.zoo += earned;
    s.mining.lastCollect = now;

    State.save();
    UI.updateBalance();
  },
};

window.Mining = Mining;

/*************************************************
 * REFERRALS
 *************************************************/
const ReferralManager = {
  shareReferral() {
    const s = State.get();
    if (!s.refCode) return;

    const link = `https://t.me/zooclikbot?start=ref_${s.refCode}`;

    if (tg?.openTelegramLink) {
      const url =
        `https://t.me/share/url?url=${encodeURIComponent(
          link
        )}&text=${encodeURIComponent(
          "Залетай в Zootopia Clicker 🐶"
        )}`;
      tg.openTelegramLink(url);
    } else {
      navigator.clipboard?.writeText(link);
      alert("Ссылка скопирована:\n" + link);
    }
  },

  claimReferralBonus() {
    // backend later
  },
};

window.ReferralManager = ReferralManager;

/*************************************************
 * UI BINDINGS
 *************************************************/
function bindUI() {
  document
    .getElementById("tap-zone")
    ?.addEventListener("click", () => Clicker.tap());

  document
    .getElementById("share-ref-btn")
    ?.addEventListener("click", () =>
      ReferralManager.shareReferral()
    );

  document
    .getElementById("collect-btn")
    ?.addEventListener("click", () =>
      Mining.collect()
    );

  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tab = btn.dataset.tab;

      document
        .querySelectorAll(".tab")
        .forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      document
        .querySelectorAll(".tab-content")
        .forEach((c) => {
          c.classList.remove("active");
          c.classList.add("hidden");
        });

      const target = document.getElementById(
        `tab-${tab}`
      );
      if (target) {
        target.classList.add("active");
        target.classList.remove("hidden");
      }
    });
  });
}

/*************************************************
 * AUTOSAVE
 *************************************************/
function startAutosave() {
  setInterval(() => {
    State.save().catch((e) =>
      console.warn("Autosave error:", e)
    );
  }, 3000);
}

/*************************************************
 * START GAME
 *************************************************/
function showGame() {
  document.getElementById("splash-screen").style.display =
    "none";
  document
    .getElementById("main-content")
    .classList.remove("hidden");
}

async function startGame() {
  await State.init();

  initTelegram();
  bindUI();

  ReferralManager.claimReferralBonus();
  Energy.start();
  startAutosave();

  UI.updateBalance();
  UI.updateEnergy();
  UI.updateReferral();

  showGame();
}

window.addEventListener("load", () => {
  startGame().catch((e) =>
    console.error("startGame error:", e)
  );
});
