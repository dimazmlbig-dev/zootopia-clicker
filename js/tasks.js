// js/tasks.js — задания на тапы с наградами

window.Tasks = (() => {
  const TASKS = [
    { id: "tap_50", title: "Сделай 50 тапов", goal: 50, reward: { zoo: 5 } },
    { id: "tap_200", title: "Сделай 200 тапов", goal: 200, reward: { zoo: 25 } },
    { id: "tap_500", title: "Сделай 500 тапов", goal: 500, reward: { zoo: 80 } }
  ];

  function render({ state, setState, updateUI }) {
    const root = document.getElementById("tasks-list");
    if (!root) return;

    root.innerHTML = "";

    for (const t of TASKS) {
      const done = state.tasks.tapCount >= t.goal;
      const claimed = !!state.tasks.claimed[t.id];

      const card = document.createElement("div");
      card.className = "panel";
      card.style.background = "rgba(16, 18, 32, .22)";

      const title = document.createElement("div");
      title.className = "panel-title";
      title.textContent = t.title;

      const progress = document.createElement("div");
      progress.className = "muted";
      progress.textContent = `Прогресс: ${Math.min(state.tasks.tapCount, t.goal)} / ${t.goal}`;

      const reward = document.createElement("div");
      reward.className = "muted";
      reward.style.marginTop = "6px";
      reward.textContent = `Награда: ${t.reward.zoo} $ZOO`;

      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = (done && !claimed) ? "primary-btn" : "secondary-btn";
      btn.textContent = claimed ? "Получено ✅" : (done ? "Получить" : "Не выполнено");
      btn.disabled = claimed || !done;

      btn.addEventListener("click", () => {
        if (!done || claimed) return;

        const next = structuredClone ? structuredClone(state) : JSON.parse(JSON.stringify(state));
        next.zoo += t.reward.zoo;
        next.tasks.claimed[t.id] = true;

        setState(next);
        updateUI();
        render({ state: next, setState, updateUI });
      });

      card.appendChild(title);
      card.appendChild(progress);
      card.appendChild(reward);
      card.appendChild(document.createElement("div")).className = "hr";
      card.appendChild(btn);

      root.appendChild(card);
    }
  }

  return { render };
})();