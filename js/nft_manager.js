window.NFTManager = (() => {
  function toggle(key){
    const s = State.get();
    const next = { ...s.equipped, [key]: !s.equipped[key] };
    State.set({ equipped: next });
    Storage.save(State.get());
  }
  return { toggle };
})();