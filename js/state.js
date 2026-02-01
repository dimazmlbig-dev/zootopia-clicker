window.State = (() => {
  const defaults = {
    user: { id: "0", name: "Игрок" },
    balance: 0,
    energy: 1000,
    energyMax: 1000,
    taps: 0,
    // equip toggles
    equipped: { glasses: false, hat: false, collar: false }
  };

  let s = structuredClone(defaults);

  function get(){ return s; }
  function set(patch){
    s = { ...s, ...patch };
    return s;
  }

  function reset(){ s = structuredClone(defaults); }

  // derived mood
  function mood(){
    const ratio = s.energyMax ? (s.energy / s.energyMax) : 0;
    if (ratio > 0.6) return "happy";
    if (ratio > 0.25) return "tired";
    return "angry";
  }

  return { get, set, reset, mood };
})();