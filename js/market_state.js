window.MarketState = (() => {
  const state = {
    wallet: null,
    listings: [],
    offers: {},
    myNfts: [],
    loading: false,
    error: null,
  };

  const listeners = new Set();

  function emit() {
    listeners.forEach((fn) => {
      try { fn(state); } catch (err) { console.error(err); }
    });
  }

  function set(patch) {
    Object.assign(state, patch);
    emit();
  }

  function setWallet(wallet) {
    set({ wallet });
  }

  async function loadListings() {
    set({ loading: true, error: null });
    try {
      const res = await window.MarketAPI.getListings("active");
      set({ listings: res.listings || [], loading: false });
    } catch (err) {
      set({ loading: false, error: err?.message || "Не удалось загрузить листинги" });
    }
  }

  async function loadOffers(tokenId) {
    set({ loading: true, error: null });
    try {
      const res = await window.MarketAPI.getOffers(tokenId);
      set({
        offers: { ...state.offers, [tokenId]: res.offers || [] },
        loading: false,
      });
    } catch (err) {
      set({ loading: false, error: err?.message || "Не удалось загрузить офферы" });
    }
  }

  async function loadMyNfts() {
    if (!state.wallet) return;
    set({ loading: true, error: null });
    try {
      const res = await window.MarketAPI.getMyNfts(state.wallet);
      set({ myNfts: res.items || [], loading: false });
    } catch (err) {
      set({ loading: false, error: err?.message || "Не удалось загрузить NFT" });
    }
  }

  return {
    state,
    on(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    setWallet,
    loadListings,
    loadOffers,
    loadMyNfts,
  };
})();
