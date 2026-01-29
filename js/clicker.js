import { persistState } from "./state.js";
import { setText, setEnergy } from "./ui.js";

export function initClicker(state, aiTriggers, uiDogRefresh) {
  render(state, uiDogRefresh);

  const dog = document.getElementById("dogImg");
  if (!dog) return;

  // Telegram Android: pointerdown/touchstart надежнее, чем click
  const onTap = (e) => {
    e.preventDefault?.();

    const now = Date.now();

    // AI cooldown
    if (state.dog?.cooldownUntil && now < state.dog.cooldownUntil) return;

    if (state.energy <= 0) {
      aiTriggers?.onEnergyZero?.();
      return;
    }

    // burst tracking (10 секунд окно)
    const w = state.tapsWindow || { t: now, n: 0 };
    if (now - w.t > 10_000) {
      w.t = now; w.n = 0;
    }
    w.n += 1;
    state.tapsWindow = w;

    state.tapsToday = (state.tapsToday || 0) + 1;

    const mult = state.dog?.effects?.tapMultiplier ?? 1;

    state.energy -= 1;
    state.zoo += Math.max(1, Math.floor(1 * mult));

    state.lastAction = "tap";

    persistState(state);
    render(state, uiDogRefresh);

    // если много тапов быстро — триггерим AI
    if (w.n >= 35) aiTriggers?.onBigTapBurst?.();
  };

  dog.addEventListener("pointerdown", onTap, { passive: false });
  dog.addEventListener("touchstart", onTap, { passive: false });

  // реген энергии с AI множителем
  setInterval(() => {
    if (state.energy < state.energyMax) {
      const regenMult = state.dog?.effects?.regenMultiplier ?? 1;
      const inc = Math.max(1, Math.floor(1 * regenMult));

      state.energy = Math.min(state.energyMax, state.energy + inc);
      persistState(state);
      render(state, uiDogRefresh);
    }
  }, 1200);
}

function render(state, uiDogRefresh) {
  setText("balance", state.zoo);
  setText("zooSub", state.zoo);
  setEnergy(state.energy, state.energyMax);
  uiDogRefresh?.(state);
}