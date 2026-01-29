window.NFT = (() => {
  async function render() {
    const root = document.getElementById("page-nft");
    if (!root) return;

    const items = await window.NftManager.load();
    const s = window.State.get();

    root.innerHTML = `
      <div class="card">
        <div class="h1">NFT магазин</div>
        <div class="muted">Покупай предметы за $ZOO. Купленное — остается у тебя.</div>
      </div>
      <div id="nftList"></div>
      <div class="card">
        <div class="h1">Твои NFT</div>
        <div id="ownedList" class="muted">—</div>
      </div>
    `;

    const list = root.querySelector("#nftList");
    const owned = root.querySelector("#ownedList");

    if (!items.length) {
      list.innerHTML = `<div class="card"><div class="muted">Пока пусто. Заполни data/nft_items.json</div></div>`;
    } else {
      list.innerHTML = items.map(it => {
        const owned = window.NftManager.isOwned(it.id);
        const btn = owned ? "Куплено" : `Купить за ${it.price} $ZOO`;
        return `
          <div class="card">
            <div class="row">
              <div>
                <div style="font-weight:900">${it.title}</div>
                <div class="muted">${it.desc || ""}</div>
              </div>
              <img src="${it.image}" alt="" style="width:56px;height:56px;border-radius:16px;background:rgba(0,0,0,.15);padding:6px">
            </div>
            <div class="sep"></div>
            <button class="btn ${owned ? "btn--ghost" : "btn--primary"}" data-buy="${it.id}" ${owned ? "disabled" : ""}>
              ${btn}
            </button>
          </div>
        `;
      }).join("");
    }

    const ownedIds = (s.ownedNfts || []);
    if (!ownedIds.length) owned.textContent = "Пока ничего нет.";
    else owned.textContent = ownedIds.join(", ");

    root.querySelectorAll("[data-buy]").forEach(btn => {
      btn.addEventListener("click", () => {
        const id = btn.getAttribute("data-buy");
        const it = items.find(x => x.id === id);
        if (!it) return;
        const r = window.NftManager.buy(it.id, it.price);
        if (!r.ok && r.reason === "no_money") alert("Не хватает $ZOO");
      });
    });
  }

  return { render };
})();