window.MarketAPI = (() => {
  const BASE = "https://zootopia-backend.dimazmlbig.workers.dev";

  async function getJson(url) {
    const res = await fetch(url);
    return res.json();
  }

  async function postJson(path, body) {
    const res = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  function getListings(status = "active") {
    const url = new URL(`${BASE}/market/listings`);
    url.searchParams.set("status", status);
    return getJson(url.toString());
  }

  function getOffers(tokenId) {
    return getJson(`${BASE}/market/offers/${tokenId}`);
  }

  function getMyNfts(wallet) {
    const url = new URL(`${BASE}/me/nfts`);
    url.searchParams.set("wallet", wallet);
    return getJson(url.toString());
  }

  function prepareList(wallet, tokenId, priceNanoton) {
    return postJson("/tx/prepare-list", {
      wallet,
      token_id: tokenId,
      price_nanoton: priceNanoton,
    });
  }

  function prepareBuy(wallet, tokenId) {
    return postJson("/tx/prepare-buy", { wallet, token_id: tokenId });
  }

  function prepareOffer(wallet, tokenId, offerNanoton) {
    return postJson("/tx/prepare-offer", {
      wallet,
      token_id: tokenId,
      offer_nanoton: offerNanoton,
    });
  }

  function prepareAcceptOffer(wallet, tokenId, offerId) {
    return postJson("/tx/prepare-accept-offer", {
      wallet,
      token_id: tokenId,
      offer_id: offerId,
    });
  }

  return {
    getListings,
    getOffers,
    getMyNfts,
    prepareList,
    prepareBuy,
    prepareOffer,
    prepareAcceptOffer,
  };
})();
