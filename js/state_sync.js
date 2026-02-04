(function () {
  const TAP_DEBOUNCE_MS = 180;
  const MAX_BATCH = 20;

  let tapTimer = null;
  let tapQueue = 0;

  function generateKey() {
    if (crypto.randomUUID) return crypto.randomUUID();
    return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
  }

  async function loadState(store) {
    const response = await window.App.apiFetch("/state", { method: "GET" });
    store.update((draft) => {
      draft.game = response.state;
      draft.server.version = response.version;
      draft.server.lastSync = response.server_time;
      draft.ui.loading = false;
    });
  }

  async function sendCommand(store, endpoint, payload) {
    const version = store.getState().server.version;
    const response = await window.App.apiFetch(endpoint, {
      method: "POST",
      body: JSON.stringify({
        ...payload,
        version,
        idempotency_key: generateKey(),
      }),
    });

    store.update((draft) => {
      draft.game = response.state;
      draft.server.version = response.version;
      draft.server.lastSync = response.server_time;
    });
  }

  function enqueueTap(store, count = 1) {
    tapQueue = Math.min(tapQueue + count, MAX_BATCH);

    if (tapTimer) return;
    tapTimer = setTimeout(async () => {
      const queued = tapQueue;
      tapQueue = 0;
      tapTimer = null;
      try {
        await sendCommand(store, "/command/tap", { count: queued });
      } catch (error) {
        if (typeof window.App?.onSyncError === "function") {
          window.App.onSyncError(error);
        } else {
          console.error(error);
        }
      }
    }, TAP_DEBOUNCE_MS);
  }

  window.App = window.App || {};
  window.App.stateSync = {
    loadState,
    sendCommand,
    enqueueTap,
  };
})();
