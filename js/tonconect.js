// js/tonconnect.js — TonConnect без блокировки игры

window.TonConnectManager = (() => {
  let ui = null;
  let currentAddress = "";

  function short(addr) {
    if (!addr) return "";
    return addr.slice(0, 4) + "…" + addr.slice(-4);
  }

  function setWalletText(addr) {
    const el = document.getElementById("wallet-address");
    if (!el) return;
    el.innerText = addr ? short(addr) : "Кошелёк";
  }

  function init() {
    try {
      if (!window.TonConnectUI) {
        console.warn("TonConnectUI lib not found");
        return;
      }

      ui = new window.TonConnectUI.TonConnectUI({
        manifestUrl: `${location.origin}${location.pathname.replace(/\/[^/]*$/, "/")}tonconnect-manifest.json`,
        buttonRootId: "ton-connect"
      });

      // подписка на изменения
      ui.onStatusChange((wallet) => {
        currentAddress = wallet?.account?.address || "";
        setWalletText(currentAddress);

        const s = State.get();
        s.walletAddress = currentAddress || "";
        State.set(s);
        State.save();
      });

      // начальное состояние
      if (ui.wallet?.account?.address) {
        currentAddress = ui.wallet.account.address;
        setWalletText(currentAddress);
      } else {
        setWalletText("");
      }

    } catch (e) {
      console.warn("TonConnect init error:", e);
    }
  }

  function isConnected() {
    return !!(ui && ui.wallet && ui.wallet.account && ui.wallet.account.address);
  }

  async function sendTon(to, amountNano, comment = "") {
    if (!ui) throw new Error("TonConnectUI not initialized");
    if (!isConnected()) throw new Error("Wallet not connected");

    const tx = {
      validUntil: Math.floor(Date.now() / 1000) + 300,
      messages: [
        {
          address: to,
          amount: String(amountNano),
          payload: comment ? btoa(unescape(encodeURIComponent(comment))) : undefined
        }
      ]
    };

    return await ui.sendTransaction(tx);
  }

  return { init, isConnected, sendTon };
})();