window.Tasks = (() => {
  const TASKS = [
    { id: "tap_50", title: "Сделай 50 тапов", need: 50, rewardZoo: 200 },
    { id: "tap_200", title: "Сделай 200 тапов", need: 200, rewardZoo: 800 },
    { id: "tap_1000", title: "Сделай 1000 тапов", need: 1000, rewardZoo: 5000 }
  ];

  function isDone(taskId) {
    const s = window.State.get();
    s.doneTasks = s.doneTasks || [];
    return s.doneTasks.includes(taskId);
  }

  function markDone(taskId) {
    const s = window.State.get();
    s.doneTasks = s.doneTasks || [];
    if (!s.doneTasks.includes(taskId)) s.doneTasks.push(taskId);
  }

  function claim(taskId) {
    const s = window.State.get();
    const t = TASKS.find(x => x.id === taskId);
    if (!t) return false;
    if (isDone(taskId)) return false;
    if ((s.tapsTotal || 0) < t.need) return false;

    s.zoo += t.rewardZoo;
    markDone(taskId);
    window.UI.renderTop();
    window.UI.renderTasks();
    window.UI.renderWallet();
    window.State.save();
    return true;
  }

  function list() { return TASKS; }

  return { list, claim, isDone };
})();