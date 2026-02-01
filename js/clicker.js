(function(){
  function haptic(){
    try{
      const tg = window.Telegram?.WebApp;
      // haptic (если доступно)
      tg?.HapticFeedback?.impactOccurred?.("light");
    }catch(e){}
    // обычная вибрация телефона (если разрешено)
    try{ navigator.vibrate?.(12); }catch(e){}
  }

  function spawnFloat(text){
    const screen = document.getElementById("screen");
    if(!screen) return;

    const el = document.createElement("div");
    el.className = "floatText";
    el.textContent = text;

    // чуть влево/вправо
    const dx = Math.round((Math.random() - 0.5) * 90);
    el.style.setProperty("--dx", dx + "px");

    screen.appendChild(el);
    setTimeout(()=> el.remove(), 900);
  }

  function tapAnim(){
    const dog = document.getElementById("dog");
    if(!dog) return;
    dog.classList.remove("tap");
    // форс-рефлоу
    void dog.offsetWidth;
    dog.classList.add("tap");
    setTimeout(()=> dog.classList.remove("tap"), 220);
  }

  window.onDogTap = function(ev){
    ev?.preventDefault?.();

    const g = window.STATE.game;
    const now = Date.now();

    // анти-спам: минимум 40мс
    if(now - g.lastTapAt < 40) return;
    g.lastTapAt = now;

    if(g.energy <= 0){
      // если долбят без энергии — злимся
      g.mood = "angry";
      spawnFloat("😤");
      haptic();
      tapAnim();
      window.UI.render();
      return;
    }

    // стоимость тапа
    g.energy = Math.max(0, g.energy - 1);

    // доход
    const baseGain = 1;
    const moodTapMul = g.mood === "angry" ? 0.7 : (g.mood === "tired" ? 0.9 : 1.0);
    const gain = Math.max(1, Math.round(baseGain * moodTapMul));
    g.balance += gain;

    g.taps += 1;

    // если тапы слишком частые — tired
    if(g.energy < 120) g.mood = "tired";
    // если долбят по нулю — angry
    if(g.energy === 0 && g.taps % 10 === 0) g.mood = "angry";
    // если энергии много и всё ок — happy
    if(g.energy > 350 && g.mood === "angry") g.mood = "happy";

    spawnFloat(`+${gain} $ZOO`);
    haptic();
    tapAnim();

    window.StorageAPI.save();
    window.UI.render();
  };
})();