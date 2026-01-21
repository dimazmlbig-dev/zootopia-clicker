// ===== Telegram Wrapper (safe) =====
const tg = window.Telegram?.WebApp || null;

function initTelegram() {
  if (!tg) {
    console.log("Открыто вне Telegram");
    return;
  }

  tg.ready();
  tg.expand?.();

  // по желанию
  tg.disableVerticalSwipes?.();

  const user = tg.initDataUnsafe?.user;
  if (user) {
    const nameEl = document.getElementById("user-name");
    if (nameEl) nameEl.innerText = user.first_name || "Игрок";

    // refCode по user.id (если нет)
    const s = State.get();
    if (!s.refCode && user.id) {
      s.refCode = String(user.id);
      State.save(); // сразу сохраним
    }
  }
}

// Splash → игра
function showGame() {
  const splash = document.getElementById("splash-screen");
  const main = document.getElementById("main-content");

  if (splash) splash.style.display = "none";
  if (main) main.classList.remove("hidden");
}

// События UI
function bindUI() {
  document.getElementById("tap-zone")?.addEventListener("click", () => {
    Clicker.tap();
  });

  document.getElementById("share-ref-btn")?.addEventListener("click", () => {
    ReferralManager.shareReferral();
  });

  document.getElementById("collect-btn")?.addEventListener("click", () => {
    Mining.collect();
  });

  // Tabs (если используешь active+hidden)
  document.querySelectorAll(".tab").forEach((btn) => {
    btn.addEventListener("click", () => {
      const tabName = btn.dataset.tab;

      document.querySelectorAll(".tab").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      document.querySelectorAll(".tab-content").forEach((c) => {
        c.classList.remove("active");
        c.classList.add("hidden");
      });

      const target = document.getElementById(`tab-${tabName}`);
      if (target) {
        target.classList.add("active");
        target.classList.remove("hidden");
      }
    });
  });
}

// Автосейв
function startAutosave() {
  setInterval(() => {
    try {
      State.save();
    } catch (e) {
      console.warn("Autosave error:", e);
    }
  }, 3000);
}

// Запуск игры
function startGame() {
  initTelegram();
  bindUI();

  ReferralManager.claimReferralBonus?.();

  Energy.start?.();
  startAutosave();

  UI.updateBalance?.();
  UI.updateEnergy?.();
  UI.updateReferral?.();

  showGame();
}

// ENTRY POINT
window.addEventListener("load", startGame);
