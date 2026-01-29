// js/nft.js — простая витрина NFT (пока демо-экономика)

window.NFT = (() => {
  const DEFAULT_ITEMS = [
    { id: "nft_1", title: "Puppy Common", price: 10, img: "./assets/nft/1.png" },
    { id: "nft_2", title: "Puppy Rare", price: 25, img: "./assets/nft/2.png" },
    { id: "nft_3", title: "Puppy Epic", price: 60, img: "./assets/nft/3.png" }
  ];

  async function loadItems() {
    // если у тебя есть assets/nft/nft_items.json — будет использоваться он
    try {
      const r = await fetch("./assets/nft/nft_items.json", { cache: "no-store" });
      if (!r.ok) throw new Error("no nft_items.json");
      const data = await r.json();
      if (Array.isArray(data) && data.length) return data;
      if (Array.isArray(data.items)) return data.items;
    } catch {}
    return DEFAULT_ITEMS;
  }

  function render({ state, setState, updateUI }) {
    const root = document.getElementById("nft-list");
    if (!root) return;

    root.innerHTML = "";
    loadItems().then(items => {
      for (const it of items) {
        const owned = state.nft.owned.includes(it.id);

        const card = document.createElement("div");
        card.className = "panel";
        card.style.background = "rgba(16, 18, 32, .22)";

        const title = document.createElement("div");
        title.className = "panel-title";
        title.textContent = it.title;

        const img = document.createElement("img");
        img.src = it.img || "";
        img.alt = it.title;
        img.style.width = "100%";
        img.style.borderRadius = "16px";
        img.style.border = "1px solid rgba(255,255,255,.10)";
        img.style.marginBottom = "10px";
        img.loading = "lazy";
        img.onerror = () => { img.style.display = "none"; };

        const meta = document.createElement("div");
        meta.className = "muted";
        meta.textContent = owned ? "Куплено ✅" : `Цена: ${it.price} $ZOO`;

        const btn = document.createElement("button");
        btn.className = owned ? "secondary-btn" : "primary-btn";
        btn.type = "button";
        btn.disabled = owned;
        btn.textContent = owned ? "Уже в коллекции" : "Купить";

        btn.addEventListener("click", () => {
          if (owned) return;
          if (state.zoo < it.price) {
            alert("Недостаточно $ZOO");
            return;
          }
          const next = structuredClone ? structuredClone(state) : JSON.parse(JSON.stringify(state));
          next.zoo -= it.price;
          next.nft.owned.push(it.id);
          setState(next);
          updateUI();
          render({ state: next, setState, updateUI });
        });

        card.appendChild(title);
        card.appendChild(img);
        card.appendChild(meta);
        card.appendChild(document.createElement("div")).className = "hr";
        card.appendChild(btn);

        root.appendChild(card);
      }
    });
  }

  return { render };
})();