(() => {
  const log = (...a) => console.log('[APP]', ...a);

  function tgReady() {
    try {
      if (window.Telegram?.WebApp) {
        Telegram.WebApp.ready();
        Telegram.WebApp.expand();
      }
    } catch (e) {
      console.log('Telegram init error:', e);
    }
  }

  function safe(name, fn) {
    try { return fn(); }
    catch (e) { console.error(`[ERR ${name}]`, e); return null; }
  }

  function start() {
    tgReady();

    // 1) init core
    safe('state.init', () => App.state.init());
    safe('storage.init', () => App.storage.init());

    // 2) init feature modules (не обязаны существовать все сразу)
    safe('energy.init', () => App.energy?.init?.());
    safe('clicker.init', () => App.clicker?.init?.());
    safe('tasks.init', () => App.tasks?.init?.());
    safe('wallet.init', () => App.wallet?.init?.());
    safe('nft.init', () => App.nft?.init?.());
    safe('tonconnect.init', () => App.tonconnect?.init?.());

    // 3) UI
    safe('ui.init', () => App.ui.init());
    safe('ui.showApp', () => App.ui.showApp());
    safe('ui.openDefaultTab', () => App.ui.openSavedOrDefaultTab());

    log('Started');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', start);
  } else {
    start();
  }
})();