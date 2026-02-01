window.App = (() => {
  let currentTab = "click";

  function getTab(){ return currentTab; }

  function initTelegramUser(){
    const tg = window.Telegram?.WebApp;
    try{ tg?.ready(); }catch(e){}

    const user = tg?.initDataUnsafe?.user;
    const id = user?.id ? String(user.id) : String(Math.floor(Math.random()*1e9));
    const name = user?.first_name || user?.username || "Игрок";

    State.set({ user: { id, name } });
  }

  function initStorage(){
    const saved = Storage.load();
    if(saved && typeof saved === "object"){
      // аккуратно мержим (без ломания структуры)
      const base = State.get();
      State.set({
        ...base,
        ...saved,
        user: base.user, // user берем из Telegram
      });
    }
  }

  function bindTabs(){
    document.querySelectorAll(".tab").forEach(btn => {
      btn.addEventListener("click", () => {
        currentTab = btn.dataset.tab;
        UI.render(currentTab);
        bindAfterRender();
      });
    });
  }

  function bindAfterRender(){
    if(currentTab === "click") Clicker.bind();
    if(currentTab === "nft") NFT.bind();
    if(currentTab === "tasks") Tasks.bind();
    if(currentTab === "wallet") Wallet.bind();
  }

  function start(){
    initTelegramUser();
    initStorage();

    bindTabs();
    UI.render(currentTab);
    bindAfterRender();

    Energy.start();
  }

  return { start, getTab };
})();

document.addEventListener("DOMContentLoaded", () => App.start());