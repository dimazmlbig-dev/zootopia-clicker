window.MintUI = (() => {
  function formatSeconds(seconds) {
    if (!Number.isFinite(seconds)) return "—";
    if (seconds <= 0) return "0s";
    if (seconds < 60) return `${Math.round(seconds)}s`;
    const minutes = Math.floor(seconds / 60);
    const remaining = Math.round(seconds % 60);
    return `${minutes}m ${remaining}s`;
  }

  function renderStatus(state) {
    if (!state.requestId) {
      return `<div class="mint-empty">Создайте NFT, чтобы увидеть прогресс.</div>`;
    }

    return `
      <div class="mint-status">
        <div class="mint-status__row"><span>Request</span><span>${state.requestId}</span></div>
        <div class="mint-status__row"><span>Стадия</span><span>${state.message || "—"}</span></div>
        <div class="mint-status__row"><span>ETA</span><span>${formatSeconds(state.etaSeconds)}</span></div>
        <div class="mint-progress">
          <div class="mint-progress__bar"><i style="width:${state.overallProgress || 0}%"></i></div>
          <div class="mint-progress__meta">
            <span>${state.overallProgress || 0}%</span>
            <span>Stage ${state.stageProgress || 0}%</span>
          </div>
        </div>
      </div>
    `;
  }

  function screenHTML(state) {
    return `
      <div class="section mint-section">
        <div class="section__head">
          <h2>Mint</h2>
          <p>Быстрый Quick Mint или долгий Forge с анимированным артом.</p>
        </div>

        <div class="mint-controls">
          <div class="mint-modes">
            <button class="btn ${state.mode === "quick" ? "" : "ghost"}" data-mint-mode="quick">Quick Mint · 0.5 TON</button>
            <button class="btn ${state.mode === "forge" ? "" : "ghost"}" data-mint-mode="forge">Forge Mint · 5 TON</button>
          </div>
          <div class="mint-styles ${state.mode === "forge" ? "" : "is-hidden"}" id="mintStyles">
            <div class="mint-label">Style</div>
            <div class="mint-style-grid">
              ${["neon", "nature", "cyber"]
                .map(
                  (style) => `
                  <button class="btn ghost ${state.style === style ? "is-active" : ""}" data-mint-style="${style}">${style}</button>
                `
                )
                .join("")}
            </div>
          </div>
          <div class="mint-actions">
            <button class="btn" id="mintConnect">${state.wallet ? "Wallet подключен" : "Подключить кошелёк"}</button>
            <button class="btn" id="mintCreate">Create NFT</button>
          </div>
          ${state.error ? `<div class="mint-error">${state.error}</div>` : ""}
        </div>

        <div class="mint-visual">
          <div class="mint-canvas-wrap">
            <canvas id="mintCanvas"></canvas>
            <div class="mint-preview ${state.animationUrl ? "is-visible" : ""}">
              <img id="mintAnimation" src="${state.animationUrl || ""}" alt="animation" />
            </div>
          </div>
          ${renderStatus(state)}
          ${state.nftAddress ? `<div class="mint-result">NFT: ${state.nftAddress}</div>` : ""}
        </div>
      </div>
    `;
  }

  function bindActions(root, handlers) {
    root.querySelectorAll("[data-mint-mode]").forEach((btn) => {
      btn.addEventListener("click", () => handlers.onMode?.(btn.dataset.mintMode));
    });
    root.querySelectorAll("[data-mint-style]").forEach((btn) => {
      btn.addEventListener("click", () => handlers.onStyle?.(btn.dataset.mintStyle));
    });
    root.querySelector("#mintConnect")?.addEventListener("click", handlers.onConnect);
    root.querySelector("#mintCreate")?.addEventListener("click", handlers.onCreate);
  }

  return { screenHTML, bindActions };
})();
