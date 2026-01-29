// js/tonconnect.js — безопасная инициализация TonConnect UI

window.TonConnectManager = (() => {
  let ui = null;

  function init() {
    try {
      if (!window.TON_CONNECT_UI?.TonConnectUI) {
        console.warn("TON_CONNECT_UI not loaded");
        return false;
      }
      ui = new window.TON_CONNECT_UI.TonConnectUI({
        manifestUrl: "./tonconnect-manifest.json",
        buttonRootId: "ton-connect-ui"
      });

      ui.onStatusChange((walletInfo) => {
        const s = window.State?.get?.();
        if (!s) return;

        const addr = walletInfo?.account?.address || "";
        s.walletAddress = addr;

        window.State.set(s);
        window.State.save();

        const short = addr ? (addr.slice(0, 4) + "…" + addr.slice(-4)) : "Кошелёк";
        const w = document.getElementById("wallet-short");
        if (w) w.innerText = short;
      });

      return true;
    } catch (e) {
      console.warn("TonConnect init error:", e);
      return false;
    }
  }

  function isConnected() {
    return !!ui?.connected;
  }

  async function sendTon(to, amountNano, comment) {
    if (!ui) throw new Error("TonConnect UI not initialized");
    const tx = {
      validUntil: Math.floor(Date.now() / 1000) + 90,
      messages: [
        {
          address: to,
          amount: String(amountNano),
          payload: comment ? btoa(unescape(encodeURIComponent(comment))) : undefined
        }
      ]
    };
    return ui.sendTransaction(tx);
  }

  return { init, isConnected, sendTon };
})();