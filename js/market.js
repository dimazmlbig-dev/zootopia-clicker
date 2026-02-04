window.Market = (() => {
  let tonConnectUI;
  let unsubscribe;

  function getTonConnect() {
    if (!window.TonConnectUI) return null;
    if (!tonConnectUI) {
      tonConnectUI = new window.TonConnectUI({
        manifestUrl: new URL("tonconnect-manifest.json", window.location.href).toString(),
      });
    }
    return tonConnectUI;
  }

  async function connectWallet() {
    const tc = getTonConnect();
    if (!tc) {
      alert("TonConnect UI не загружен.");
      return;
    }
    await tc.openModal();
  }

  function bindTonConnect() {
    const tc = getTonConnect();
    if (!tc) return;

    tc.onStatusChange((walletInfo) => {
      const address = walletInfo?.account?.address || null;
      window.MarketState.setWallet(address);
      if (address) window.MarketState.loadMyNfts();
    });
  }

  async function sendTx(tx) {
    const tc = getTonConnect();
    if (!tc) {
      alert("TonConnect UI не загружен.");
      return;
    }
    await tc.sendTransaction(tx);
  }

  function nanoFromTon(ton) {
    const value = Number(ton);
    if (!Number.isFinite(value)) return null;
    return Math.floor(value * 1e9);
  }

  async function handleAction(action, tokenId) {
    const wallet = window.MarketState.state.wallet;
    if (!wallet) {
      alert("Подключите кошелёк.");
      return;
    }

    if (action === "buy") {
      const res = await window.MarketAPI.prepareBuy(wallet, tokenId);
      if (!res.ok) throw new Error(res.error || "Ошибка подготовки");
      await sendTx(res.tx);
      return;
    }

    if (action === "offer") {
      const input = prompt("Введите оффер в TON", "1");
      if (!input) return;
      const nano = nanoFromTon(input);
      if (!nano) {
        alert("Некорректная сумма");
        return;
      }
      const res = await window.MarketAPI.prepareOffer(wallet, tokenId, nano);
      if (!res.ok) throw new Error(res.error || "Ошибка подготовки");
      await sendTx(res.tx);
      return;
    }

    if (action === "list") {
      const input = prompt("Введите цену листинга в TON", "2");
      if (!input) return;
      const nano = nanoFromTon(input);
      if (!nano) {
        alert("Некорректная сумма");
        return;
      }
      const res = await window.MarketAPI.prepareList(wallet, tokenId, nano);
      if (!res.ok) throw new Error(res.error || "Ошибка подготовки");
      await sendTx(res.tx);
      return;
    }

    if (action === "offers") {
      await window.MarketState.loadOffers(tokenId);
      const offers = window.MarketState.state.offers[tokenId] || [];
      const text = offers.length
        ? offers.map((o) => `#${o.id} • ${Number(o.offer_nanoton) / 1e9} TON`).join("\n")
        : "Офферов нет.";
      alert(text);
      return;
    }
  }

  function render(root) {
    root.innerHTML = window.MarketUI.screenHTML(window.MarketState.state);
    window.MarketUI.bindActions(root, {
      onConnect: connectWallet,
      onRefresh: () => window.MarketState.loadListings(),
      onRefreshMine: () => window.MarketState.loadMyNfts(),
      onAction: (action, tokenId) => {
        handleAction(action, tokenId).catch((err) => {
          alert(err?.message || "Ошибка операции");
        });
      },
    });
  }

  function mount(root) {
    if (unsubscribe) unsubscribe();
    unsubscribe = window.MarketState.on(() => render(root));
    render(root);
  }

  function init() {
    bindTonConnect();
  }

  return { init, mount };
})();
