// js/tonconnect.js — безопасный wrapper вокруг TON Connect UI

window.TonConnectManager = (() => {
  let ui = null;
  let onChangeCb = null;

  function shorten(addr) {
    if (!addr) return "Кошелёк";
    if (addr.length <= 12) return addr;
    return addr.slice(0, 4) + "…" + addr.slice(-4);
  }

  function getAddress() {
    const addr = ui?.wallet?.account?.address || "";
    return addr;
  }

  function isConnected() {
    return !!getAddress();
  }

  async function init() {
    if (ui) return ui;

    const manifestUrl = new URL("tonconnect-manifest.json", window.location.href).toString();
    const Ctor = window.TON_CONNECT_UI?.TonConnectUI || window.TonConnectUI || null;
    if (!Ctor) {
      console.warn("TonConnect UI not found");
      return null;
    }

    ui = new Ctor({ manifestUrl, buttonRootId: "ton-connect" });

    // initial
    const addr0 = getAddress();
    if (addr0) onChangeCb?.(addr0);

    ui.onStatusChange((wallet) => {
      const addr = wallet?.account?.address || "";
      onChangeCb?.(addr);
    });

    return ui;
  }

  function onChange(cb) {
    onChangeCb = cb;
  }

  async function sendTon(toAddress, amountNano, comment) {
    if (!ui) throw new Error("TonConnect not initialized");
    if (!isConnected()) throw new Error("Wallet not connected");

    const tx = {
      validUntil: Math.floor(Date.now() / 1000) + 360,
      messages: [
        {
          address: toAddress,
          amount: String(amountNano),
          payload: comment ? btoa(unescape(encodeURIComponent(comment))) : undefined
        }
      ]
    };
    return ui.sendTransaction(tx);
  }

  async function disconnect() {
    try { await ui?.disconnect?.(); } catch {}
  }

  return { init, onChange, isConnected, getAddress, shorten, sendTon, disconnect };
})();