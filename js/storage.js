window.Storage = (() => {
  const KEY = "zoo_state_v1";

  function load(){
    try{
      const raw = localStorage.getItem(KEY);
      if(!raw) return null;
      return JSON.parse(raw);
    }catch(e){
      return null;
    }
  }

  function save(state){
    try{
      localStorage.setItem(KEY, JSON.stringify(state));
    }catch(e){}
  }

  return { load, save };
})();