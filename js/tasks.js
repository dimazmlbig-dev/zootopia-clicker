// js/tasks.js — простые задания (можно расширять)

window.Tasks = (() => {
  const LIST = [
    { id: "tap_50", title: "Сделай 50 тапов", rewardZoo: 25, needTaps: 50 },
    { id: "tap_200", title: "Сделай 200 тапов", rewardZoo: 150, needTaps: 200 },
  ];

  function render() {
    const root = document.getElementById("tasks-list");
    if (!root) return;

    const s = window.State?.get?.();
    const taps = Number(s?.tapsTotal || 0);

    root.innerHTML = "";
    for (const t of LIST) {
      const done = (s?.tasksDone && s.tasksDone[t.id]) || false;
      const progress = Math.min(100, Math.floor((taps / t.needTaps) * 100));

      const card = document.createElement("div");
      card.className = "panel";
      card.innerHTML = `
        <div class="panel-title">${t.title}</div>
        <div class="muted">Прогресс: ${done ? "✅ Выполнено" : `${taps}/${t.needTaps} (${progress}%)`}</div>
        <div class="hr"></div>
        <button class="primary-btn" ${done ? "disabled" : ""}>Забрать +${t.rewardZoo} $ZOO</button>
      `;

      const btn = card.querySelector("button");
      btn.addEventListener("click", () => {
        const st = window.State.get();
        st.tasksDone = st.tasksDone || {};
        if (st.tasksDone[t.id]) return;
        if ((st.tapsTotal || 0) < t.needTaps) return;

        st.tasksDone[t.id] = true;
        st.zoo += t.rewardZoo;
        window.State.set(st);
        window.State.save();

        window.UI.updateBalance();
        render();
      });

      root.appendChild(card);
    }
  }

  return { render };
})();