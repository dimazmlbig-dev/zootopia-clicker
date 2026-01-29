import { persistState } from "./state.js";
import { setText } from "./ui.js";

export function initTasks(state, aiTriggers) {
  updateRefUI(state);
  updateAiLastEvent(state);

  document.getElementById("shareRefBtn")?.addEventListener("click", () => {
    const tg = window.Telegram?.WebApp;
    const uid = tg?.initDataUnsafe?.user?.id;

    if (!uid) {
      alert("Открой бота внутри Telegram, чтобы получить ссылку.");
      return;
    }

    const link = `https://t.me/ZootopAI_clicker_bot?start=ref_${uid}`;
    tg.openTelegramLink(link);
  });

  document.getElementById("claimRefBtn")?.addEventListener("click", () => {
    if (state.refClaimed) {
      alert("Награда уже получена.");
      return;
    }
    if (state.refProgress < 5) {
      alert("Нужно 5/5 рефералов.");
      return;
    }

    state.refClaimed = true;
    state.zoo += 5000;

    persistState(state);
    updateRefUI(state);

    alert("Награда получена: +5000 $ZOO");
  });

  document.getElementById("aiTestBtn")?.addEventListener("click", () => {
    aiTriggers?.forceAi?.("manual");
  });
}

export function updateRefUI(state) {
  setText("refProgress", `Твой прогресс: ${state.refProgress}/5`);

  const claimBtn = document.getElementById("claimRefBtn");
  if (claimBtn) {
    claimBtn.disabled = state.refClaimed || state.refProgress < 5;
    claimBtn.textContent = state.refClaimed ? "Награда получена" : "Забрать награду";
  }
}

export function updateAiLastEvent(state) {
  const last = state.dog?.history?.[0];
  setText("aiLastEvent", `Последнее: ${last?.event || "—"}`);
}