// js/clicker.js
(function () {
  const screen = () => document.getElementById("screen");

  function getTGUser() {
    const tg = window.Telegram?.WebApp;
    const u = tg?.initDataUnsafe?.user;
    return {
      tg,
      id: u?.id ? String(u.id) : "guest",
      name: u?.first_name || "Игрок",
    };
  }

  const TG = getTGUser();
  const STORAGE_KEY = `zoo_state_${TG.id}`;

  let state = load() || {
    userId: TG.id,
    name: TG.name,
    balance: 0,
    energy: 1000,
    energyMax: 1000,
    mood: "happy", // happy|tired|angry
    equipped: { hat: false, glasses: false },
  };

  // expose helpers for other tabs (NFT)
  window.__ZOO_STATE__ = {
    get: () => state,
    set: (patch) => {
      state = { ...state, ...patch };
      save();
      renderIfOnClick();
    },
    toggleEquip: (key) => {
      state.equipped[key] = !state.equipped[key];
      save();
      renderIfOnClick();
    },
  };

  function load() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEY) || "");
    } catch {
      return null;
    }
  }
  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {}
  }

  function hapticLight() {
    if (TG.tg?.HapticFeedback?.impactOccurred) TG.tg.HapticFeedback.impactOccurred("light");
    else if (navigator.vibrate) navigator.vibrate(12);
  }

  function renderClick() {
    const root = screen();
    if (!root) return;

    root.innerHTML = `
      <div class="dog-wrap">
        <div class="card">
          <div class="top-row">
            <div class="badge">🐶 <span id="playerName"></span></div>
            <div class="pill">Кошелёк</div>
          </div>

          <div style="height:10px"></div>

          <div class="stats">
            <div>
              <span id="balanceBig">0</span>
              <small>$ZOO</small>
            </div>
            <div style="text-align:right">
              <span id="energyText">1000/1000</span>
              <small>ЭНЕРГИЯ</small>
            </div>
          </div>

          <div style="height:14px"></div>

          <div id="dogLayer" class="dog-layer idle mood-happy">
            <img id="dogBase" class="dog-base" src="assets/dog.png" alt="dog" />
            <img id="overlayHat" class="overlay overlay-hat hidden" src="assets/hat.png" alt="hat" />
            <img id="overlayGlasses" class="overlay overlay-glasses hidden" src="assets/glasses.png" alt="glasses" />
            <div id="floatLayer" class="float-layer"></div>
          </div>

          <div style="height:8px"></div>
          <div style="opacity:.85;font-weight:700;text-align:center">Тапай по собаке</div>

          <div style="height:10px"></div>
          <div style="display:flex;gap:10px;justify-content:center;opacity:.9;font-weight:700">
            <span id="moodLabel">🙂 happy</span>
          </div>
        </div>
      </div>
    `;

    // bind
    const dogLayer = document.getElementById("dogLayer");
    const floatLayer = document.getElementById("floatLayer");
    const overlayHat = document.getElementById("overlayHat");
    const overlayGlasses = document.getElementById("overlayGlasses");

    let tapTimer = null;

    function spawnPlus(clientX, clientY, amount) {
      const rect = dogLayer.getBoundingClientRect();
      const x = clientX - rect.left;
      const y = clientY - rect.top;

      const el = document.createElement("div");
      el.className = "float-plus";
      el.textContent = `+${amount} $ZOO`;
      el.style.left = `${x}px`;
      el.style.top = `${y}px`;
      floatLayer.appendChild(el);
      el.addEventListener("animationend", () => el.remove());
    }

    let tapsInWindow = 0;
    let windowTs = Date.now();

    function updateMoodAfterTap() {
      const now = Date.now();
      if (now - windowTs > 2000) {
        windowTs = now;
        tapsInWindow = 0;
      }
      tapsInWindow++;

      const energyPct = state.energy / state.energyMax;
      if (energyPct < 0.15) state.mood = "tired";
      else if (tapsInWindow >= 12) state.mood = "angry";
      else state.mood = "happy";
    }

    function applyMood() {
      dogLayer.classList.remove("mood-happy", "mood-tired", "mood-angry");
      dogLayer.classList.add(`mood-${state.mood}`);

      const moodLabel = document.getElementById("moodLabel");
      if (moodLabel) {
        const map = { happy: "🙂 happy", tired: "🥱 tired", angry: "😤 angry" };
        moodLabel.textContent = map[state.mood] || "🙂 happy";
      }
    }

    function applyEquipped() {
      overlayHat.classList.toggle("hidden", !state.equipped.hat);
      overlayGlasses.classList.toggle("hidden", !state.equipped.glasses);
    }

    function renderStats() {
      document.getElementById("playerName").textContent = state.name;
      document.getElementById("balanceBig").textContent = String(state.balance);
      document.getElementById("energyText").textContent = `${state.energy}/${state.energyMax}`;
      applyMood();
      applyEquipped();
    }

    function tapFX() {
      dogLayer.classList.add("tap");
      clearTimeout(tapTimer);
      tapTimer = setTimeout(() => dogLayer.classList.remove("tap"), 160);
    }

    function tapGain() {
      return 1;
    }

    dogLayer.addEventListener("click", (e) => {
      if (state.energy <= 0) {
        state.mood = "tired";
        save();
        renderStats();
        return;
      }

      state.energy = Math.max(0, state.energy - 1);
      const gain = tapGain();
      state.balance += gain;

      spawnPlus(e.clientX, e.clientY, gain);
      tapFX();
      hapticLight();

      updateMoodAfterTap();
      save();
      renderStats();
    });

    renderStats();
  }

  function renderIfOnClick() {
    // если сейчас открыт экран "Клик" — просто перерендерим
    // (мы не знаем твою логику tab'ов, поэтому делаем мягко)
    const el = document.getElementById("dogLayer");
    if (el) {
      // обновим только overlays + mood + stats
      const overlayHat = document.getElementById("overlayHat");
      const overlayGlasses = document.getElementById("overlayGlasses");
      const dogLayer = document.getElementById("dogLayer");

      if (overlayHat) overlayHat.classList.toggle("hidden", !state.equipped.hat);
      if (overlayGlasses) overlayGlasses.classList.toggle("hidden", !state.equipped.glasses);

      if (dogLayer) {
        dogLayer.classList.remove("mood-happy", "mood-tired", "mood-angry");
        dogLayer.classList.add(`mood-${state.mood}`);
      }

      const moodLabel = document.getElementById("moodLabel");
      if (moodLabel) {
        const map = { happy: "🙂 happy", tired: "🥱 tired", angry: "😤 angry" };
        moodLabel.textContent = map[state.mood] || "🙂 happy";
      }

      const balanceBig = document.getElementById("balanceBig");
      const energyText = document.getElementById("energyText");
      const playerName = document.getElementById("playerName");

      if (balanceBig) balanceBig.textContent = String(state.balance);
      if (energyText) energyText.textContent = `${state.energy}/${state.energyMax}`;
      if (playerName) playerName.textContent = state.name;
    }
  }

  // ===== ВАЖНО: как этот экран подключить к твоим табам =====
  // ui.js обычно рисует экран по табу. Мы дадим функцию, которую ui.js вызовет.
  window.renderClickScreen = renderClick;
})();