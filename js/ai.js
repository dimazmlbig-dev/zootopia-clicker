import { persistState } from "./state.js";

export function initDogAI(state, workerBaseUrl, uiDogRefresh, onAiApplied) {
  const tg = window.Telegram?.WebApp;
  const userId = String(tg?.initDataUnsafe?.user?.id || state.userId || "guest");

  async function callAI(reason = "timer") {
    const now = Date.now();

    // не спамим AI
    const minInterval = 90_000; // 90 секунд
    if (reason === "timer" && now - (state.dog?.lastAiAt || 0) < minInterval) return;

    const snapshot = buildSnapshot(state, reason);

    try {
      const r = await fetch(`${workerBaseUrl}/api/ai/dog`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ userId, snapshot }),
      });

      const data = await r.json().catch(() => null);
      if (!r.ok || !data?.ok || !data?.result) return;

      applyAiResult(state, data.result);
      state.dog.lastAiAt = now;

      persistState(state);
      uiDogRefresh?.(state);
      onAiApplied?.(state);

      // показать короткое сообщение
      if (data.result.message) {
        tg?.showPopup?.({
          title: "🐶",
          message: data.result.message,
          buttons: [{ id: "ok", type: "ok" }],
        });
      }
    } catch {}
  }

  // таймерный тик
  const t = setInterval(() => callAI("timer"), 15_000);

  return {
    stop: () => clearInterval(t),
    onEnergyZero: () => callAI("energy_zero"),
    onBigTapBurst: () => callAI("tap_burst"),
    onNftEquip: () => callAI("nft_equip"),
    forceAi: (reason = "manual") => callAI(reason),
  };
}

function buildSnapshot(state, reason) {
  return {
    reason,
    zoo: state.zoo,
    energy: state.energy,
    energyMax: state.energyMax,
    tapsToday: state.tapsToday || 0,
    burst10s: state.tapsWindow?.n || 0,
    lastAction: state.lastAction || "none",
    dog: {
      mood: state.dog?.mood || "happy",
      trait: state.dog?.trait || "loyal",
      trust: state.dog?.trust ?? 50,
      effects: state.dog?.effects || { tapMultiplier: 1, regenMultiplier: 1 },
    },
    lastEvents: (state.dog?.history || []).slice(0, 3),
  };
}

function applyAiResult(state, ai) {
  if (!state.dog) state.dog = {};
  if (!state.dog.effects) state.dog.effects = { tapMultiplier: 1, regenMultiplier: 1 };
  if (!Array.isArray(state.dog.history)) state.dog.history = [];

  state.dog.mood = ai.mood;
  state.dog.trait = ai.trait;

  const trust = Number(state.dog.trust ?? 50);
  const delta = Number(ai.trustDelta || 0);
  state.dog.trust = clamp(trust + delta, 0, 100);

  state.dog.effects.tapMultiplier = clampNum(ai?.effects?.tapMultiplier, 0.5, 2.0, 1);
  state.dog.effects.regenMultiplier = clampNum(ai?.effects?.regenMultiplier, 0.5, 2.0, 1);

  const now = Date.now();
  const cd = clampInt(ai.cooldownSec, 0, 30);
  state.dog.cooldownUntil = cd > 0 ? now + cd * 1000 : 0;

  state.dog.history.unshift({
    t: now,
    event: ai.event || "none",
    mood: state.dog.mood,
    msg: ai.message || "",
  });
  state.dog.history = state.dog.history.slice(0, 5);
}

function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }
function clampInt(v, a, b) {
  v = Math.floor(Number(v || 0));
  return clamp(v, a, b);
}
function clampNum(v, a, b, d) {
  v = Number(v);
  if (!Number.isFinite(v)) v = d;
  return clamp(v, a, b);
}