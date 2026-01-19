// --- Логика Обменника ---

const SwapManager = {
    // Курс обмена: сколько костей нужно за 1 токен ZOO
    SWAP_RATE: 1000,

    init: function() {
        const input = document.getElementById('swap-input');
        const swapButton = document.getElementById('btn-perform-swap');

        if(input && swapButton) {
            input.addEventListener('input', this.handleInput.bind(this));
            swapButton.addEventListener('click', this.performSwap.bind(this));
        }
    },

    // Обновляет UI при открытии вкладки
    updateUI: function() {
        document.getElementById('swap-user-bones').innerText = Math.floor(state.bones);
        this.handleInput(); // Пересчитываем значения на случай, если баланс изменился
    },

    // Обработка ввода в поле
    handleInput: function() {
        const input = document.getElementById('swap-input');
        const output = document.getElementById('swap-output');
        if(!input || !output) return;
        
        const amount = parseInt(input.value) || 0;

        if (amount <= 0) {
            output.innerText = "0.00";
            return;
        }

        const result = amount / this.SWAP_RATE;
        output.innerText = result.toFixed(4);
    },

    // Выполнение обмена
    performSwap: function() {
        const amount = parseInt(document.getElementById('swap-input').value) || 0;

        if (amount <= 0) {
            alert("Введите корректное количество костей.");
            return;
        }

        if (state.bones < amount) {
            alert("У вас недостаточно костей для обмена!");
            return;
        }

        const receivedZoo = amount / this.SWAP_RATE;

        // Обновляем глобальное состояние
        state.bones -= amount;
        state.zoo += receivedZoo;

        alert(`Вы успешно обменяли ${amount} костей на ${receivedZoo.toFixed(4)} $ZOO!`);

        // Обновляем все затронутые интерфейсы
        updateUI(); // Обновляет баланс в хедере
        this.updateUI(); // Обновляет баланс на странице обмена
        document.getElementById('swap-input').value = ''; // Очищаем поле ввода
    }
};
