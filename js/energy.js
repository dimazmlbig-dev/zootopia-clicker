(function(){
  // 1 тик = 1 секунда
  const TICK_MS = 1000;

  function regen(){
    const g = window.STATE.game;

    // базовый реген
    const base = 18;

    // влияние настроения
    const moodRegenMul = g.mood === "tired" ? 1.25 : (g.mood === "angry" ? 0.85 : 1.0);

    const add = Math.round(base * moodRegenMul);
    g.energy = Math.min(g.energyMax, g.energy + add);

    // если энергия совсем низкая — становимся tired
    if(g.energy < 160) g.mood = "tired";
    // если энергия восстановилась — happy
    if(g.energy > 520 && g.mood === "tired") g.mood = "happy";

    window.StorageAPI.save();
    window.UI.render();
  }

  setInterval(regen, TICK_MS);
})();