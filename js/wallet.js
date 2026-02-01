window.App = window.App || {};

App.wallet = (() => {
  function init() {}

  function render(root) {
    const s = App.state.get();
    root.innerHTML = `
      <h3>Кошелёк</h3>
      <div>Статус: <b>${s.wallet.connected ? 'подключен' : 'не подключен'}</b></div>
      <button id="connectBtn" style="margin-top:10px; padding:10px 14px; border-radius:14px;">
        Подключить (позже через TonConnect)
      </button>
    `;

    root.querySelector('#connectBtn').addEventListener('click', () => {
      alert('TonConnect подключим следующим шагом');
    });
  }

  return { init, render };
})();