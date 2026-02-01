function htmlClick(){
  const s = State.get();
  const mood = State.mood();
  const mult = "x1.00"; // позже привяжем к NFT/баффам

  return `
    <div class="card">
      <div class="header">
        <div class="big-balance">
          <div class="num">${formatInt(s.balance)}</div>
          <div class="sub">$ZOO ${formatInt(s.balance)}</div>
        </div>
        <button class="btn-pill" id="goWallet">Кошелёк</button>
      </div>

      <div class="user-pill">🐶 ${escapeHtml(s.user.name)}</div>

      <div class="subtitle">Настроение: ${mood} • Множитель: ${mult}</div>

      <div class="center">
        <div class="dog-stage" id="dogStage">
          <div class="dog-wrap is-idle mood-${mood}" id="dogWrap">
            <img class="dog-base" id="dogBase" src="assets/dog.png" alt="dog" />
            <img class="nft-layer ${s.equipped.glasses ? "is-on": ""}" id="layerGlasses" src="assets/nft/glasses.png" alt="glasses" onerror="this.style.display='none'"/>
            <img class="nft-layer ${s.equipped.hat ? "is-on": ""}" id="layerHat" src="assets/nft/hat.png" alt="hat" onerror="this.style.display='none'"/>
            <img class="nft-layer ${s.equipped.collar ? "is-on": ""}" id="layerCollar" src="assets/nft/collar.png" alt="collar" onerror="this.style.display='none'"/>
          </div>
        </div>
      </div>

      <div class="energy-card">
        <div class="energy-row">
          <div class="energy-title">ЭНЕРГИЯ</div>
          <div class="energy-value">${formatInt(s.energy)} / ${formatInt(s.energyMax)}</div>
        </div>
        <div class="bar"><i id="energyBar"></i></div>

        <div class="badges">
          <div class="badge">🙂 ${mood}</div>
          <div class="badge">🧠 loyal</div>
          <div class="badge">🪽 50</div>
        </div>
      </div>
    </div>
  `;
}