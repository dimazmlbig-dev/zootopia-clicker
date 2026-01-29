import { loadUserState, saveUserState } from "./storage.js";

function defaultDog() {
  return {
    mood: "happy",
    trait: "loyal",
    trust: 50,
    lastAiAt: 0,
    cooldownUntil: 0,
    effects: { tapMultiplier: 1, regenMultiplier: 1 },
    history: []
  };
}

export function initStateFromTelegram() {
  const tg = window.Telegram?.WebApp;
  const user = tg?.initDataUnsafe?.user || null;

  const userId = String(user?.id || "guest");
  const firstName = user?.first_name || "Игрок";

  const stored = loadUserState(userId);

  const state = stored || {
    userId,
    username: firstName,
    zoo: 0,
    energy: 1000,
    energyMax: 1000,

    // MVP: локальный прогресс, позже заменишь на backend
    refProgress: 0,
    refClaimed: false,

    // метрики поведения
    tapsToday: 0,
    tapsWindow: { t: Date.now(), n: 0 }, // для burst

    // AI dog
    dog: defaultDog(),
  };

  // имя всегда из Telegram (не залипаем “Дмитрий”)
  state.userId = userId;
  state.username = firstName;

  // гарантируем dog
  if (!state.dog) state.dog = defaultDog();
  if (!state.dog.effects) state.dog.effects = { tapMultiplier: 1, regenMultiplier: 1 };
  if (!Array.isArray(state.dog.history)) state.dog.history = [];

  saveUserState(userId, state);
  return state;
}

export function persistState(state) {
  saveUserState(state.userId, state);
}