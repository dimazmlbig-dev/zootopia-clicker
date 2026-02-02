// js/audio.js
(function () {
  const PREF_KEY = "zoo_audio_enabled";
  const melody = [
    { freq: 261.63, duration: 0.22 }, // C4
    { freq: 329.63, duration: 0.22 }, // E4
    { freq: 392.0, duration: 0.22 }, // G4
    { freq: 523.25, duration: 0.28 }, // C5
    { freq: 392.0, duration: 0.22 },
    { freq: 329.63, duration: 0.22 },
  ];

  let ctx;
  let masterGain;
  let musicGain;
  let sfxGain;
  let musicTimer;
  let musicStep = 0;
  let started = false;
  let enabled = localStorage.getItem(PREF_KEY) !== "off";

  function ensureContext() {
    if (!ctx) {
      ctx = new (window.AudioContext || window.webkitAudioContext)();
      masterGain = ctx.createGain();
      masterGain.gain.value = 0.8;
      masterGain.connect(ctx.destination);

      musicGain = ctx.createGain();
      musicGain.gain.value = 0.28;
      musicGain.connect(masterGain);

      sfxGain = ctx.createGain();
      sfxGain.gain.value = 0.7;
      sfxGain.connect(masterGain);
    }
    if (ctx.state === "suspended") {
      ctx.resume();
    }
  }

  function playTone({ freq, duration, gain, type = "sine", target = sfxGain, detune = 0 }) {
    if (!ctx || !enabled) return;
    const osc = ctx.createOscillator();
    const g = ctx.createGain();
    osc.type = type;
    osc.frequency.value = freq;
    osc.detune.value = detune;
    g.gain.value = 0.0001;
    osc.connect(g);
    g.connect(target);
    const now = ctx.currentTime;
    g.gain.linearRampToValueAtTime(gain, now + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    osc.start(now);
    osc.stop(now + duration + 0.05);
  }

  function startMusic() {
    if (!enabled || !ctx) return;
    if (musicTimer) return;
    const tempo = 110;
    const beat = (60 / tempo) * 1000;
    musicTimer = window.setInterval(() => {
      if (!enabled || !ctx) return;
      const note = melody[musicStep % melody.length];
      musicStep += 1;
      playTone({
        freq: note.freq,
        duration: note.duration,
        gain: 0.12,
        type: "triangle",
        target: musicGain,
      });
    }, beat);
  }

  function stopMusic() {
    if (musicTimer) {
      window.clearInterval(musicTimer);
      musicTimer = null;
    }
  }

  function setEnabled(value) {
    enabled = Boolean(value);
    localStorage.setItem(PREF_KEY, enabled ? "on" : "off");
    if (!enabled) {
      stopMusic();
    } else {
      ensureContext();
      startMusic();
    }
    updateToggle();
  }

  function toggle() {
    setEnabled(!enabled);
  }

  function updateToggle() {
    document.querySelectorAll("#audioToggle").forEach((btn) => {
      btn.textContent = enabled ? "Музыка: Вкл" : "Музыка: Выкл";
      btn.classList.toggle("is-off", !enabled);
    });
  }

  function init() {
    if (started) return;
    started = true;
    ensureContext();
    if (enabled) startMusic();
    updateToggle();
  }

  function bindToggle() {
    document.querySelectorAll("#audioToggle").forEach((btn) => {
      btn.removeEventListener("click", toggle);
      btn.addEventListener("click", () => {
        ensureContext();
        toggle();
      });
    });
    updateToggle();
  }

  function playSwap(success) {
    ensureContext();
    playTone({
      freq: success ? 420 : 220,
      duration: 0.12,
      gain: 0.18,
      type: success ? "square" : "sawtooth",
    });
  }

  function playMatch(chain = 1) {
    ensureContext();
    const base = 320 + chain * 40;
    playTone({ freq: base, duration: 0.16, gain: 0.22, type: "sine" });
    playTone({ freq: base * 1.25, duration: 0.18, gain: 0.12, type: "triangle", detune: 8 });
  }

  function playPower() {
    ensureContext();
    playTone({ freq: 520, duration: 0.22, gain: 0.2, type: "square" });
    playTone({ freq: 260, duration: 0.25, gain: 0.18, type: "sawtooth" });
  }

  function playShuffle() {
    ensureContext();
    playTone({ freq: 300, duration: 0.12, gain: 0.12, type: "triangle" });
  }

  function playLevelUp() {
    ensureContext();
    playTone({ freq: 440, duration: 0.14, gain: 0.22, type: "triangle" });
    playTone({ freq: 660, duration: 0.2, gain: 0.18, type: "triangle" });
    playTone({ freq: 880, duration: 0.24, gain: 0.14, type: "triangle" });
  }

  window.AudioFX = {
    init,
    bindToggle,
    playSwap,
    playMatch,
    playPower,
    playShuffle,
    playLevelUp,
  };
})();
