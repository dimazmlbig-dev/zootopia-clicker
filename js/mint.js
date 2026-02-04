window.Mint = (() => {
  const STORAGE_KEY = "zoo_mint_request";
  let tonConnectUI;
  let pollTimer;
  let rootEl;
  let canvasApi;
  let lastStatus;

  const state = {
    wallet: null,
    mode: "quick",
    style: "neon",
    requestId: null,
    status: null,
    overallProgress: 0,
    stageProgress: 0,
    etaSeconds: null,
    message: "",
    previewUrl: null,
    imageUrl: null,
    animationUrl: null,
    metadataUrl: null,
    nftAddress: null,
    error: null,
  };

  function getTonConnect() {
    if (!window.TonConnectUI) return null;
    if (!tonConnectUI) {
      tonConnectUI = new window.TonConnectUI({
        manifestUrl: new URL("tonconnect-manifest.json", window.location.href).toString(),
      });
    }
    return tonConnectUI;
  }

  function saveRequestId(requestId) {
    if (!requestId) {
      localStorage.removeItem(STORAGE_KEY);
      return;
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ requestId }));
  }

  function loadRequestId() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      return parsed?.requestId || null;
    } catch (err) {
      return null;
    }
  }

  function setState(patch) {
    Object.assign(state, patch);
    render();
  }

  async function connectWallet() {
    const tc = getTonConnect();
    if (!tc) {
      alert("TonConnect UI не загружен.");
      return;
    }
    await tc.openModal();
  }

  async function sendTx(tx) {
    const tc = getTonConnect();
    if (!tc) {
      alert("TonConnect UI не загружен.");
      return;
    }
    await tc.sendTransaction(tx);
  }

  function bindTonConnect() {
    const tc = getTonConnect();
    if (!tc) return;
    tc.onStatusChange((walletInfo) => {
      const address = walletInfo?.account?.address || null;
      setState({ wallet: address });
      if (address) window.Auth?.linkWallet?.(address);
    });
  }

  function isSeeded(status) {
    return ["seeded", "rendering", "uploading", "minting", "minted"].includes(status);
  }

  async function pollStatus(requestId) {
    if (!requestId) return;
    const data = await window.MintAPI.getStatus(requestId);
    if (!data.ok) {
      setState({ error: data.error || "Ошибка статуса" });
      return;
    }
    setState({
      status: data.status,
      overallProgress: data.overall_progress,
      stageProgress: data.stage_progress,
      etaSeconds: data.eta_seconds,
      message: data.message,
      previewUrl: data.preview_url,
      imageUrl: data.image_url,
      animationUrl: data.animation_url,
      metadataUrl: data.metadata_url,
      nftAddress: data.nft_address,
      error: null,
    });

    const preview = data.image_url || data.preview_url;
    if (canvasApi && preview) {
      canvasApi.setImage(preview);
    }
    if (canvasApi) {
      canvasApi.setProgress(data.overall_progress, isSeeded(data.status));
      if (data.status === "seeded" && lastStatus !== "seeded") {
        canvasApi.flash();
      }
    }
    lastStatus = data.status;

    if (data.status === "minted") {
      stopPolling();
    }
  }

  function startPolling() {
    stopPolling();
    if (!state.requestId) return;
    pollTimer = setInterval(() => {
      pollStatus(state.requestId).catch((err) => {
        console.error(err);
      });
    }, 2000);
    pollStatus(state.requestId).catch((err) => console.error(err));
  }

  function stopPolling() {
    if (pollTimer) {
      clearInterval(pollTimer);
      pollTimer = null;
    }
  }

  async function handleCreate() {
    if (!state.wallet) {
      await connectWallet();
      return;
    }
    if (state.mode === "forge" && !state.style) {
      alert("Выберите стиль Forge.");
      return;
    }
    setState({ error: null });
    const res = await window.MintAPI.prepareMint({
      wallet: state.wallet,
      mode: state.mode,
      style: state.mode === "forge" ? state.style : null,
    });
    if (!res.ok) {
      setState({ error: res.error || "Ошибка подготовки" });
      return;
    }
    setState({ requestId: res.request_id });
    saveRequestId(res.request_id);
    await sendTx(res.tonconnect_tx);
    startPolling();
  }

  function render() {
    if (!rootEl) return;
    rootEl.innerHTML = window.MintUI.screenHTML(state);
    window.MintUI.bindActions(rootEl, {
      onMode: (mode) => {
        setState({ mode, style: mode === "forge" ? state.style || "neon" : null });
      },
      onStyle: (style) => setState({ style }),
      onConnect: connectWallet,
      onCreate: () => handleCreate().catch((err) => setState({ error: err.message || "Ошибка" })),
    });

    const canvas = rootEl.querySelector("#mintCanvas");
    if (canvas) {
      canvasApi = window.MintCanvas.create(canvas, { seed: state.requestId || "zootopia" });
      const preview = state.imageUrl || state.previewUrl;
      if (preview) canvasApi.setImage(preview);
      canvasApi.setProgress(state.overallProgress, isSeeded(state.status));
    }
  }

  function mount(root) {
    rootEl = root;
    render();
  }

  function init() {
    bindTonConnect();
    const requestId = loadRequestId();
    if (requestId) {
      setState({ requestId });
      startPolling();
    }
  }

  return { init, mount };
})();
