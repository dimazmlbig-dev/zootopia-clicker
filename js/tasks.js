// --- Конфигурация заданий ---
const TASKS_CONFIG = {
    // ID_задания: { ...параметры }
    'daily_taps': { 
        title: 'Ежедневные тапы', 
        description: 'Сделать 500 тапов', 
        goal: 500, 
        reward: 1000, 
        type: 'taps' 
    },
    'reach_balance': { 
        title: 'Накопитель', 
        description: 'Накопить 10 000 костей', 
        goal: 10000, 
        reward: 5000, 
        type: 'balance' 
    },
    'upgrade_mine': { 
        title: 'Шахтер-профи', 
        description: 'Улучшить шахту до 3-го уровня', 
        goal: 3, 
        reward: 3000, 
        type: 'mine_level' 
    },
    'social_telegram': { 
        title: 'Наш канал', 
        description: 'Подписаться на Telegram-канал', 
        reward: 2500, 
        type: 'social',
        url: 'https://t.me/zootopiaclik' // Обновлено
    }
};

// --- Логика заданий ---
const TaskManager = {

    // Проверяет прогресс по всем заданиям
    checkProgress: function() {
        for (const id in TASKS_CONFIG) {
            if (state.tasks[id] && state.tasks[id].completed) continue; // Уже выполнено и награда получена

            const task = TASKS_CONFIG[id];
            let progress = 0;

            switch(task.type) {
                case 'taps':
                    progress = state.tasks.totalTaps / task.goal;
                    break;
                case 'balance':
                    progress = state.bones / task.goal;
                    break;
                case 'mine_level':
                    progress = state.mining.level / task.goal;
                    break;
            }
            
            if (!state.tasks[id]) state.tasks[id] = { progress: 0, completed: false };
            state.tasks[id].progress = Math.min(progress, 1.0);
        }
    },

    // Получить награду
    claimReward: function(id) {
        if (!state.tasks[id] || state.tasks[id].completed) return;
        
        const task = TASKS_CONFIG[id];
        const progress = state.tasks[id].progress;

        if (progress >= 1) {
            state.bones += task.reward;
            state.tasks[id].completed = true;
            
            updateUI();
            this.updateTasksUI();
            alert(`Награда ${task.reward} костей получена!`);
        } else {
            alert("Задание еще не выполнено!");
        }
    },
    
    // Открыть социальную ссылку
    doSocialTask: function(id) {
        const task = TASKS_CONFIG[id];
        if (!task || task.type !== 'social' || (state.tasks[id] && state.tasks[id].completed)) return;
        
        // Открываем ссылку и сразу считаем задание выполненным (упрощенная модель)
        window.open(task.url, '_blank');
        state.bones += task.reward;
        state.tasks[id] = { progress: 1, completed: true };

        this.updateTasksUI();
        updateUI();
        alert(`Спасибо за подписку! Награда ${task.reward} костей получена.`);
    },

    // Обновление UI заданий
    updateTasksUI: function() {
        this.checkProgress(); // Пересчитываем прогресс перед отрисовкой
        const container = document.getElementById('tasks-list');
        container.innerHTML = '';

        for (const id in TASKS_CONFIG) {
            const task = TASKS_CONFIG[id];
            const taskState = state.tasks[id] || { progress: 0, completed: false };

            const isCompleted = taskState.completed;
            const canClaim = taskState.progress >= 1 && !isCompleted;

            const taskEl = document.createElement('div');
            taskEl.className = `task-card ${isCompleted ? 'completed' : ''}`;
            
            let buttonHtml = '';
            if (task.type === 'social' && !isCompleted) {
                buttonHtml = `<button class="btn-secondary" onclick="TaskManager.doSocialTask('${id}')">Перейти</button>`;
            } else {
                buttonHtml = `<button class="btn-secondary" onclick="TaskManager.claimReward('${id}')" ${!canClaim ? 'disabled' : ''}>Забрать</button>`;
            }

            taskEl.innerHTML = `
                <div class="task-info">
                    <h4>${task.title}</h4>
                    <p>${task.description}</p>
                    <div class="task-reward">+${task.reward} <i class="fas fa-bone"></i></div>
                </div>
                <div class="task-action">
                    ${isCompleted ? '<i class="fas fa-check-circle"></i>' : buttonHtml}
                </div>
            `;
            container.appendChild(taskEl);
        }
    }
};
