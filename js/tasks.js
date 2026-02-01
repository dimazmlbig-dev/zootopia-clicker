window.App = window.App || {};

App.tasks = (() => {
  function init() {}

  function render(root) {
    root.innerHTML = `
      <h3>Задания</h3>
      <div>Скоро тут будут задания + награды.</div>
    `;
  }

  return { init, render };
})();