window.App = window.App || {};

App.nft = (() => {
  function init() {}

  function render(root) {
    root.innerHTML = `
      <h3>NFT</h3>
      <div>Магазин/коллекция — добавим далее.</div>
    `;
  }

  return { init, render };
})();