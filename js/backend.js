// js/backend.js
window.Backend = (() => {
  // твой worker URL:
  const BASE = "https://zootopia-backend.dimazmlbig.workers.dev";

  function tgInitData() {
    const tg = window.Telegram?.WebApp;
    return tg?.initData || "";
  }

  function tgStartParam() {
    const tg = window.Telegram?.WebApp;
    // у Telegram WebApp бывает initDataUnsafe.start_param
    const p = tg?.initDataUnsafe?.start_param || "";
    return p;
  }

  async function post(path, body) {
    const r = await fetch(`${BASE}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    return r.json();
  }

  async function registerReferralIfAny() {
    const initData = tgInitData();
    if (!initData) return { ok: false, reason: "no_initData" };

    const ref = tgStartParam(); // e.g. "ref_123"
    return post("/api/ref/register", { initData, ref });
  }

  async function getReferralStatus() {
    const initData = tgInitData();
    return post("/api/ref/status", { initData });
  }

  async function claimReferralReward() {
    const initData = tgInitData();
    return post("/api/ref/claim", { initData });
  }

  async function getTonBalance(address) {
    const u = new URL(`${BASE}/api/ton/balance`);
    u.searchParams.set("address", address);
    const r = await fetch(u.toString());
    return r.json();
  }

  return {
    registerReferralIfAny,
    getReferralStatus,
    claimReferralReward,
    getTonBalance,
  };
})();