// js/tasks.js — простой список заданий (позже подключим backend)

window.Tasks = (() => {
  const DEFAULT_TASKS = [
    { id: "t1", title: "Сделай 50 тапов", reward: 20, done: false, type: "taps", goal: 50 },
    { id: "t2", title: "Собери майнинг 1 раз", reward: 30, done: false, type: "mining", goal: 1 },
  ];

  function ensureTasks(state) {
    if (!state.tasks || typeof state.tasks !== "object") {
      state.tasks = {};
      for (const t of DEFAULT_TASKS) state.tasks[t.id] = { done: false, progress: 0 };
    }
    return state;
  }

  function render() {
    const s = State.get();
    ensureTasks(s);
    const root = document.getElementById("tasks-list");
    if (!root) return;

    root.innerHTML = "";

    for (const t of DEFAULT_TASKS) {
      const st = s.tasks[t.id] || { done: false, progress: 0 };
      const done = !!st.done;

      const card = document.createElement("div");
      card.className = "panel";
      card.style.padding = "12px";

      const title = document.createElement("div");
      title.style.fontWeight = "900";
      title.style.marginBottom = "6px";
      title.innerText = t.title;

      const meta = document.createElement("div");
      meta.className = "muted";
      meta.style.fontSize = "12px";
      meta.innerText = done
        ? "✅ Выполнено"
        : `Прогресс: ${st.progress || 0}/${t.goal} • Награда: +${t.reward} $ZOO`;

      const btn = document.createElement("button");
      btn.className = done ? "secondary-btn" : "primary-btn";
      btn.style.marginTop = "10px";
      btn.innerText = done ? "Готово" : "Проверить";
      btn.disabled = done;

      btn.onclick = () => {
        // Локальная проверка (без сервера)
        if (t.type === "taps") {
          if ((s.bones | 0) >= t.goal) completeTask(t.id, t.reward);
        }
        if (t.type === "mining") {
          // если хоть раз собирал: lastCollect обновлялся и zoo > 0
          if ((s.zoo | 0) > 0) completeTask(t.id, t.reward);
        }
        render();
      };

      card.appendChild(title);
      card.appendChild(meta);
      card.appendChild(btn);
      root.appendChild(card);
    }

    State.set(s);
    State.save();
  }

  function addTapProgress(amount = 1) {
    const s = State.get();
    ensureTasks(s);
    if (s.tasks?.t1 && !s.tasks.t1.done) {
      s.tasks.t1.progress = Math.min(50, (s.tasks.t1.progress || 0) + amount);
    }
    State.set(s);
  }

  function addMiningProgress(amount = 1) {
    const s = State.get();
    ensureTasks(s);
    if (s.tasks?.t2 && !s.tasks.t2.done) {
      s.tasks.t2.progress = Math.min(1, (s.tasks.t2.progress || 0) + amount);
    }
    State.set(s);
  }

  function completeTask(id, reward) {
    const s = State.get();
    ensureTasks(s);
    if (!s.tasks[id]) s.tasks[id] = { done: false, progress: 0 };
    if (s.tasks[id].done) return;

    s.tasks[id].done = true;
    s.zoo += reward;

    State.set(s);
    State.save();
    UI.updateBalance();
    UI.updateMiningInfo();
  }

  return { render, addTapProgress, addMiningProgress };
})();