window.NFT = (() => {
  function bind(){
    document.querySelectorAll("[data-equip]").forEach(btn => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-equip");
        NFTManager.toggle(key);
        UI.render("nft");
        bind(); // заново повесить после render
      });
    });
  }
  return { bind };
})();