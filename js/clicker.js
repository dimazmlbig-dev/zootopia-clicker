import { persistState } from "./state.js";
import { setText, setEnergy } from "./ui.js";

export function initClicker(state) {
  render(state);

  const dog = document.getElementById("dogImg");
  if (!dog) return;

  dog.addEventListener("click", () => {
    if (state.energy <= 0) return;

    state.energy -= 1;
    state.zoo += 1;

    persistState(state);
    render(state);
  });

  // простая регенка энергии
  setInterval(() => {
    if (state.energy < state.energyMax) {
      state.energy += 1;
      persistState(state);
      render(state);
    }
  }, 1200);
}

function render(state) {
  setText("balance", state.zoo);
  setText("zooSub", state.zoo);
  setEnergy(state.energy, state.energyMax);
}