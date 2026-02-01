const tg = window.Telegram?.WebApp || null;

function getTelegramUser() {
  const u = tg?.initDataUnsafe?.user;
  if (u?.id) return u;
  return null;
}

// уникальный userId: Telegram user.id, иначе fallback
function getUserId() {
  const u = getTelegramUser();
  if (u?.id) return String(u.id);

  // fallback outside Telegram
  let id = localStorage.getItem("zoo_uid");
  if (!id) {
    id = String(Math.floor(Math.random() * 1e12));
    localStorage.setItem("zoo_uid", id);
  }
  return id;
}

function getUserName() {
  const u = getTelegramUser();
  if (u) {
    const name = [u.first_name, u.last_name].filter(Boolean).join(" ").trim();
    return name || `User ${u.id}`;
  }
  return "Игрок";
}

// хаптик/вибрация: Telegram HapticFeedback -> иначе navigator.vibrate
function hapticLight() {
  try {
    if (tg?.HapticFeedback) tg.HapticFeedback.impactOccurred("light");
    else if (navigator.vibrate) navigator.vibrate(20);
  } catch {}
}

// легкая “визуальная вибрация” (wiggle) через класс .tap
function dogTapAnim(dogEl) {
  dogEl.classList.remove("tap");
  // reflow
  void dogEl.offsetWidth;
  dogEl.classList.add("tap");
  setTimeout(() => dogEl.classList.remove("tap"), 220);
}

function clamp(n, a, b) {
  return Math.max(a, Math.min(b, n));
}

// простое сохранение
const SAVE_KEY = "zoo_save_v1";
function loadSave(userId) {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return null;
    const s = JSON.parse(raw);
    if (!s || s.userId !== userId) return null;
    return s;
  } catch { return null; }
}
function saveSave(s) {
  localStorage.setItem(SAVE_KEY, JSON.stringify(s));
}

function defaultSave(userId) {
  return {
    userId,
    zoo: 0,
    energy: 1000,
    energyMax: 1000,
    equipped: { glasses: "", hat: "", collar: "" }
  };
}

(function init() {
  if (tg) {
    tg.ready();
    tg.expand?.();
    tg.disableVerticalSwipes?.();
  }

  const userId = getUserId();
  const userName = getUserName();

  // UI refs
  const elUserName = document.getElementById("userName");
  const elUserIdText = document.getElementById("userIdText");
  const elZooBalance = document.getElementById("zooBalance");

  const elEnergyNow = document.getElementById("energyNow");
  const elEnergyMax = document.getElementById("energyMax");
  const elEnergyFill = document.getElementById("energyFill");

  const dog = document.getElementById("dogBase");
  const tapHint = document.getElementById("tapHint");

  // overlays (пока просто есть, потом подключим NFT)
  const dogGlasses = document.getElementById("dogGlasses");
  const dogHat = document.getElementById("dogHat");
  const dogCollar = document.getElementById("dogCollar");

  let state = loadSave(userId) || defaultSave(userId);
  state.userId = userId;

  // показать имя и ID
  elUserName.textContent = userName;
  elUserIdText.textContent = userId;

  function render() {
    elZooBalance.textContent = String(state.zoo);

    elEnergyNow.textContent = String(state.energy);
    elEnergyMax.textContent = String(state.energyMax);

    const pct = clamp((state.energy / state.energyMax) * 100, 0, 100);
    elEnergyFill.style.width = pct + "%";

    // overlays (если пусто — скрываем)
    setWear(dogGlasses, state.equipped.glasses);
    setWear(dogHat, state.equipped.hat);
    setWear(dogCollar, state.equipped.collar);
  }

  function setWear(imgEl, traitId) {
    if (!traitId || traitId === "hat_none") {
      imgEl.src = "";
      imgEl.style.display = "none";
      return;
    }
    imgEl.style.display = "block";
    imgEl.src = `/assets/wear/${traitId}.png`;
  }

  function doTap() {
    if (state.energy <= 0) {
      tapHint.textContent = "Собака устала 😴";
      hapticLight();
      return;
    }

    // тактильная + анимация
    hapticLight();
    dogTapAnim(dog);

    // экономика (пока простая)
    state.energy -= 1;
    state.zoo += 1;

    tapHint.textContent = "Тап! 🐾";
    saveSave(state);
    render();
  }

  // На Android Telegram click часто глючит -> pointerdown надежнее
  dog.addEventListener("pointerdown", (e) => {
    e.preventDefault();
    doTap();
  }, { passive: false });

  // реген энергии
  setInterval(() => {
    if (state.energy < state.energyMax) {
      state.energy += 1;
      saveSave(state);
      render();
    }
  }, 1200);

  // первичный рендер
  saveSave(state);
  render();
})();