window.Wallet = (() => {
  let tonConnectUI;

  function resolveTonConnectCtor() {
    if (typeof window.TonConnectUI === "function") return window.TonConnectUI;
    if (window.TON_CONNECT_UI && typeof window.TON_CONNECT_UI.TonConnectUI === "function") {
      return window.TON_CONNECT_UI.TonConnectUI;
    }
    return null;
  }

  function getManifestUrl() {
    return new URL("./tonconnect-manifest.json", window.location.href).toString();
  }

  async function getTonConnectAsync() {
    if (tonConnectUI) return tonConnectUI;

    const started = Date.now();
    while (Date.now() - started < 5000) {
      const Ctor = resolveTonConnectCtor();
      if (Ctor) {
        tonConnectUI = new Ctor({ manifestUrl: getManifestUrl() });
        return tonConnectUI;
      }
      await new Promise((r) => setTimeout(r, 50));
    }
    return null;
  }

  async function connect() {
    const tc = await getTonConnectAsync();
    if (!tc) {
      alert("TonConnect UI не загружен.");
      return;
    }
    await tc.openModal();
  }

  async function bind() {
    const tc = await getTonConnectAsync();
    if (!tc) return;

    try {
      tc.onStatusChange((walletInfo) => {
        const address = walletInfo?.account?.address || null;
        if (address) window.Auth?.linkWallet?.(address);
      });
    } catch (_) {}
  }

  return { bind, connect };
})();
