// js/ui.js
window.UI = (() => {
  function byId(id) { return document.getElementById(id); }

  function renderAll() {
    const s = window.State.get();

    byId("bonesText").textContent = String(s.bones);
    byId("zooText").textContent = String(s.zoo);

    byId("energyText").textContent = String(Math.floor(s.energy));
    byId("maxEnergyText").textContent = String(Math.floor(s.maxEnergy));

    const pct = s.maxEnergy ? (s.energy / s.maxEnergy) * 100 : 0;
    byId("energyFill").style.width = `${Math.max(0, Math.min(100, pct))}%`;

    // referrals
    byId("refProgress").textContent = `${s.referrals}/${s.referralsMax}`;

    // share link
    const tg = window.Telegram?.WebApp;
    const uid = tg?.initDataUnsafe?.user?.id;
    const bot = "zooclikbot"; // твой бот username
    const link = uid ? `https://t.me/${bot}?start=ref_${uid}` : "";
    byId("refLinkText").textContent = link;

    // wallet
    byId("walletAddr").textContent = s.walletAddress || "—";
    byId("walletTon").textContent = s.walletAddress ? formatTon(s.tonBalanceNano) : "—";

    // overlays
    window.NFTShop?.renderEquippedOverlay();
  }

  function formatTon(nano) {
    const ton = nano / 1e9;
    return `${ton.toFixed(4)} TON`;
  }

  return { renderAll };
})();