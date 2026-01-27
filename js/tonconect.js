// js/tonconnect.js - безопасная интеграция TonConnect (не блокирует игру)

window.TonConnectManager = (() => {
  let ui = null;
  let connected = false;

  function init() {
    try {
      if (!window.TON_CONNECT_UI) {
        console.warn("TON_CONNECT_UI not loaded");
        return;
      }

      ui = new TON_CONNECT_UI.TonConnectUI({
        manifestUrl: "https://dimazmlbig-dev.github.io/zootopia-clicker/tonconnect-manifest.json",
        buttonRootId: "ton-connect"
      });

      ui.onStatusChange((wallet) => {
        connected = !!wallet;
        const addr = wallet?.account?.address || "";
        const el = document.getElementById("wallet-address");
        if (el) el.innerText = addr ? (addr.slice(0, 6) + "..." + addr.slice(-6)) : "Кошелёк";

        const s = window.State?.get?.();
        if (s) {
          s.walletAddress = addr || "";
          window.State?.set?.(s);
          window.State?.save?.();
        }
      });
    } catch (e) {
      console.warn("TonConnect init failed:", e);
    }
  }

  function isConnected() {
    return connected;
  }

  async function sendTon(toAddress, amountNano, comment) {
    if (!ui) throw new Error("TonConnect not initialized");
    if (!connected) throw new Error("Wallet not connected");

    const tx = {
      validUntil: Math.floor(Date.now() / 1000) + 300,
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

  return { init, isConnected, sendTon };
})();