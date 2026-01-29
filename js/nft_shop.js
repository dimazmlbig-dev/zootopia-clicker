// js/nft_shop.js
window.NFTShop = (() => {
  let items = [];

  async function loadItems() {
    const r = await fetch("./data/nft_items.json");
    items = await r.json();
  }

  function getItem(id) {
    return items.find(x => x.id === id);
  }

  function renderShop() {
    const root = document.getElementById("nftList");
    const s = window.State.get();
    root.innerHTML = "";

    for (const it of items) {
      const owned = window.State.isOwned(it.id);
      const equipped = s.equipped[it.slot] === it.id;

      const card = document.createElement("div");
      card.className = "nft-card";

      card.innerHTML = `
        <img src="${it.asset}" alt="${it.name}" draggable="false"/>
        <div class="nft-title">${it.name}</div>
        <div class="nft-meta">Цена: <b>${it.priceZoo}</b> $ZOO • Слот: ${it.slot}</div>
        <button class="btn w100" data-action="${owned ? (equipped ? "unequip" : "equip") : "buy"}" data-id="${it.id}">
          ${owned ? (equipped ? "Снять" : "Надеть") : "Купить"}
        </button>
      `;

      card.querySelector("button").addEventListener("click", () => {
        onAction(it);
      });

      root.appendChild(card);
    }
  }

  function onAction(it) {
    const s = window.State.get();
    const owned = window.State.isOwned(it.id);
    const equipped = s.equipped[it.slot] === it.id;

    if (!owned) {
      if (!window.State.spendZoo(it.priceZoo)) {
        alert("Не хватает $ZOO");
        return;
      }
      window.State.ownNft(it.id);
      window.State.equip(it.slot, it.id);
      window.State.save();
      window.UI.renderAll();
      renderShop();
      return;
    }

    // owned
    if (equipped) {
      window.State.equip(it.slot, null);
    } else {
      window.State.equip(it.slot, it.id);
    }
    window.State.save();
    window.UI.renderAll();
    renderShop();
  }

  function renderEquippedOverlay() {
    const s = window.State.get();
    const overlayRoot = document.getElementById("dogOverlay");
    if (!overlayRoot) return;

    overlayRoot.innerHTML = "";

    for (const slot of Object.keys(s.equipped)) {
      const id = s.equipped[slot];
      if (!id) continue;

      const it = getItem(id);
      if (!it?.overlay) continue;

      const img = document.createElement("img");
      img.className = "overlay-item";
      img.src = it.asset;
      img.alt = it.name;
      img.draggable = false;

      img.style.left = `${it.overlay.x}px`;
      img.style.top = `${it.overlay.y}px`;
      img.style.width = `${it.overlay.w}px`;
      img.style.height = `${it.overlay.h}px`;

      overlayRoot.appendChild(img);
    }
  }

  async function init() {
    await loadItems();
    renderShop();
    renderEquippedOverlay();
  }

  return { init, renderShop, renderEquippedOverlay };
})();