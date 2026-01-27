function $(id) {
  return document.getElementById(id);
}

const tg = window.Telegram?.WebApp || null;

/* ================= SPLASH ================= */

function initSplash() {
  const video = $("splash-video");
  const skip = $("splash-skip");
  const tap = $("splash-tap");

  let finished = false;

  function finish() {
    if (finished) return;
    finished = true;

    $("splash-screen")?.classList.add("hidden");

    const main = $("main-content");
    if (main) {
      main.classList.remove("hidden");
      main.style.display = "flex";
    }

    tg?.expand?.();
  }

  skip.addEventListener("click", (e) => {
    e.preventDefault();
    e.stopPropagation();
    finish();
  });

  tap.addEventListener("click", finish);

  if (video) {
    video.onended = finish;
    video.onerror = finish;

    video.play().catch(() => {
      tap.classList.remove("hidden");
      $("splash-status").innerText = "Нажми, чтобы начать";
    });
  }

  setTimeout(finish, 8000); // safety
}

/* ================= STATE ================= */

const State = {
  bones: 0,
  zoo: 0,
  energy: 100,
  maxEnergy: 100,
};

/* ================= UI ================= */

function updateUI() {
  $("bones-count").innerText = State.bones;
  $("zoo-count").innerText = State.zoo;

  $("energy-text").innerText =
    `${State.energy} / ${State.maxEnergy}`;

  $("energy-fill").style.width =
    (State.energy / State.maxEnergy) * 100 + "%";
}

/* ================= ENERGY ================= */

setInterval(() => {
  if (State.energy < State.maxEnergy) {
    State.energy++;
    updateUI();
  }
}, 1000);

/* ================= CLICKER ================= */

function initClicker() {
  $("tap-zone").addEventListener("click", () => {
    if (State.energy <= 0) return;

    State.energy--;
    State.bones++;

    updateUI();

    const img = $("dog-img");
    img.classList.add("tap");
    setTimeout(() => img.classList.remove("tap"), 120);
  });
}

/* ================= NAV ================= */

function initNav() {
  const buttons = document.querySelectorAll(".nav-btn");
  buttons.forEach((btn) => {
    btn.addEventListener("click", () => {
      buttons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
    });
  });
}

/* ================= START ================= */

window.addEventListener("load", () => {
  tg?.ready?.();
  initSplash();
  initClicker();
  initNav();
  updateUI();
});