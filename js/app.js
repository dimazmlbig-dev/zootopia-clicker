// js/app.js — правильная инициализация (после сплеша всё стартует)
(async function () {
  // Telegram init (опционально)
  const tg = window.Telegram && window.Telegram.WebApp ? window.Telegram.WebApp : null;
  if (tg) {
    try {
      tg.ready();
      tg.expand();
    } catch (_) {}
  }

  // init splash
  window.Splash.init();

  // когда сплеш закончился — стартуем игру
  window.Splash.onFinish(async () => {
    const app = document.getElementById("app");
    app.classList.remove("hidden");

    await window.State.init();

    // собираем страницы
    window.Clicker.build();
    window.UI.bindNav();

    // старт фоновых процессов
    window.Energy.start();

    // первичный рендер
    window.UI.renderTop();
    window.UI.showPage("clicker");

    // автосейв раз в 10 сек (дополнительно к throttle)
    setInterval(() => window.State.save(), 10000);

    // обновление майнинга (число доступного) раз в секунду
    setInterval(() => {
      window.UI.renderClicker();
    }, 1000);
  });
})();