window.Splash = (() => {
  let finishCb = null;
  let finishRequested = false;

  function onFinish(cb) {
    finishCb = cb;
    if (finishRequested && finishCb) finishCb();
  }

  function finish() {
    finishRequested = true;
    if (finishCb) finishCb();
  }

  function init() {
    const splash = document.getElementById("splash");
    const video = document.getElementById("splashVideo");
    const btnSkip = document.getElementById("splashSkip");
    const btnStart = document.getElementById("splashStart");

    const tryPlay = async () => {
      try { await video.play(); } catch (_) {}
    };

    // если тапнули раньше — finish все равно сработает
    const startNow = () => {
      splash.classList.add("hidden");
      finish();
    };

    btnSkip.addEventListener("click", startNow);
    btnStart.addEventListener("click", startNow);

    // тап по экрану
    splash.addEventListener("pointerdown", (e) => {
      e.preventDefault();
      startNow();
    }, { passive: false });

    tryPlay();
  }

  return { init, onFinish };
})();