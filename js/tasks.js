const TaskManager = {
  checkProgress() {
    // Можно добавить обновление UI заданий здесь
    console.log('Прогресс проверен, тапов:', state.totalTaps);
  }
};

window.TaskManager = TaskManager;
