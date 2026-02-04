window.MintCanvas = (() => {
  function mulberry32(a) {
    return function () {
      let t = (a += 0x6d2b79f5);
      t = Math.imul(t ^ (t >>> 15), t | 1);
      t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
      return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
    };
  }

  function hashSeed(seed) {
    let h = 2166136261;
    for (let i = 0; i < seed.length; i += 1) {
      h ^= seed.charCodeAt(i);
      h = Math.imul(h, 16777619);
    }
    return h >>> 0;
  }

  function buildRevealOrder(cols, rows, seed) {
    const total = cols * rows;
    const order = Array.from({ length: total }, (_, i) => i);
    const rand = mulberry32(seed);
    for (let i = total - 1; i > 0; i -= 1) {
      const j = Math.floor(rand() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    return order;
  }

  function create(canvas, options = {}) {
    const ctx = canvas.getContext("2d");
    const pixelSize = options.pixelSize || 6;
    const seed = hashSeed(options.seed || "zootopia");
    let revealOrder = [];
    let revealCols = 0;
    let revealRows = 0;
    let revealProgress = 0;
    let seeded = false;
    let flashUntil = 0;
    let imageBitmap = null;
    let placeholderGradient = null;

    function resize() {
      const rect = canvas.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.floor(rect.width * ratio);
      canvas.height = Math.floor(rect.height * ratio);
      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      revealCols = Math.max(1, Math.floor(rect.width / pixelSize));
      revealRows = Math.max(1, Math.floor(rect.height / pixelSize));
      revealOrder = buildRevealOrder(revealCols, revealRows, seed);
      placeholderGradient = null;
      draw();
    }

    function buildPlaceholder() {
      if (placeholderGradient) return placeholderGradient;
      const gradient = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
      gradient.addColorStop(0, "#2b2143");
      gradient.addColorStop(0.5, "#143040");
      gradient.addColorStop(1, "#1c1c3f");
      placeholderGradient = gradient;
      return gradient;
    }

    function drawNoise() {
      const w = canvas.width;
      const h = canvas.height;
      const imageData = ctx.createImageData(w, h);
      for (let i = 0; i < imageData.data.length; i += 4) {
        const value = Math.floor(Math.random() * 80);
        imageData.data[i] = value;
        imageData.data[i + 1] = value + 10;
        imageData.data[i + 2] = value + 20;
        imageData.data[i + 3] = 255;
      }
      ctx.putImageData(imageData, 0, 0);
    }

    function drawImageReveal() {
      const rect = canvas.getBoundingClientRect();
      ctx.clearRect(0, 0, rect.width, rect.height);
      ctx.fillStyle = buildPlaceholder();
      ctx.fillRect(0, 0, rect.width, rect.height);

      if (!seeded) {
        ctx.globalAlpha = 0.45;
        drawNoise();
        ctx.globalAlpha = 1;
      }

      if (!imageBitmap) return;

      const revealCount = Math.floor(revealOrder.length * revealProgress);
      for (let i = 0; i < revealCount; i += 1) {
        const index = revealOrder[i];
        const col = index % revealCols;
        const row = Math.floor(index / revealCols);
        const x = col * pixelSize;
        const y = row * pixelSize;
        ctx.drawImage(
          imageBitmap,
          (col / revealCols) * imageBitmap.width,
          (row / revealRows) * imageBitmap.height,
          imageBitmap.width / revealCols,
          imageBitmap.height / revealRows,
          x,
          y,
          pixelSize,
          pixelSize
        );
      }

      if (Date.now() < flashUntil) {
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.fillRect(0, 0, rect.width, rect.height);
      }
    }

    function draw() {
      drawImageReveal();
    }

    async function setImage(url) {
      if (!url) return;
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = url;
      await img.decode();
      imageBitmap = img;
      draw();
    }

    function setProgress(overall, isSeeded) {
      const clamped = Math.max(0, Math.min(100, overall || 0));
      revealProgress = clamped / 100;
      seeded = Boolean(isSeeded);
      draw();
    }

    function flash() {
      flashUntil = Date.now() + 400;
      draw();
    }

    window.addEventListener("resize", resize);
    resize();

    return {
      setImage,
      setProgress,
      flash,
    };
  }

  return { create };
})();
