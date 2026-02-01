(function(){
  window.NFTScreen = {
    html(){
      const it = window.STATE.game.items;
      const row = (key, title, emoji) => `
        <button class="nftRow" data-key="${key}">
          <span>${emoji} ${title}</span>
          <span style="opacity:.9;font-weight:900">${it[key] ? "ON" : "OFF"}</span>
        </button>
      `;

      return `
        <div class="centerScreen">
          <div class="card">
            <div style="font-weight:900;font-size:18px;margin-bottom:10px;color:rgba(255,255,255,.92)">NFT / Одежда</div>
            <div style="color:rgba(255,255,255,.75);margin-bottom:12px">Включай слои поверх собаки.</div>

            <div style="display:flex;flex-direction:column;gap:10px">
              ${row("hat","Шапка","🎩")}
              ${row("glasses","Очки","😎")}
              ${row("collar","Ошейник","🧷")}
            </div>

            <div style="margin-top:12px;color:rgba(255,255,255,.65);font-size:12px;line-height:1.35">
              Файлы должны быть по путям:<br>
              assets/nft/hat.png, assets/nft/glasses.png, assets