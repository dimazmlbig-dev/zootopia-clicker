window.MarketUI = (() => {
  function formatTon(nano) {
    const value = Number(nano || 0) / 1e9;
    return value.toFixed(2);
  }

  function renderListings(listings) {
    if (!listings.length) {
      return `<div class="market-empty">Пока нет активных листингов.</div>`;
    }

    return listings
      .map((listing) => {
        return `
          <div class="market-card" data-token-id="${listing.token_id}">
            <div class="market-card__body">
              <div>
                <div class="market-title">Token #${listing.token_id}</div>
                <div class="market-meta">Цена: ${formatTon(listing.price_nanoton)} TON</div>
              </div>
              <div class="market-actions">
                <button class="btn" data-action="buy" data-token-id="${listing.token_id}">Buy</button>
                <button class="btn ghost" data-action="offer" data-token-id="${listing.token_id}">Make Offer</button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function renderMyNfts(items) {
    if (!items.length) {
      return `<div class="market-empty">У вас нет NFT из коллекции.</div>`;
    }

    return items
      .map((item) => {
        return `
          <div class="market-card" data-token-id="${item.token_id}">
            <div class="market-card__body">
              <div>
                <div class="market-title">Token #${item.token_id}</div>
                <div class="market-meta">${item.rarity}</div>
              </div>
              <div class="market-actions">
                <button class="btn" data-action="list" data-token-id="${item.token_id}">List</button>
                <button class="btn ghost" data-action="offers" data-token-id="${item.token_id}">Offers</button>
              </div>
            </div>
          </div>
        `;
      })
      .join("");
  }

  function screenHTML(state) {
    return `
      <div class="section">
        <div class="section__head">
          <h2>Market</h2>
          <p>Маркетплейс NFT вашей коллекции.</p>
        </div>
        <div class="market-wallet">
          <div>
            <div class="market-label">Wallet</div>
            <div class="market-value" id="marketWallet">${state.wallet || "—"}</div>
          </div>
          <button class="btn" id="marketConnect">${state.wallet ? "Переподключить" : "Подключить"}</button>
        </div>
        <div class="market-block">
          <div class="market-block__head">
            <h3>Активные листинги</h3>
            <button class="btn ghost" id="marketRefresh">Обновить</button>
          </div>
          <div class="market-grid" id="marketListings">
            ${renderListings(state.listings || [])}
          </div>
        </div>
        <div class="market-block">
          <div class="market-block__head">
            <h3>Мои NFT</h3>
            <button class="btn ghost" id="marketRefreshMine">Обновить</button>
          </div>
          <div class="market-grid" id="marketMyNfts">
            ${renderMyNfts(state.myNfts || [])}
          </div>
        </div>
        <div class="market-error" id="marketError" ${state.error ? "" : "hidden"}>${state.error || ""}</div>
      </div>
    `;
  }

  function bindActions(root, handlers) {
    root.querySelectorAll("[data-action]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const action = btn.dataset.action;
        const tokenId = Number(btn.dataset.tokenId);
        handlers.onAction?.(action, tokenId);
      });
    });

    root.querySelector("#marketConnect")?.addEventListener("click", handlers.onConnect);
    root.querySelector("#marketRefresh")?.addEventListener("click", handlers.onRefresh);
    root.querySelector("#marketRefreshMine")?.addEventListener("click", handlers.onRefreshMine);
  }

  return { screenHTML, bindActions };
})();
