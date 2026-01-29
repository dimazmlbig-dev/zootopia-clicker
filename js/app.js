import { initStateFromTelegram, persistState } from "./state.js";
import { showPage, setText } from "./ui.js";
import { initClicker } from "./clicker.js";
import { initTasks } from "./tasks.js";

const state = initStateFromTelegram();

bootTelegram();
bootUI();
initClicker(state);
initTasks(state);

function bootTelegram() {
  const tg = window.Telegram?.WebApp;
  if (!tg) return;

  tg.ready();
  tg.expand();
}

function bootUI() {
  setText("username", state.username);
  setText("balance", state.zoo);
  setText("zooSub", state.zoo);

  // нижнее меню
  document.querySelectorAll(".navbtn").forEach((btn) => {
    btn.addEventListener("click", () => showPage(btn.dataset.page));
  });

  // кнопка сверху "Кошелёк"
  document.getElementById("openWalletBtn")?.addEventListener("click", () => {
    showPage("wallet");
  });

  // страховка: если вдруг state кривой — фиксируем и сохраняем
  persistState(state);
}