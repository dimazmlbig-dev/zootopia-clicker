window.STATE = {
  user: {
    id: null,
    name: "Игрок",
  },
  game: {
    energy: 1000,
    energyMax: 1000,
    balance: 0,
    mood: "happy", // happy | tired | angry
    trait: "loyal",
    taps: 0,
    lastTapAt: 0,
    items: { hat:false, glasses:false, collar:false }, // NFT overlays
  },
  ui: {
    tab: "click",
    splashDone: false,
  }
};