// js/tasks.js — простые задания-заглушки (чтобы ничего не ломалось).

window.Tasks = (() => {
  const TASKS = [
    { id: "daily", title: "Зайди в игру", reward: 50, done: false },
    { id: "share", title: "Поделись с другом", reward: 150, done: false },
    { id: "connect", title: "Подключи кошелёк", reward: 200, done: false },
  ];

  function render(containerId = "tasks-list") {
    const root = document.getElementById(containerId);
    if (!root) return;

    root.innerHTML = "";
    TASKS.forEach(t => {
      const el = document.createElement("div");
      el.className = "panel";
      el.style.padding = "12px";
      el.innerHTML = `
        <div style="display:flex; align-items:center; justify-content:space-between; gap:10px;">
          <div>
            <div style="font-weight:900;">${t.title}</div>
            <div class="muted" style="font-size:12px; margin-top:4px;">Награда: +${t.reward} 🦴</div>
          </div>
          <button class="secondary-btn" style="width:auto; padding:10px 12px;" ${t.done ? "disabled" : ""}>
            ${t.done ? "Готово" : "Выполнить"}
          </button>
        </div>
      `;
      el.querySelector("button")?.addEventListener("click", () => {
        t.done = true;
        try {
          const s = window.State?.get?.();
          if (s) {
            s.bones += t.reward;
            window.State.set(s);
            window.State.save();
            window.UI?.updateBalance?.();
          }
        } catch {}
        render(containerId);
      });

      root.appendChild(el);
    });
  }

  return { render };
})();