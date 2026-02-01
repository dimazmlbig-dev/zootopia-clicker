window.Clicker = (() => {
  function bind(){
    const stage = document.getElementById("dogStage");
    const wrap  = document.getElementById("dogWrap");

    if(!stage || !wrap) return;

    const tap = (clientX, clientY) => {
      const s = State.get();
      if(s.energy <= 0) return;

      // state update
      const gain = 1;
      State.set({
        balance: s.balance + gain,
        taps: s.taps + 1,
        energy: Math.max(0, s.energy - 1)
      });
      Storage.save(State.get());

      // tap anim
      wrap.classList.remove("is-idle");
      wrap.classList.add("is-tap");
      setTimeout(() => {
        wrap.classList.remove("is-tap");
        wrap.classList.add("is-idle");
      }, 240);

      // haptics
      if(window.Telegram?.WebApp?.HapticFeedback){
        Telegram.WebApp.HapticFeedback.impactOccurred("light");
      }
      if(navigator.vibrate) navigator.vibrate(15);

      // floating text
      spawnFloat(stage, clientX, clientY, `+$ZOO`);

      // re-render click UI to refresh numbers/energy/mood
      UI.render("click");
      // снова повесим бинды (потому что render пересоздаёт DOM)
      bind();
    };

    stage.addEventListener("pointerdown", (e) => {
      const rect = stage.getBoundingClientRect();
      tap(e.clientX - rect.left, e.clientY - rect.top);
    }, { passive:true });
  }

  function spawnFloat(stage, x, y, text){
    const el = document.createElement("div");
    el.className = "float";
    el.textContent = text;
    el.style.left = x + "px";
    el.style.top = y + "px";
    stage.appendChild(el);
    el.addEventListener("animationend", () => el.remove());
  }

  return { bind };
})();