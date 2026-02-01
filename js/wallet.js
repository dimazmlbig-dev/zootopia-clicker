(function(){
  window.WalletScreen = {
    html(){
      const g = window.STATE.game;
      return `
        <div class="centerScreen">
          <div class="card">
            <div style="font-weight:900;font-size:18px;margin-bottom:10px;color:rgba(255,255,255,.92)">Кошелёк</div>
            <div style="color:rgba(255,255,255,.75);line-height:1.45">
              Баланс в игре: <b style="color:rgba(255,255,255,.92)">${g.balance} $ZOO</b><br><br>
              Дальше подключим TonConnect и показ TON Balance через Worker.
            </div>
          </div>
        </div>
      `;
    }
  };
})();