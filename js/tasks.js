// js/tasks.js - минимально, чтобы не ломало запуск

window.Tasks = (() => {
  const list = [
    { id: "join_channel", title: "Подпишись на канал", reward: 50, done: false },
    { id: "invite_1", title: "Пригласи 1 друга", reward: 100, done: false },
  ];

  function render() {
    const root = document.getElementById("tasks-list");
    if (!root) return;

    root.innerHTML = "";
    list.forEach((t) => {
      const el = document.createElement("div");
      el.className = "panel";
      el.style.padding = "12px";
      el.innerHTML = `
        <div style="display:flex;justify-content:space-between;gap:10px;align-items:center;">
          <div>
            <div style="font-weight:900;">${t.title}</div>
            <div class="muted" style="font-size:12px;margin-top:4px;">Награда: ${t.reward} 🦴</div>
          </div>
          <button class="secondary-btn" style="width:auto;padding:10px 12px;border-radius:12px;">
            ${t.done ? "Готово" : "ОК"}
          </button>
        </div>
      `;
      root.appendChild(el);
    });
  }

  return { render };
})();

// автоподрисовка если вкладка открыта
window.addEventListener("load", () => {
  try { window.Tasks?.render?.(); } catch (_) {}
});