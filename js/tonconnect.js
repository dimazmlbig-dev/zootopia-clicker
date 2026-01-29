window.TonConnectManager = (() => {
  let ui = null;

  function init() {
    if (!window.TON_CONNECT_UI || !window.TON_CONNECT_UI.TonConnectUI) {
      console.warn("TON Connect UI not loaded");
      return null;
    }

    ui = new window.TON_CONNECT_UI.TonConnectUI({
      manifestUrl: "./tonconnect-manifest.json"
    });

    return ui;
  }

  function getUI() { return ui; }
  function isConnected() { return !!(ui && ui.connected); }

  async function send(to, amountNano, comment) {
    if (!ui) throw new Error("tonconnect not init");
    const tx = {
      validUntil: Math.floor(Date.now() / 1000) + 60,
      messages: [{ address: to, amount: String(amountNano) }]
    };
    // comment payload можно добавить позже корректно; сейчас базовый tx
    await ui.sendTransaction(tx);
  }

  return { init, getUI, isConnected, send };
})();