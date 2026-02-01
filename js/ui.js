(function(){
  const screen = () => document.getElementById("screen");

  function setActiveTab(tab){
    window.STATE.ui.tab = tab;
    document.querySelectorAll(".tab").forEach(b=>{
      b.classList.toggle("active", b.dataset.tab === tab);
    });
    render();
  }

  function clickScreenHTML(){
    const u = window.STATE.user;
    const g = window.STATE.game;

    const energyPct = Math.max(0, Math.min(1, g.energy / g.energyMax));
    const energyWidth = `${Math.round(energyPct * 100)}%`;

    const moodClass = g.mood === "tired" ? "mood-tired" : (g.mood === "angry" ? "mood-angry" : "mood-happy");

    return `
      <div class="click">
        <div class="topbar">
          <div class="pill">
            <div>
              <div class="pill__name">🐶 ${escapeHtml(u.name || "Игрок")}</div>
              <div class="pill__sub">ID: ${u.id ?? "—"}</div>
            </div>
          </div>
          <button class="walletBtn" id="openWallet">Кошелёк</button>
        </div>

        <div class="dogStage">
          <div class="dogWrap">
            <div class="dogPlatform"></div>

            <img
              id="dog"
              class="dogSprite idle ${moodClass}"
              src="assets/dog.png"
              alt="dog"
              draggable="false"
            />

            <div class="overlay">
              ${g.items.hat ? `<img class="ov-hat" src="assets/nft/hat.png" alt="hat" onerror="this.style.display='none'">` : ``}
              ${g.items.glasses ? `<img class="ov-glasses" src="assets/nft/glasses.png" alt="glasses" onerror="this.style.display='none'">` : ``}
              ${g.items.collar ? `<img class="ov-collar" src="assets/nft/collar.png" alt="collar" onerror="this.style.display='none'">` : ``}
            </div>
          </div>
        </div>

        <div class="hud">
          <div class="energyRow">
            <span>ЭНЕРГИЯ</span>
            <span>${g.energy} / ${g.energyMax}</span>
          </div>
          <div class="energyBar"><div class="energyFill" style="width:${energyWidth}"></div></div>

          <div class="badges">
            <span class="badge">🙂 ${g.mood}</span>
            <span class="badge">🧠 ${g.trait}</span>
            <span class="badge">💰 ${g.balance} $ZOO</span>
          </div>
        </div>
      </div>
    `;
  }

  function simpleCard(title, text){
    return `
      <div class="centerScreen">
        <div class="card">
          <div style="font-weight:900;font-size:18px;margin-bottom:10px;color:rgba(255,255,255,.92)">${escapeHtml(title)}</div>
          <div style="line-height:1.35">${escapeHtml(text)}</div>
        </div>
      </div>
    `;
  }

  function render(){
    const tab = window.STATE.ui.tab;
    if(tab === "click") screen().innerHTML = clickScreenHTML();
    if(tab === "tasks") screen().innerHTML = window.TasksScreen?.html?.() ?? simpleCard("Задания", "Скоро добавим задания сюда.");
    if(tab === "nft") screen().innerHTML = window.NFTScreen?.html?.() ?? simpleCard("NFT", "Здесь будут предметы (очки/шапка/ошейник).");
    if(tab === "wallet") screen().innerHTML = window.WalletScreen?.html?.() ?? simpleCard("Кошелёк", "Подключим TON и баланс.");

    // Bindings after render
    bindClickScreen();
  }

  function bindClickScreen(){
    const openWallet = document.getElementById("openWallet");
    if(openWallet){
      openWallet.onclick = () => setActiveTab("wallet");
    }
    const dog = document.getElementById("dog");
    if(dog){
      dog.addEventListener("click", window.onDogTap);
      dog.addEventListener("touchstart", window.onDogTap, { passive:true });
    }
  }

  function escapeHtml(s){
    return String(s).replace(/[&<>"']/g, (c)=>({ "&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;" }[c]));
  }

  window.UI = { render, setActiveTab };
  window.addEventListener("click", (e)=>{
    const btn = e.target.closest(".tab");
    if(!btn) return;
    window.UI.setActiveTab(btn.dataset.tab);
  });
})();