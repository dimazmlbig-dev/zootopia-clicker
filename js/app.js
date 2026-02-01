(function(){
  function initTelegram(){
    const tg = window.Telegram?.WebApp;
    if(tg){
      try{
        tg.expand();
        tg.ready();
      }catch(e){}
    }

    // главное: userId из Telegram
    const u = tg?.initDataUnsafe?.user;
    if(u?.id){
      window.STATE.user.id = String(u.id);
      window.STATE.user.name = u.first_name || u.username || "Игрок";
    }else{
      // fallback (если открыто не из Telegram)
      window.STATE.user.id = "anon";
      window.STATE.user.name = "Игрок";
    }
  }

  function boot(){
    initTelegram();

    // грузим состояние под конкретного пользователя
    window.StorageAPI.load();

    // дефолт idle
    window.STATE.game.mood = window.STATE.game.mood || "happy";
    window.STATE.game.energyMax = window.STATE.game.energyMax || 1000;
    if(typeof window.STATE.game.energy !== "number") window.STATE.game.energy = 1000;

    // первый рендер
    window.UI.render();

    // Splash: 900ms минимум
    const splash = document.getElementById("splash");
    const app = document.getElementById("app");
    setTimeout(()=>{
      splash.classList.add("hidden");
      app.classList.remove("hidden");
    }, 900);
  }

  window.addEventListener("load", boot);
})();