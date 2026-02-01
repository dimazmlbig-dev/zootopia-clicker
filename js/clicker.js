// js/clicker.js
(function () {
  function haptic() {
    const tg = window.Telegram?.WebApp;
    try {
      if (tg?.HapticFeedback?.impactOccurred) tg.HapticFeedback.impactOccurred("light");
      else if (navigator.vibrate) navigator.vibrate(10);
    } catch {}
  }

  function computeMood(s) {
    const p = s.energy / s.energyMax;
    if (p <= 0.15) return "angry";
    if (p <= 0.45) return "tired";
    return "happy";
  }

  function onTap(ev) {
    const s = window.State?.data;
    if (!s) return;

    // клики только на экране click
    if (s.tab !== "click") return;

    window.State.update((st) => {
      if (st.energy <= 0) return;

      st.energy = Math.max(0, st.energy - 1);
      const gain = 1 * (st.multiplier || 1);
      st.balance = (st.balance || 0) + gain;

      st.mood = computeMood(st);
    });

    // анимации
    window.UI?.dogTapAnim?.();
    haptic();

    const x = (ev.touches && ev.touches[0]) ? ev.touches[0].clientX : ev.clientX;
    const y = (ev.touches && ev.touches[0]) ? ev.touches[0].clientY : ev.clientY;
    window.UI?.spawnFloat?.(`+$1 ZOO`, x, y);
  }

  function bind() {
    const stage = document.getElementById("screen");
    if (!stage) return;

    // делегируем: ловим тап по dogStage
    document.addEventListener("click", (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t.closest("#dogStage") || t.closest("#dogWrap") || t.closest("#dogImg")) onTap(e);
    }, { passive: true });

    document.addEventListener("touchstart", (e) => {
      const t = e.target;
      if (!(t instanceof Element)) return;
      if (t.closest("#dogStage") || t.closest("#dogWrap") || t.closest("#dogImg")) onTap(e);
    }, { passive: true });
  }

  window.Clicker = { bind };
})();