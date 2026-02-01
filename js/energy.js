window.Energy = (() => {
  let timer = null;

  function start(){
    stop();
    timer = setInterval(() => {
      const s = State.get();
      if(s.energy < s.energyMax){
        State.set({ energy: Math.min(s.energyMax, s.energy + 2) });
        Storage.save(State.get());
        // если мы на экране клика — обновим
        if(App.getTab() === "click") UI.render("click");
      }
    }, 1000);
  }

  function stop(){
    if(timer) clearInterval(timer);
    timer = null;
  }

  return { start, stop };
})();