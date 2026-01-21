const TASKS_CONFIG = {
  'daily_taps': {
    id: 'daily_taps',
    title: 'Ежедневные тапы',
    goal: 500,
    reward: 1000,
    type: 'taps'
  },
  'reach_balance': {
    id: 'reach_balance',
    title: 'Достичь баланса',
    goal: 10000,
    reward: 5000,
    type: 'balance'
  },
  'upgrade_mine': {
    id: 'upgrade_mine',
    title: 'Улучшить шахту',
    goal: 3,
    reward: 3000,
    type: 'mine_level'
  },
  'social_telegram': {
    id: 'social_telegram',
    title: 'Подписаться на канал',
    reward: 2500,
    type: 'social',
    url: 'https://t.me/zootopiaclik'
  },
  'referrals': {
    id: 'referrals',
    title: 'Пригласи 5 друзей',
    goal: 5,
    reward: 25000,
    type: 'referrals'
  }
};

const TaskManager = {
  checkProgress() {
    for (let id in TASKS_CONFIG) {
      const task = TASKS_CONFIG[id];
      let progress = 0;

      switch (task.type) {
        case 'taps':
          progress = (state.totalTaps || 0) / task.goal;
          break;
        case 'balance':
          progress = state.bones / task.goal;
          break;
        case 'mine_level':
          progress = state.mining.level / task.goal;
          break;
        case 'referrals':
          progress = (state.referredCount || 0) / task.goal;
          break;
        case 'social':
          progress = state.tasks[id]?.completed ? 1 : 0;
          break;
      }

      // Здесь можно обновлять прогресс-бары в UI
      // например: document.getElementById(`progress-${id}`).style.width = `${progress*100}%`
    }
  },

  claimReward(id) {
    const task = TASKS_CONFIG[id];
    if (!task || state.tasks[id]?.completed) return;

    let progress = 0;
    switch (task.type) {
      case 'taps':      progress = (state.totalTaps || 0) / task.goal; break;
      case 'balance':   progress = state.bones / task.goal; break;
      case 'mine_level': progress = state.mining.level / task.goal; break;
      case 'referrals': progress = (state.referredCount || 0) / task.goal; break;
      case 'social':    progress = 1; break;
    }

    if (progress >= 1) {
      state.bones += task.reward;
      state.tasks[id] = state.tasks[id] || {};
      state.tasks[id].completed = true;
      tg?.HapticFeedback?.notificationOccurred('success');
      updateUI();
    }
  },

  updateTasksUI() {
    const container = document.getElementById('tasks-list');
    if (!container) return;

    container.innerHTML = '';
    for (let id in TASKS_CONFIG) {
      const task = TASKS_CONFIG[id];
      const div = document.createElement('div');
      div.className = 'task-card';
      div.innerHTML = `
        <h4>${task.title}</h4>
        <p>Награда: ${task.reward} bones</p>
        <button onclick="TaskManager.claimReward('${id}')">Забрать</button>
      `;
      container.appendChild(div);
    }
  }
};

window.TaskManager = TaskManager;
