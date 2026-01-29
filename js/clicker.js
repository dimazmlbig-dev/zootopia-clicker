window.Clicker = (() => {
  function build() {
    const root = document.getElementById("page-clicker");
    if (!root) return;

    root.innerHTML = `
      <div class="card">
        <div class="h1">Энергия</div>
        <div class="row">
          <div class="muted">Осталось</div>
          <div style="font-weight:900" id="uiEnergyText">0/0</div>
        </div>
        <div style="height:10px"></div>
        <div class="progress"><div id="uiEnergyBar"></div></div>
      </div>

      <div class="card">
        <div class="h1">Кликер</div>
        <div class="muted">Тапай по собаке → получай Bones (тратит энергию).</div>
        <div class="tap-area">
          <div id="tapZone">
            <img src="./assets/dog_idle.png" alt="Dog">
          </div>
          <div class="muted">+1 Bone за тап (стоимость: 1 энергия)</div>
        </div>
      </div>

      <div class="card">
        <div class="h1">Майнинг</div>
        <div class="row">
          <div class="muted">Доступно</div>
          <div style="font-weight:900" id="uiMineAvail">0</div>
        </div>
        <div class="row" style="margin-top:10px">
          <button id="btnCollect" class="btn btn--primary">Собрать</button>
          <button id="btnUpgradeMine" class="btn btn--ghost">Улучшить</button>
        </div>
        <div class="muted" style="margin-top:8px" id="uiMineInfo">—</div>
      </div>

      <div class="card">
        <div class="h1">Рефералка</div>
        <div class="muted">Твой код: <b id="uiRefCode"></b></div>
        <div class="sep"></div>
        <button id="btnShare" class="btn btn--primary">Поделиться</button>
        <div class="muted" style="margin-top:10px;word-break:break-all" id="uiRefLink"></div>
      </div>
    `;

    // tap handlers (pointerdown first, plus touchstart fallback)
    const tapZone = root.querySelector("#tapZone");

    const onTap = (ev) => {
      ev.preventDefault();

      const s = window.State.get();
      if (!window.Energy.canSpend(1)) return;

      window.Energy.spend(1);
      s.bones += 1;
      s.tapsTotal = (s.tapsTotal || 0) + 1;

      // FX dot
      const rect = tapZone.getBoundingClientRect();
      const x = (ev.touches && ev.touches[0] ? ev.touches[0].clientX : ev.clientX) - rect.left;
      const y = (ev.touches && ev.touches[0] ? ev.touches[0].clientY : ev.clientY) - rect.top;
      const dot = document.createElement("div");
      dot.className = "tap-fx";
      dot.style.left = x + "px";
      dot.style.top = y + "px";
      tapZone.appendChild(dot);
      setTimeout(() => dot.remove(), 500);

      window.UI.renderTop();
      window.UI.renderClicker();

      // save throttled (чуть позже)
      window.UI.scheduleSave();
    };

    tapZone.addEventListener("pointerdown", onTap, { passive: false });
    tapZone.addEventListener("touchstart", onTap, { passive: false });

    root.querySelector("#btnCollect").addEventListener("click", () => window.Mining.collect());
    root.querySelector("#btnUpgradeMine").addEventListener("click", () => {
      const s = window.State.get();
      const cost = window.Mining.upgradeCost(s.mining.level);
      if (s.zoo < cost) return alert("Не хватает $ZOO");
      window.Mining.upgrade();
    });

    root.querySelector("#btnShare").addEventListener("click", () => window.UI.shareReferral());
  }

  return { build };
})();