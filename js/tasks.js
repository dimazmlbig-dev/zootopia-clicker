// js/tasks.js
window.Tasks = (() => {
  function render() {
    const root = document.getElementById("tasksList");
    const s = window.State.get();
    root.innerHTML = "";

    // 1 task example: 100 taps
    const done = s.tasks.taps >= 100;
    const claimed = s.tasks.taskTap100Claimed;

    const card = document.createElement("div");
    card.className = "task-card";
    card.innerHTML = `
      <div class="task-row">
        <div>
          <div><b>Сделай 100 тапов</b></div>
          <div style="opacity:.85">Прогресс: ${Math.min(100, s.tasks.taps)}/100</div>
        </div>
        <button class="btn" ${(!done || claimed) ? "disabled" : ""}>
          ${claimed ? "Получено" : (done ? "Забрать" : "…")}
        </button>
      </div>
    `;

    const btn = card.querySelector("button");
    btn.addEventListener("click", () => {
      if (!done || claimed) return;
      s.tasks.taskTap100Claimed = true;
      window.State.addZoo(800);
      window.State.save();
      window.UI.renderAll();
      render();
    });

    root.appendChild(card);
  }

  function init() {
    render();
  }

  return { init, render };
})();