// js/tonconnect.js — безопасная обёртка (без отправки средств по умолчанию)

window.TonConnectManager = (() => {
  let ui = null;

  function isReady() {
    return !!(window.TON_CONNECT_UI && window.TON_CONNECT_UI.TonConnectUI);
  }

  async function init(manifestUrl = "./tonconnect-manifest.json") {
    if (!isReady()) {
      console.warn("TON Connect UI not loaded");
      return null;
    }

    try {
      ui = new window.TON_CONNECT_UI.TonConnectUI({
        manifestUrl,
        buttonRootId: "ton-connect-ui"
      });

      return ui;
    } catch (e) {
      console.warn("TonConnect init error:", e);
      return null;
    }
  }

  function getAddress() {
    try {
      const acc = ui?.account;
      return acc?.address || "";
    } catch {
      return "";
    }
  }

  function isConnected() {
    return !!getAddress();
  }

  // Не включаю реальную отправку, чтобы ты случайно не “слил” деньги.
  // Позже добавим получателя и подтверждение.
  async function sendTransactionDemo() {
    alert("Демо: отправка выключена. Скажи кому/сколько/что в payload — подключу реальную транзакцию.");
  }

  return { init, isConnected, getAddress, sendTransactionDemo };
})();