import { setText } from "./ui.js";

export function initWallet(workerBaseUrl) {
  const input = document.getElementById("tonAddressInput");
  const btn = document.getElementById("refreshTonBtn");

  if (!input || !btn) return;

  const saved = localStorage.getItem("ton_address");
  if (saved) input.value = saved;

  btn.addEventListener("click", async () => {
    const address = (input.value || "").trim();
    if (!address) {
      alert("Вставь TON адрес (обычно начинается с EQ...)");
      return;
    }

    localStorage.setItem("ton_address", address);
    setText("tonBalance", "…");

    try {
      const url = `${workerBaseUrl}/api/ton/balance?address=${encodeURIComponent(address)}`;
      const r = await fetch(url);
      const data = await r.json().catch(() => null);

      if (!r.ok || !data?.ok) {
        setText("tonBalance", "Ошибка");
        console.log("TON balance error:", r.status, data);
        alert("Не удалось получить баланс (см. console).");
        return;
      }

      const ton = (Number(data.balanceNano || 0) / 1e9).toFixed(4);
      setText("tonBalance", `${ton} TON`);
    } catch (e) {
      console.log(e);
      setText("tonBalance", "Ошибка");
      alert("Ошибка сети или Worker.");
    }
  });
}