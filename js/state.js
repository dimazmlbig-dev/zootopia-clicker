import { loadUserState, saveUserState } from "./storage.js";

export function initStateFromTelegram() {
  const tg = window.Telegram?.WebApp;

  // если не внутри Telegram — делаем гостя
  const user = tg?.initDataUnsafe?.user || null;

  const userId = String(user?.id || "guest");
  const firstName = user?.first_name || "Игрок";

  // загружаем персональный state
  const stored = loadUserState(userId);

  const state = stored || {
    userId,
    username: firstName,
    zoo: 0,
    energy: 1000,
    energyMax: 1000,
    refProgress: 0, // пока локально (позже заменим на backend)
    refClaimed: false,
  };

  // важно: имя всегда берём из Telegram (не из старого localStorage)
  state.userId = userId;
  state.username = firstName;

  // сразу сохраняем в персональное хранилище
  saveUserState(userId, state);

  return state;
}

export function persistState(state) {
  saveUserState(state.userId, state);
}