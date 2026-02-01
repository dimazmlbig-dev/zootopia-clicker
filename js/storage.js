(function(){
  function key() {
    const uid = window.STATE?.user?.id ?? "anon";
    return `zoo_v1_${uid}`;
  }

  window.StorageAPI = {
    load(){
      try{
        const raw = localStorage.getItem(key());
        if(!raw) return;
        const data = JSON.parse(raw);
        if(data?.game){
          Object.assign(window.STATE.game, data.game);
        }
      }catch(e){}
    },
    save(){
      try{
        localStorage.setItem(key(), JSON.stringify({ game: window.STATE.game }));
      }catch(e){}
    },
    reset(){
      try{ localStorage.removeItem(key()); }catch(e){}
    }
  };
})();