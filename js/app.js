// js/app.js
(() => {
  const tg = window.Telegram?.WebApp;
  if (tg) {
    tg.ready();
    tg.expand();
  }

  // navigation
  function setPage(name) {
    document.querySelectorAll(".page").forEach(p => p.classList.remove("active"));
    document.getElementById(`page-${name}`).classList.add("active");

    document.querySelectorAll(".nav-btn").forEach(b => b.classList.remove("active"));
    document.querySelector(`.nav-btn[data-page="${name}"]`).classList.add("active");
  }

  function bindNav() {
    document.querySelectorAll(".nav-btn").forEach(btn => {
      btn.addEventListener("click", () => setPage(btn.dataset.page));
    });

    document.getElementById("walletTopBtn").addEventListener("click", () => setPage("wallet"));
  }

  // reliable tap handler for Telegram Android
  function bindDogTap() {
    const wrap = document.getElementById("dogWrap");

    const onTap = (e) => {
      e.preventDefault();
      e.stopPropagation();

      if (window.State.tap()) {
        window.UI.renderAll();
      } else {
        // optional: haptic
        tg?.HapticFeedback?.notificationOccurred?.("error");
      }
    };

    // pointerdown + touchstart best for Telegram Android
    wrap.addEventListener("pointerdown", onTap, { passive: false });
    wrap.addEventListener("touchstart", onTap, { passive: false });
  }

  // referrals: register + status + share + claim
  async function initReferrals() {
    await window.Backend.registerReferralIfAny();

    const st = await window.Backend.getReferralStatus();
    if (st.ok) {
      const s = window.State.get();
      s.referrals = st.referrals;
      s.referralsMax = st.max;
      s.rewardClaimed = !!st.rewardClaimed;
      window.State.save();
      window.UI.renderAll();
    }

    document.getElementById("refShareBtn").addEventListener("click", async () => {
      const uid = tg?.initDataUnsafe?.user?.id;
      if (!uid) return alert("Нет Telegram user id");

      const bot = "zooclikbot";
      const link = `https://t.me/${bot}?start=ref_${uid}`;

      try {
        await navigator.clipboard.writeText(link);
        tg?.HapticFeedback?.notificationOccurred?.("success");
        alert("Ссылка скопирована");
      } catch {
        alert(link);
      }
    });

    document.getElementById("refClaimBtn").addEventListener("click", async () => {
      const res = await window.Backend.claimReferralReward();
      if (!res.ok) return alert("Ошибка claim");

      if (!res.claimed) {
        if (res.reason === "not_enough_referrals") {
          alert(`Пока мало рефералов: ${res.referrals || 0}/5`);
          return;
        }
        alert("Награда уже получена");
        return;
      }

      const s = window.State.get();
      s.rewardClaimed = true;
      window.State.addZoo(Number(res.rewardZoo || 0));
      window.State.save();
      window.UI.renderAll();

      alert(`Награда получена: +${res.rewardZoo} $ZOO`);
    });
  }

  // splash
  function initSplash() {
    const splash = document.getElementById("splash");
    const app = document.getElementById("app");

    const video = document.getElementById("splashVideo");
    const skip = document.getElementById("splashSkip");

    video.src = "./assets/splash.mp4";
    video.play().catch(() => {});

    const finish = () => {
      splash.classList.add("hidden");
      app.classList.remove("hidden");
      startGame();
    };

    skip.addEventListener("click", finish);
    // fallback tap anywhere on splash
    splash.addEventListener("pointerdown", finish, { passive: true });
  }

  // main loop
  function startLoops() {
    // regen each second
    setInterval(() => {
      window.State.regenEnergy(1);
      window.State.save();
      window.UI.renderAll();
    }, 1000);

    // autosave
    setInterval(() => {
      window.State.save();
    }, 5000);
  }

  async function startGame() {
    window.State.init();
    bindNav();
    bindDogTap();

    await window.NFTShop.init();
    window.Tasks.init();
    window.Wallet.init();

    await initReferrals();

    window.UI.renderAll();
    startLoops();
  }

  document.addEventListener("DOMContentLoaded", initSplash);
})();