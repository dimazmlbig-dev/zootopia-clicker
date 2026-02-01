window.Tasks = (() => {
  function bind(){
    const b = document.getElementById("btnTask50");
    if(!b) return;
    b.addEventListener("click", () => {
      const s = State.get();
      if(s.taps < 50){
        b.textContent = "Нужно 50 тапов";
        setTimeout(() => b.textContent = "Получить", 900);
        return;
      }
      State.set({ balance: s.balance + 50 });
      Storage.save(State.get());
      UI.render("tasks");
      bind();
    });
  }
  return { bind };
})();