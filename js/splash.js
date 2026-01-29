// js/splash.js — сплеш, который гарантированно завершится даже если onFinish назначили позже

window.SplashController = (() => {
  const el = {
    root: document.getElementById("splash"),
    video: document.getElementById("splash-video"),
    skip: document.getElementById("splash-skip"),
    tap: document.getElementById("splash-tap")
  };

  let finished = false;
  let finishCb = null;

  function finish() {
    if (finished) return;
    finished = true;
    try { el.video?.pause(); } catch {}
    el.root?.classList.add("hidden");
    if (typeof finishCb === "function") finishCb();
  }

  function onFinish(cb) {
    finishCb = cb;
    if (finished && typeof finishCb === "function") finishCb();
  }

  function init() {
    // кнопки
    const onAny = (e) => { e.preventDefault(); e.stopPropagation(); finish(); };

    el.skip?.addEventListener("click", onAny);
    el.tap?.addEventListener("click", onAny);

    // если видео загрузилось — пробуем play (на мобиле может не стартануть, это нормально)
    try {
      if (el.video) {
        el.video.muted = true;
        el.video.playsInline = true;
        el.video.loop = true;
        const p = el.video.play();
        if (p && typeof p.catch === "function") p.catch(() => {});
      }
    } catch {}

    // fallback: если юзер ничего не нажимает — автозавершим
    setTimeout(() => finish(), 4500);
  }

  init();

  return { onFinish, finish };
})();