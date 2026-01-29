window.WalletPage = (() => {
  function render() {
    const root = document.getElementById("page-wallet");
    if (!root) return;

    const s = window.State.get();

    root.innerHTML = `
      <div class="card">
        <div class="h1">Кошелёк</div>
        <div class="muted">Подключи кошелёк через TON Connect.</div>
        <div id="ton-connect-ui"></div>
      </div>

      <div class="card">
        <div class="h1">Баланс</div>
        <div class="row">
          <div class="muted">$ZOO</div>
          <div style="font-weight:900" id="walletZoo">${s.zoo}</div>
        </div>
        <div class="row" style="margin-top:10px">
          <div class="muted">Bones</div>
          <div style="font-weight:900">${s.bones}</div>
        </div>
      </div>

      <div class="card">
        <div class="h1">Тест транзакции</div>
        <div class="muted">Нажми, чтобы отправить 0.01 TON (пример). Адрес поставь свой.</div>
        <div class="sep"></div>
        <input id="txTo" placeholder="TON address" style="width:100%;padding:12px;border-radius:16px;border:0;outline:none">
        <div style="height:10px"></div>
        <button id="txSend" class="btn btn--primary">Отправить 0.01 TON</button>
      </div>
    `;

    // init ton connect UI
    const ui = window.TonConnectManager.getUI() || window.TonConnectManager.init();
    if (ui) {
      // Mount button (UI делает сам)
      ui.uiOptions = { language: "ru" };
    }

    root.querySelector("#txSend").addEventListener("click", async () => {
      const to = root.querySelector("#txTo").value.trim();
      if (!to) return alert("Вставь адрес");
      try {
        // 0.01 TON = 10_000_000 nano
        await window.TonConnectManager.send(to, 10_000_000, "Zootopia test");
        alert("Запрос отправлен в кошелёк");
      } catch (e) {
        console.warn(e);
        alert("Ошибка/отмена в кошельке");
      }
    });
  }

  return { render };
})();