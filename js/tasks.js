// js/tasks.js — минимальные задания (пока без backend)

window.Tasks = (() => {
  const LIST = [
    { id: "tap_50", title: "Сделай 50 тапов", reward: 50 },
    { id: "tap_200", title: "Сделай 200 тапов", reward: 200 },
    { id: "invite_1", title: "Пригласи 1 друга", reward: 300 }
  ];

  function render() {
    const root = document.getElementById("tasks-list");
    if (!root) return;

    const s = window.State?.get?.();
    const done = (s?.tasksDone && typeof s.tasksDone === "object") ? s.tasksDone : {};

    root.innerHTML = "";

    LIST.forEach((t) => {
      const card = document.createElement("div");
      card.className = "panel";

      const title = document.createElement("div");
      title.className = "panel-title";
      title.innerText = t.title;

      const info = document.createElement("div");
      info.className = "muted";
      info.style.marginBottom = "10px";
      info.innerText = `Награда: +${t.reward} $ZOO`;

      const btn = document.createElement("button");
      btn.className = "secondary-btn";
      btn.type = "button";

      const isDone = !!done[t.id];
      btn.innerText = isDone ? "Выполнено" : "Забрать";
      btn.disabled = isDone;

      btn.addEventListener("click", () => {
        const st = window.State.get();
        st.tasksDone = (st.tasksDone && typeof st.tasksDone === "object") ? st.tasksDone : {};
        if (st.tasksDone[t.id]) return;

        st.tasksDone[t.id] = true;
        st.zoo = (st.zoo | 0) + t.reward;
        window.State.set(st);
        window.State.save();
        window.UI?.updateBalance?.();
        render();
      });

      card.appendChild(title);
      card.appendChild(info);
      card.appendChild(btn);
      root.appendChild(card);
    });
  }

  return { render };
})();