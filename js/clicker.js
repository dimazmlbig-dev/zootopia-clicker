window.App = window.App || {};

App.clicker = (() => {
  function init() {
    // пассивный доход (если захочешь CPS)
    setInterval(() => {
      const s = App.state.get();
      if (s.cps > 0) App.state.set({ coins: s.coins + s.cps });
    }, 1000);
  }

  function onTap() {
    if (!App.energy.canTap()) return;

    const s = App.state.get();
    App.energy.spend(1);

    App.state.set({
      coins: s.coins + 1,
      clicks: s.clicks + 1
    });
  }

  function render(root) {
    const s = App.state.get();
    root.innerHTML = `
      <div style="display:flex; gap:16px; align-items:center;">
        <img src="assets/dog.png" style="width:140px; height:auto; border-radius:18px;" />
        <div>
          <div><b>Tap!</b></div>
          <div>Энергия: <b id="energyTxt">${s.energy}</b> / ${s.energyMax}</div>
          <div>Баланс: <b id="coinsTxt">${Math.floor(s.coins)}</b> $ZOO</div>
          <div>Клики: <b id="clicksTxt">${s.clicks}</b></div>
          <button id="tapBtn" style="margin-top:10px; padding:10px 14px; border-radius:14px;">Клик</button>
        </div>
      </div>
    `;

    root.querySelector('#tapBtn').addEventListener('click', () => {
      onTap();
      // мини-обновление без полного ререндера
      const ss = App.state.get();
      root.querySelector('#energyTxt').textContent = ss.energy;
      root.querySelector('#coinsTxt').textContent = Math.floor(ss.coins);
      root.querySelector('#clicksTxt').textContent = ss.clicks;
    });
  }

  return { init, render };
})();