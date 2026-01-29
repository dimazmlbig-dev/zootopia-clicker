// js/tonconnect.js — безопасная инициализация TonConnectUI (не блокирует игру)

window.TonConnectManager = (() => {
  let ui = null;
  let connected = false;

  function init() {
    try {
      if (!window.TonConnectUI) {
        console.warn("TonConnectUI lib not loaded");
        return;
      }

      ui = new window.TonConnectUI({
        manifestUrl: "https://dimazmlbig-dev.github.io/zootopia-clicker/tonconnect-manifest.json",
        buttonRootId: "ton-connect"
      });

      ui.onStatusChange((wallet) => {
        connected = !!wallet;
        const addr = wallet?.account?.address || "";
        const short = addr ? (addr.slice(0, 4) + "..." + addr.slice(-4)) : "Кошелёк";
        document.getElementById("wallet-address")?.innerText = short;

        // сохраним в state
        try {
          const s = window.State.get();
          s.walletAddress = addr || "";
          window.State.set(s);
          window.State.save();
        } catch (_) {}
      });
    } catch (e) {
      console.warn("TonConnect init error:", e);
    }
  }

  function isConnected() {
    return !!connected;
  }

  async function sendTon(toAddress, amountNano, comment) {
    if (!ui) throw new Error("TonConnect not initialized");
    if (!connected) throw new Error("Wallet not connected");

    return ui.sendTransaction({
      validUntil: Math.floor(Date.now() / 1000) + 300,
      messages: [
        {
          address: toAddress,
          amount: String(amountNano),
          payload: comment ? btoa(unescape(encodeURIComponent(comment))) : undefined
        }
      ]
    });
  }

  return { init, isConnected, sendTon };
})();