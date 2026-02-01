window.UI = (() => {
  const screen = () => document.getElementById("screen");

  function setActiveTab(tab){
    document.querySelectorAll(".tab").forEach(b => {
      b.classList.toggle("is-active", b.dataset.tab === tab);
    });
  }

  function htmlClick(){
    const s = State.get();
    const mood = State.mood();

    return `
      <div class="card">
        <div class="topbar">
          <div class="pill">
            <div>🐶</div>
            <div style="min-width:0">
              <div class="name">${escapeHtml(s.user.name)}</div>
              <div class="id">ID: ${escapeHtml(String(s.user.id))}</div>
            </div>
          </div>

          <div class="balance">
            <div class="num">${formatInt(s.balance)}</div>
            <div class="sub">$ZOO</div>
          </div>
        </div>

        <div class="dog-stage" id="dogStage">
          <div class="dog-wrap is-idle mood-${mood}" id="dogWrap">
            <img class="dog-base" id="dogBase" src="assets/dog.png" alt="dog" />
            <img class="nft-layer ${s.equipped.glasses ? "is-on": ""}" id="layerGlasses" src="assets/nft/glasses.png" alt="glasses" onerror="this.style.display='none'"/>
            <img class="nft-layer ${s.equipped.hat ? "is-on": ""}" id="layerHat" src="assets/nft/hat.png" alt="hat" onerror="this.style.display='none'"/>
            <img class="nft-layer ${s.equipped.collar ? "is-on": ""}" id="layerCollar" src="assets/nft/collar.png" alt="collar" onerror="this.style.display='none'"/>
          </div>
        </div>

        <div class="hud">
          <div class="energy-row">
            <div class="energy-label">ЭНЕРГИЯ</div>
            <div class="energy-value">${formatInt(s.energy)} / ${formatInt(s.energyMax)}</div>
          </div>
          <div class="bar"><i id="energyBar"></i></div>

          <div class="stats">
            <span class="badge">🙂 ${mood}</span>
            <span class="badge">👆 taps ${formatInt(s.taps)}</span>
            <span class="badge">💰 ${formatInt(s.balance)} $ZOO</span>
          </div>
        </div>
      </div>
    `;
  }

  function htmlTasks(){
    return `
      <div class="card">
        <div class="topbar">
          <div class="pill"><div>🧩</div><div class="name">Задания</div></div>
        </div>
        <div class="list">
          <div class="item">
            <div>
              <div class="title">Сделай 50 тапов</div>
              <div class="desc">Награда: +50 $ZOO</div>
            </div>
            <button class="btn" id="btnTask50">Получить</button>
          </div>
        </div>
      </div>
    `;
  }

  function htmlNFT(){
    const s = State.get();
    return `
      <div class="card">
        <div class="topbar">
          <div class="pill"><div>🕶️</div><div class="name">NFT / Одежда</div></div>
        </div>

        <div class="list">
          ${nftRow("glasses","Очки","assets/nft/glasses.png", s.equipped.glasses)}
          ${nftRow("hat","Шапка","assets/nft/hat.png", s.equipped.hat)}
          ${nftRow("collar","Ошейник","assets/nft/collar.png", s.equipped.collar)}
        </div>

        <div style="color:var(--muted); font-size:12px; margin-top:auto;">
          * Файлы должны лежать в assets/nft/ (glasses.png, hat.png, collar.png)
        </div>
      </div>
    `;
  }

  function htmlWallet(){
    const s = State.get();
    return `
      <div class="card">
        <div class="topbar">
          <div class="pill"><div>👛</div><div class="name">Кошелёк</div></div>
          <div class="balance">
            <div class="num">${formatInt(s.balance)}</div>
            <div class="sub">$ZOO</div>
          </div>
        </div>
        <div style="color:var(--muted); font-size:14px;">
          Здесь позже подключим TonConnect. Сейчас просто отображение баланса.
        </div>
      </div>
    `;
  }

  function render(tab){
    const root = screen();
    // КЛЮЧ: очищаем экран, чтобы не было “дубликатов”
    root.innerHTML = "";

    if(tab === "click") root.innerHTML = htmlClick();
    else if(tab === "tasks") root.innerHTML = htmlTasks();
    else if(tab === "nft") root.innerHTML = htmlNFT();
    else if(tab === "wallet") root.innerHTML = htmlWallet();
    else root.innerHTML = htmlClick();

    setActiveTab(tab);

    // пост-инициализация визуальных вещей
    if(tab === "click"){
      const s = State.get();
      const pct = s.energyMax ? Math.max(0, Math.min(100, (s.energy / s.energyMax) * 100)) : 0;
      const bar = document.getElementById("energyBar");
      if(bar) bar.style.width = pct + "%";
    }
  }

  function nftRow(key, title, img, on){
    return `
      <div class="item">
        <div>
          <div class="title">${title}</div>
          <div class="desc">${key}</div>
        </div>
        <button class="btn ${on ? "is-on": ""}" data-equip="${key}">
          ${on ? "Снять" : "Надеть"}
        </button>
      </div>
    `;
  }

  function formatInt(n){
    return (Number(n)||0).toLocaleString("ru-RU");
  }

  function escapeHtml(str){
    return String(str)
      .replaceAll("&","&amp;")
      .replaceAll("<","&lt;")
      .replaceAll(">","&gt;")
      .replaceAll('"',"&quot;")
      .replaceAll("'","&#039;");
  }

  return { render };
})();