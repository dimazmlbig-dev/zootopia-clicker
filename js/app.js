// --- Telegram init ---
const tg = window.Telegram?.WebApp;
if (tg) {
  tg.ready();
  tg.expand();
  // По желанию: tg.disableVerticalSwipes();
}

// --- State ---
const state = {
  userId: null,
  userName: "Пользователь",
  taps: 0,
  zoo: 911,
  energy: 712,
  energyMax: 1000,
  mood: "happy",
  trait: "loyal",
  trust: 50,
};

// --- DOM ---
const dogEl = document.getElementById("dog");
const userNameEl = document.getElementById("userName");
const userIconEl = document.getElementById("userIcon");
const balanceNumEl = document.getElementById("balanceNum");
const balanceSubEl = document.getElementById("balanceSub");
const energyNowEl = document.getElementById("energyNow");
const energyMaxEl = document.getElementById("energyMax");
const energyFillEl = document.getElementById("energyFill");
const chipMoodEl = document.getElementById("chipMood");
const chipTraitEl = document.getElementById("chipTrait");
const chipTrustEl = document.getElementById("chipTrust");
const aiMsgEl = document.getElementById("aiMsg");

const sheet = document.getElementById("sheet");
const sheetTitle = document.getElementById("sheetTitle");
const sheetBody = document.getElementById("sheetBody");
const sheetClose = document.getElementById("sheetClose");

const walletBtn = document.getElementById("walletBtn");

// --- Helpers ---
function clamp(v, a, b){ return Math.max(a, Math.min(b, v)); }

function haptic(type = "light") {
  // Telegram haptics (лучше всего работает внутри Telegram)
  if (tg?.HapticFeedback) {
    // impact: light/medium/heavy/rigid/soft
    tg.HapticFeedback.impactOccurred(type);
    return;
  }
  // fallback Android вибрация (в браузере иногда блокируется)
  if (navigator.vibrate) navigator.vibrate(10);
}

function dogTapAnim() {
  dogEl.classList.remove("tap");
  // force reflow
  void dogEl.offsetWidth;
  dogEl.classList.add("tap");
  setTimeout(() => dogEl.classList.remove("tap"), 260);
}

function render(){
  userNameEl.textContent = state.userName;
  balanceNumEl.textContent = String(state.zoo);
  balanceSubEl.textContent = `$ZOO ${state.zoo}`;

  energyNowEl.textContent = String(state.energy);
  energyMaxEl.textContent = String(state.energyMax);

  const pct = (state.energy / state.energyMax) * 100;
  energyFillEl.style.width = `${clamp(pct, 0, 100)}%`;

  chipMoodEl.textContent = state.mood;
  chipTraitEl.textContent = state.trait;
  chipTrustEl.textContent = String(state.trust);
}

// --- Unique user from Telegram ---
function initUser(){
  const u = tg?.initDataUnsafe?.user;
  if (u) {
    state.userId = String(u.id);
    state.userName = [u.first_name, u.last_name].filter(Boolean).join(" ").trim() || `User ${u.id}`;
    // Иконку можно менять по полу/статусу; аватар напрямую Telegram WebApp не отдаёт URL
    userIconEl.textContent = "🐶";
  } else {
    // fallback: уникальность по localStorage (если открывают вне Telegram)
    let id = localStorage.getItem("zoo_uid");
    if (!id) {
      id = String(Math.floor(Math.random()*1e9));
      localStorage.setItem("zoo_uid", id);
    }
    state.userId = id;
    state.userName = localStorage.getItem("zoo_name") || `User ${id.slice(-4)}`;
  }
}

// --- Tap logic ---
function onDogTap(){
  if (state.energy <= 0) {
    aiMsgEl.textContent = "Собака устала 😴";
    haptic("soft");
    return;
  }

  haptic("light");
  dogTapAnim();

  state.taps += 1;
  state.zoo += 1;             // начисление за тап (поменяешь как надо)
  state.energy -= 1;

  // маленькая “эмоция”
  if (state.taps % 20 === 0) {
    state.mood = ["happy","playful","tired"][Math.floor(Math.random()*3)];
    aiMsgEl.textContent = state.mood === "tired" ? "Дай лапе отдохнуть 😅" : "Ещё! Ещё! 🐾";
  }

  render();
}

// --- Energy regen ---
setInterval(() => {
  if (state.energy < state.energyMax) {
    state.energy += 1;
    render();
  }
}, 1200);

// --- Bottom tabs ---
document.querySelectorAll(".nav-btn").forEach(btn => {
  btn.addEventListener("click", () => {
    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    btn.classList.add("active");

    const tab = btn.dataset.tab;
    openTab(tab);
  });
});

function openTab(tab){
  if (tab === "tap"){
    sheet.classList.add("hidden");
    return;
  }

  sheet.classList.remove("hidden");

  if (tab === "wallet"){
    sheetTitle.textContent = "Кошелёк";
    sheetBody.innerHTML = `
      <div class="task">
        <div class="task-title">TON / Balance</div>
        <div class="task-sub">Подключим TON-кошелёк и покажем баланс.</div>
      </div>
      <div class="task">
        <div class="task-title">Адрес</div>
        <div class="task-sub">Сюда позже выведем активный адрес TON Connect.</div>
      </div>
    `;
    return;
  }

  if (tab === "tasks"){
    sheetTitle.textContent = "Задания";
    // сюда перенесём рефералку (как ты хотел)
    sheetBody.innerHTML = `
      <div class="task">
        <div class="task-title">Пригласи друзей</div>
        <div class="task-sub">Прогресс: 0/5 • Награда: +500 $ZOO</div>
      </div>
      <div class="task">
        <div class="task-title">Подпишись на канал</div>
        <div class="task-sub">Награда: +200 $ZOO</div>
      </div>
    `;
    return;
  }

  if (tab === "nft"){
    sheetTitle.textContent = "NFT";
    sheetBody.innerHTML = `
      <div class="task">
        <div class="task-title">Коллекция скоро</div>
        <div class="task-sub">Тут будет минт/маркет/витрина.</div>
      </div>
    `;
    return;
  }
}

sheetClose.addEventListener("click", () => sheet.classList.add("hidden"));
walletBtn.addEventListener("click", () => openTab("wallet"));

// --- Bind dog tap ---
dogEl.addEventListener("click", onDogTap);
dogEl.addEventListener("touchstart", (e) => { e.preventDefault(); onDogTap(); }, { passive:false });

// --- Start ---
initUser();
render();