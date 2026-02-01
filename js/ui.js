window.App = window.App || {};

App.ui = (() => {
  let screenEl, splashEl, appEl;

  function init() {
    splashEl = document.getElementById('splash');
    appEl = document.getElementById('app');
    screenEl = document.getElementById('screen');

    document.querySelectorAll('.tab').forEach(btn => {
      btn.addEventListener('click', () => openTab(btn.dataset.tab));
    });

    // авто-обновление UI при изменении state
    App.state.subscribe(renderTopbarMini);
  }

  function showApp() {
    splashEl?.classList?.add('hidden');
    appEl?.classList?.remove('hidden');
  }

  function openSavedOrDefaultTab() {
    const tab = App.state.get().tab || 'click';
    openTab(tab);
  }

  function openTab(tab) {
    App.state.set({ tab });
    try { localStorage.setItem('active_tab', tab); } catch {}

    document.querySelectorAll('.tab').forEach(b => {
      b.classList.toggle('active', b.dataset.tab === tab);
    });

    // делегируем рендер модулю
    if (tab === 'click') return App.clicker.render(screenEl);
    if (tab === 'tasks') return App.tasks.render(screenEl);
    if (tab === 'wallet') return App.wallet.render(screenEl);
    if (tab === 'nft') return App.nft.render(screenEl);

    screenEl.innerHTML = `<h3>${tab}</h3><p>Экран не найден</p>`;
  }

  function renderTopbarMini() {
    // опционально: если хочешь, можно обновлять элементы в текущем экране
    // сейчас не мешаем модульным render()
  }

  return { init, showApp, openTab, openSavedOrDefaultTab };
})();