// js/storage.js
window.StorageManager = (() => {
  const KEY = "zootopia_state_v2";

  function defaultState() {
    return {
      v: 2,
      bones: 0,
      zoo: 0,

      energy: 1000,
      maxEnergy: 1000,

      // nft
      ownedNft: {},       // {id: true}
      equipped: {         // slot -> id
        glasses: null,
      },

      // referrals
      referrals: 0,
      referralsMax: 5,
      rewardClaimed: false,

      // wallet
      walletAddress: "",
      tonBalanceNano: 0,

      // tasks example
      tasks: {
        taps: 0,
        taskTap100Claimed: false,
      },

      mining: {
        level: 1,
        lastCollect: Date.now(),
      },
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function save(state) {
    localStorage.setItem(KEY, JSON.stringify(state));
  }

  return { KEY, defaultState, load, save };
})();