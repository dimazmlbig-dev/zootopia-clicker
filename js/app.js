import { initStateFromTelegram, persistState } from "./state.js";
import { showPage, setText } from "./ui.js";
import { initClicker } from "./clicker.js";
import { initTasks, updateAiLastEvent } from "./tasks.js";
import { initWallet } from "./wallet.js";
import { initDogAI } from "./ai.js";

const WORKER_BASE_URL = "https://zootopia-backend.dimazmlbig.workers.dev";

const state = initStateFromTelegram();

bootTelegram();
bootNav();

const uiDogRefresh = (s) => {
  // верхняя строка
  const mood = s.dog?.mood || "happy";
  const trait = s.dog?.trait || "loyal";
  const trust = s.dog?.trust ?? 50;

  setText("dogMoodTag", `🙂 ${mood}`);
  setText("dogTraitTag", `🧠 ${trait}`);
  setText("dogTrustTag", `🤝 ${trust}`);

  const now = Date.now();
  if (s.dog?.cooldownUntil && now < s.dog.cooldownUntil) {
    const sec = Math.ceil((s.dog.cooldownUntil - now) / 1000);
    setText("subtitle", `Собака отдыхает… ${sec}s`);
  } else {
    setText("subtitle", `Настроение: ${mood} • Множитель: x${(s.dog?.effects?.tapMultiplier ?? 1).toFixed(2)}`);
  }
};

// AI triggers
const aiTriggers = initDogAI(
  state,
  WORKER_BASE_URL,
  uiDogRefresh,
  () => updateAiLastEvent(state)
);

initClicker(state, aiTriggers, uiDogRefresh);
initTasks(state, aiTriggers);
initWallet(WORKER_BASE_URL);

// первичный рендер
setText("username", state.username);
setText("balance", state.zoo);
setText("zooSub", state.zoo);
uiDogRefresh(state);
updateAiLastEvent(state);

persistState(state);

function bootTelegram() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;
  tg.ready();
  tg.expand();
}

function bootNav() {
  document.querySelectorAll(".navbtn").forEach((btn) => {
    btn.addEventListener("click", () => showPage(btn.dataset.page));
  });

  document.getElementById("openWalletBtn")?.addEventListener("click", () => {
    showPage("wallet");
  });
}