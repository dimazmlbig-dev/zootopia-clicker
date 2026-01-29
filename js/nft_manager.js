window.NftManager = (() => {
  let items = null;

  async function load() {
    if (items) return items;
    const res = await fetch("./data/nft_items.json", { cache: "no-store" });
    items = await res.json();
    if (!Array.isArray(items)) items = [];
    return items;
  }

  function isOwned(id) {
    const s = window.State.get();
    return (s.ownedNfts || []).includes(id);
  }

  function buy(id, price) {
    const s = window.State.get();
    if (isOwned(id)) return { ok: false, reason: "already_owned" };
    if (s.zoo < price) return { ok: false, reason: "no_money" };

    s.zoo -= price;
    s.ownedNfts = s.ownedNfts || [];
    s.ownedNfts.push(id);

    window.UI.renderTop();
    window.UI.renderNft();
    window.State.save();
    return { ok: true };
  }

  return { load, isOwned, buy };
})();