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
                    // Обычно 0 или 1 (выполнено/не выполнено)
                    progress = state.tasks[id]?.completed ? 1 : 0;
                    break;
            }

            // Обновляем прогресс в UI (реализуй updateTasksUI по-своему)
            // например: document.getElementById(`progress-${id}`).style.width = `${progress * 100}%`
        }
    },

    claimReward(id) {
        const task = TASKS_CONFIG[id];
        if (!task || state.tasks[id]?.completed) return;

        let canClaim = false;

        switch (task.type) {
            case 'taps':
            case 'balance':
            case 'mine_level':
            case 'referrals':
                const progress = this.getProgress(task);
                if (progress >= 1) canClaim = true;
                break;
            case 'social':
                canClaim = true; // предполагаем honor system
                break;
        }

        if (canClaim) {
            state.bones += task.reward;
            state.tasks[id] = state.tasks[id] || {};
            state.tasks[id].completed = true;
            tg?.HapticFeedback?.notificationOccurred('success');
            updateUI();
        }
    },

    getProgress(task) {
        switch (task.type) {
            case 'taps':      return (state.totalTaps || 0) / task.goal;
            case 'balance':   return state.bones / task.goal;
            case 'mine_level': return state.mining.level / task.goal;
            case 'referrals': return (state.referredCount || 0) / task.goal;
            case 'social':    return state.tasks[task.id]?.completed ? 1 : 0;
            default: return 0;
        }
    },

    updateTasksUI() {
        // Здесь реализуй отрисовку карточек заданий
        // это зависит от твоей верстки в index.html
        // пример:
        // for (let id in TASKS_CONFIG) { ... create card ... }
    }
};

// Инициализация (если нужно)
window.TaskManager = TaskManager;
