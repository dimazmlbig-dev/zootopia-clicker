// js/wallet.js
window.Wallet = (() => {
  let tonConnectUI = null;

  function initTonConnect() {
    // UI container
    const el = document.getElementById("tonConnectUi");
    el.innerHTML = "";

    tonConnectUI = new window.TON_CONNECT_UI.TonConnectUI({
      manifestUrl: "./tonconnect-manifest.json",
      buttonRootId: "tonConnectUi"
    });

    tonConnectUI.onStatusChange(wallet => {
      const s = window.State.get();
      const addr = wallet?.account?.address || "";
      s.walletAddress = addr;
      window.State.save();
      window.UI.renderAll();
    });
  }

  async function refreshBalance() {
    const s = window.State.get();
    if (!s.walletAddress) {
      alert("Сначала подключи кошелёк");
      return;
    }

    const r = await window.Backend.getTonBalance(s.walletAddress);
    if (!r.ok) {
      alert("Ошибка TON API");
      return;
    }
    s.tonBalanceNano = Number(r.balanceNano || 0);
    window.State.save();
    window.UI.renderAll();
  }

  function init() {
    initTonConnect();
    document.getElementById("tonRefreshBtn").addEventListener("click", refreshBalance);
  }

  return { init, refreshBalance };
})();