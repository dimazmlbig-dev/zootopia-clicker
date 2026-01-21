function bindBottomNav() {
  const buttons = document.querySelectorAll(".nav-btn");
  const pages = {
    main: document.getElementById("tab-main"),
    tasks: document.getElementById("tab-tasks"),
    mining: document.getElementById("tab-mining"),
  };

  function openTab(name) {
    // buttons
    buttons.forEach(b => b.classList.toggle("active", b.dataset.tab === name));

    // pages
    Object.values(pages).forEach(p => {
      if (!p) return;
      p.classList.add("hidden");
      p.classList.remove("active");
    });

    const target = pages[name];
    if (target) {
      target.classList.remove("hidden");
      target.classList.add("active");
    }
  }

  buttons.forEach(btn => {
    btn.addEventListener("click", () => openTab(btn.dataset.tab));
  });

  openTab("main");
}

// DEMO старт (чтобы увидеть стиль сразу)
window.addEventListener("load", () => {
  // hide splash
  const splash = document.getElementById("splash-screen");
  const main = document.getElementById("main-content");
  if (splash) splash.style.display = "none";
  if (main) main.classList.remove("hidden");

  bindBottomNav();
});
