(function(){
  window.TasksScreen = {
    html(){
      return `
        <div class="centerScreen">
          <div class="card">
            <div style="font-weight:900;font-size:18px;margin-bottom:10px;color:rgba(255,255,255,.92)">Задания</div>
            <div style="color:rgba(255,255,255,.75);line-height:1.4">
              Здесь будут задания и рефералка.<br><br>
              Сейчас: сделай 50 тапов → получи предмет.
            </div>
            <button id="claimTask" style="
              margin-top:14px;width:100%;height:46px;border-radius:14px;
              border:1px solid rgba(255,255,255,.18);background:rgba(255,255,255,.14);
              color:rgba(255,255,255,.95);font-weight:900;
            ">Забрать награду</button>
          </div>
        </div>
      `;
    }
  };

  // биндим после каждого рендера через capture
  document.addEventListener("click", (e)=>{
    const btn = e.target.closest("#claimTask");
    if(!btn) return;

    const g = window.STATE.game;
    if(g.taps < 50){
      alert("Нужно 50 тапов 🙂");
      return;
    }
    // награда: включим очки
    g.items.glasses = true;
    window.StorageAPI.save();
    window.UI.render();
    alert("Награда получена: очки 😎");
  }, true);
})();