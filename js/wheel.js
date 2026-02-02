window.Wheel = (() => {
  const walletAddress = "UQCJRRRYnrs_qsA2AgIE71dPsHf_-AKaZV9UMeT4vBbh6Yes";
  const spinCostRub = 20;
  const freeAttemptsPerDay = 3;
  const storageKey = "zooWheelState";
  const segments = [
    { label: "+10 ZOO", value: 10, weight: 38 },
    { label: "+20 ZOO", value: 20, weight: 24 },
    { label: "+50 ZOO", value: 50, weight: 16 },
    { label: "+80 ZOO", value: 80, weight: 10 },
    { label: "+150 ZOO", value: 150, weight: 6 },
    { label: "+300 ZOO", value: 300, weight: 4 },
    { label: "+500 ZOO", value: 500, weight: 1.6 },
    { label: "+1000 ZOO", value: 1000, weight: 0.4 },
  ];
  const colors = ["#ffb86b", "#6ee7ff", "#a78bfa", "#f472b6", "#facc15", "#34d399", "#fb7185", "#60a5fa"];

  let canvas;
  let ctx;
  let rotation = 0;
  let spinning = false;
  let tonRateRub = null;

  function todayKey() {
    return new Date().toISOString().slice(0, 10);
  }

  function loadState() {
    const raw = localStorage.getItem(storageKey);
    if (!raw) return { date: todayKey(), freeUsed: 0, paidCredits: 0 };
    try {
      const parsed = JSON.parse(raw);
      if (parsed.date !== todayKey()) {
        return { date: todayKey(), freeUsed: 0, paidCredits: 0 };
      }
      return { ...parsed };
    } catch (err) {
      return { date: todayKey(), freeUsed: 0, paidCredits: 0 };
    }
  }

  function saveState(state) {
    localStorage.setItem(storageKey, JSON.stringify(state));
  }

  let attemptState = loadState();

  function freeLeft() {
    return Math.max(0, freeAttemptsPerDay - attemptState.freeUsed);
  }

  function consumeAttempt() {
    if (freeLeft() > 0) {
      attemptState.freeUsed += 1;
      saveState(attemptState);
      return { type: "free" };
    }
    if (attemptState.paidCredits > 0) {
      attemptState.paidCredits -= 1;
      saveState(attemptState);
      return { type: "paid" };
    }
    return null;
  }

  function addPaidCredit() {
    attemptState.paidCredits += 1;
    saveState(attemptState);
  }

  function updateAttemptsUI() {
    const attemptsEl = document.getElementById("wheelAttempts");
    const statusEl = document.getElementById("wheelStatus");
    if (attemptsEl) {
      attemptsEl.textContent = `Бесплатно: ${freeLeft()}/${freeAttemptsPerDay} • Платные: ${attemptState.paidCredits}`;
    }
    if (statusEl) {
      if (freeLeft() > 0) {
        statusEl.textContent = `Доступно ${freeLeft()} бесплатных попытки(ок) сегодня.`;
      } else if (attemptState.paidCredits > 0) {
        statusEl.textContent = "Используйте купленную попытку.";
      } else {
        statusEl.textContent = "Бесплатные попытки закончились. Можно купить новую.";
      }
    }
  }

  function updatePaymentUI() {
    const tonEl = document.getElementById("wheelTon");
    const walletEl = document.getElementById("wheelWallet");
    if (walletEl) walletEl.textContent = walletAddress;
    if (!tonEl) return;
    if (!tonRateRub) {
      tonEl.textContent = "...";
      return;
    }
    const tonAmount = spinCostRub / tonRateRub;
    tonEl.textContent = tonAmount.toFixed(4);
  }

  async function fetchTonRate() {
    try {
      const res = await fetch("https://api.coingecko.com/api/v3/simple/price?ids=the-open-network&vs_currencies=rub");
      if (!res.ok) throw new Error("Rate fetch failed");
      const data = await res.json();
      tonRateRub = data?.["the-open-network"]?.rub || null;
      updatePaymentUI();
    } catch (err) {
      tonRateRub = null;
      updatePaymentUI();
    }
  }

  function pickWeightedIndex() {
    const total = segments.reduce((sum, seg) => sum + seg.weight, 0);
    let roll = Math.random() * total;
    for (let i = 0; i < segments.length; i += 1) {
      roll -= segments[i].weight;
      if (roll <= 0) return i;
    }
    return segments.length - 1;
  }

  function drawWheel() {
    if (!ctx) return;
    const { width, height } = canvas;
    const radius = Math.min(width, height) / 2 - 8;
    ctx.clearRect(0, 0, width, height);
    ctx.save();
    ctx.translate(width / 2, height / 2);
    ctx.rotate(rotation);
    const arc = (Math.PI * 2) / segments.length;
    for (let i = 0; i < segments.length; i += 1) {
      const start = i * arc - Math.PI / 2;
      const end = start + arc;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, start, end);
      ctx.closePath();
      ctx.fillStyle = colors[i % colors.length];
      ctx.fill();
      ctx.strokeStyle = "rgba(255,255,255,0.5)";
      ctx.lineWidth = 2;
      ctx.stroke();

      ctx.save();
      ctx.rotate(start + arc / 2);
      ctx.textAlign = "right";
      ctx.fillStyle = "#0f172a";
      ctx.font = "600 14px system-ui, -apple-system, sans-serif";
      ctx.fillText(segments[i].label, radius - 14, 6);
      ctx.restore();
    }
    ctx.beginPath();
    ctx.arc(0, 0, 26, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(15, 16, 35, 0.85)";
    ctx.fill();
    ctx.restore();
  }

  function animateSpin(targetRotation, durationMs) {
    const start = performance.now();
    const initial = rotation;
    const delta = targetRotation - initial;

    function easeOutCubic(t) {
      return 1 - Math.pow(1 - t, 3);
    }

    function step(now) {
      const elapsed = now - start;
      const t = Math.min(1, elapsed / durationMs);
      rotation = initial + delta * easeOutCubic(t);
      drawWheel();
      if (t < 1) {
        requestAnimationFrame(step);
      }
    }
    requestAnimationFrame(step);
  }

  function handleSpin() {
    if (spinning) return;
    const attempt = consumeAttempt();
    updateAttemptsUI();
    if (!attempt) return;

    spinning = true;
    const pickedIndex = pickWeightedIndex();
    const arc = (Math.PI * 2) / segments.length;
    const spins = 6;
    const targetRotation = (Math.PI * 2 * spins) - (pickedIndex * arc + arc / 2);
    const duration = 4200;
    animateSpin(targetRotation, duration);

    const statusEl = document.getElementById("wheelStatus");
    if (statusEl) {
      statusEl.textContent = attempt.type === "free" ? "Бесплатная попытка..." : "Платная попытка...";
    }

    setTimeout(() => {
      const reward = segments[pickedIndex].value;
      window.State?.update?.((s) => {
        s.balance += reward;
      });
      spinning = false;
      if (statusEl) {
        statusEl.textContent = `Вы выиграли ${reward} ZOO!`;
      }
      updateAttemptsUI();
    }, duration + 100);
  }

  function handlePay() {
    const statusEl = document.getElementById("wheelStatus");
    let tonAmount = null;
    if (tonRateRub) {
      tonAmount = spinCostRub / tonRateRub;
    }
    if (!tonAmount || Number.isNaN(tonAmount)) {
      if (statusEl) statusEl.textContent = "Не удалось получить курс TON. Попробуйте позже.";
      return;
    }
    const amountNano = Math.max(1, Math.round(tonAmount * 1e9));
    const link = `ton://transfer/${walletAddress}?amount=${amountNano}&text=Wheel%20spin%20for%20Zootopia`;
    window.open(link, "_blank");
    addPaidCredit();
    updateAttemptsUI();
    if (statusEl) {
      statusEl.textContent = "Оплата открыта. Попытка добавлена после перевода.";
    }
  }

  function init() {
    canvas = document.getElementById("wheelCanvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");
    rotation = 0;
    drawWheel();
    updateAttemptsUI();
    updatePaymentUI();

    const spinBtn = document.getElementById("wheelSpin");
    const payBtn = document.getElementById("wheelPay");
    spinBtn?.addEventListener("click", handleSpin);
    payBtn?.addEventListener("click", handlePay);
    fetchTonRate();
  }

  return { init };
})();
