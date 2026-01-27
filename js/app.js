const tg = window.Telegram?.WebApp || null;

function $(id){ return document.getElementById(id); }

/* ================= SPLASH ================= */
function initSplash(){
  const video = $("splash-video");
  const skip = $("splash-skip");
  const tap  = $("splash-tap");
  const status = $("splash-status");

  let done = false;

  const finish = () => {
    if (done) return;
    done = true;
    $("splash-screen")?.classList.add("hidden");
    $("app")?.classList.remove("hidden");
    tg?.expand?.();
  };

  skip?.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); finish(); });
  tap?.addEventListener("click", (e) => { e.preventDefault(); e.stopPropagation(); finish(); });

  if (video){
    video.onended = finish;
    video.onerror = finish;
    video.play().catch(() => {
      tap?.classList.remove("hidden");
      if (status) status.innerText = "Нажми, чтобы начать";
    });
  }

  setTimeout(finish, 9000);
}

/* ================= STATE ================= */
const State = {
  bones: 0,
  zoo: 0,
  energy: 1000,
  maxEnergy: 1000,
  level: 1,

  tonBalance: 4.25,
  zooPriceUsd: 0.0001,  // заглушка
  tonPriceUsd: 2.97,    // заглушка

  walletShort: "UQCJ…6Yes",
  walletFull: "UQCJ...6Yes", // заглушка
};

function fmt(n){
  const x = Number(n);
  if (Number.isNaN(x)) return "0";
  if (Math.abs(x) >= 1_000_000) return (x/1_000_000).toFixed(2) + "M";
  if (Math.abs(x) >= 1_000) return (x/1_000).toFixed(2) + "K";
  return String(x);
}

function usd(n){ return "≈ $" + Number(n).toFixed(2); }

/* ================= UI ================= */
function updateTop(){
  $("bones-count").innerText = fmt(State.bones);
  $("zoo-count").innerText = fmt(State.zoo);
  $("wallet-addr").innerText = State.walletShort;
}

function updateEnergy(){
  $("energy-text").innerText = `${Math.floor(State.energy)} / ${State.maxEnergy}`;
  $("energy-fill").style.width = (State.energy / State.maxEnergy * 100) + "%";
  $("lvl").innerText = String(State.level);
}

function updateWallet(){
  $("wallet-addr-full").innerText = State.walletFull;
  $("receive-addr").innerText = State.walletFull;

  $("zoo-balance").innerText = fmt(State.zoo);
  $("ton-balance").innerText = Number(State.tonBalance).toFixed(2);

  const zooUsd = State.zoo * State.zooPriceUsd;
  const tonUsd = State.tonBalance * State.tonPriceUsd;

  $("zoo-usd").innerText = usd(zooUsd);
  $("ton-usd").innerText = usd(tonUsd);
}

function renderTx(){
  const list = $("tx-list");
  if (!list) return;

  // заглушки активности
  const txs = [
    { title: "Receive ZOO", sub: "From TG user", amt: "+0.025 ZOO" },
    { title: "Send TON", sub: "To UQ…aVFr", amt: "-2.10 TON" },
    { title: "Receive TON", sub: "From UQ…z9Q", amt: "+2.50 TON" },
  ];

  list.innerHTML = txs.map(t => `
    <div class="tx-row">
      <div class="tx-left">
        <div class="tx-title">${t.title}</div>
        <div class="tx-sub">${t.sub}</div>
      </div>
      <div class="tx-amt">${t.amt}</div>
    </div>
  `).join("");
}

/* ================= CLICKER ================= */
function initClicker(){
  $("tap-zone")?.addEventListener("click", () => {
    if (State.energy <= 0) return;

    State.energy -= 1;
    State.bones += 1;

    // если хочешь: часть в ZOO за тап
    // State.zoo += 0.01;

    updateTop();
    updateEnergy();

    const img = $("dog-img");
    img?.classList.add("tap");
    setTimeout(() => img?.classList.remove("tap"), 120);
  });
}

/* ================= ENERGY REGEN ================= */
let regenStarted = false;
function startRegen(){
  if (regenStarted) return;
  regenStarted = true;

  setInterval(() => {
    if (State.energy < State.maxEnergy) {
      State.energy = Math.min(State.maxEnergy, State.energy + 1);
      updateEnergy();
    }
  }, 1000);
}

/* ================= WALLET MODAL ================= */
function openWallet(){
  const modal = $("wallet-modal");
  const recv = $("receive-panel");
  const send = $("send-panel");

  recv?.classList.add("hidden");
  send?.classList.add("hidden");

  modal?.classList.remove("hidden");
  modal?.setAttribute("aria-hidden", "false");

  updateWallet();
  renderTx();

  tg?.HapticFeedback?.impactOccurred?.("light");
}

function closeWallet(){
  const modal = $("wallet-modal");
  modal?.classList.add("hidden");
  modal?.setAttribute("aria-hidden", "true");
}

function initWalletModal(){
  const open1 = $("open-wallet");
  const open2 = $("open-wallet-2");

  open1?.addEventListener("click", openWallet);
  open2?.addEventListener("click", openWallet);

  open1?.addEventListener("keydown", (e) => {
    if (e.key === "Enter" || e.key === " ") openWallet();
  });

  $("wallet-close")?.addEventListener("click", closeWallet);
  $("wallet-backdrop")?.addEventListener("click", closeWallet);

  // ESC close (на десктопе)
  window.addEventListener("keydown", (e) => {
    if (e.key === "Escape") closeWallet();
  });

  // send/receive panels
  $("btn-receive")?.addEventListener("click", () => {
    $("send-panel")?.classList.add("hidden");
    $("receive-panel")?.classList.remove("hidden");
    tg?.HapticFeedback?.impactOccurred?.("light");
  });

  $("btn-send")?.addEventListener("click", () => {
    $("receive-panel")?.classList.add("hidden");
    $("send-panel")?.classList.remove("hidden");
    tg?.HapticFeedback?.impactOccurred?.("light");
  });

  $("copy-addr")?.addEventListener("click", async () => {
    const text = State.walletFull;
    try {
      await navigator.clipboard.writeText(text);
      tg?.HapticFeedback?.notificationOccurred?.("success");
    } catch {
      // fallback
      const ta = document.createElement("textarea");
      ta.value = text;
      document.body.appendChild(ta);
      ta.select();
      document.execCommand("copy");
      ta.remove();
    }
  });

  $("send-confirm")?.addEventListener("click", () => {
    tg?.HapticFeedback?.notificationOccurred?.("warning");
    alert("Отправка пока заглушка. В шаге 3 подключим TonConnect и реальные транзакции.");
  });
}

/* ================= BOTTOM NAV (simple) ================= */
function initNav(){
  const btns = document.querySelectorAll(".bottom-pill .nav-btn");
  btns.forEach(b => b.addEventListener("click", () => {
    btns.forEach(x => x.classList.remove("active"));
    b.classList.add("active");
    tg?.HapticFeedback?.impactOccurred?.("soft");
  }));
}

/* ================= START ================= */
window.addEventListener("load", () => {
  tg?.ready?.();
  tg?.expand?.();

  // Заглушка адреса из Telegram user id (чтобы у разных юзеров было разное)
  const u = tg?.initDataUnsafe?.user;
  if (u?.id) {
    State.walletFull = `TG:${u.id} (stub)`;
    State.walletShort = `TG:${String(u.id).slice(0,4)}…`;
  }

  initSplash();
  initClicker();
  initWalletModal();
  initNav();

  startRegen();
  updateTop();
  updateEnergy();
});