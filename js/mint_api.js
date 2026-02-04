window.MintAPI = (() => {
  const FALLBACK_BASE = "https://zootopia-backend.dimazmlbig.workers.dev";

  function getApiBase() {
    return window.API_BASE || localStorage.getItem("zoo_api_base") || FALLBACK_BASE;
  }

  async function getJson(url) {
    const res = await fetch(url);
    return res.json();
  }

  async function postJson(path, body) {
    const res = await fetch(`${getApiBase()}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return res.json();
  }

  function prepareMint({ wallet, mode, style }) {
    return postJson("/mint/prepare", { wallet, mode, style });
  }

  function getStatus(requestId) {
    const url = new URL(`${getApiBase()}/mint/status`);
    url.searchParams.set("request_id", requestId);
    return getJson(url.toString());
  }

  return { prepareMint, getStatus };
})();
