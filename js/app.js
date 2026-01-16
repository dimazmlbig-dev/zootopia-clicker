// Обработка тапа
document.getElementById('tap-zone').addEventListener('touchstart', (e) => {
    e.preventDefault();
    
    // Проверка энергии
    if (state.energy >= state.tapCost) {
        const touch = e.touches[0];
        
        // 1. Рассчитываем силу удара (база + NFT)
        let power = state.tapPower;
        
        // Проверяем надетые слои (активны ли они)
        if (document.getElementById('layer-glasses').classList.contains('active')) power += 5;
        if (document.getElementById('layer-hat').classList.contains('active')) power += 15;

        // 2. Обновляем состояние
        state.bones += power;
        state.zoo += (power * 0.0001);
        state.energy -= state.tapCost;

        // 3. Визуальные эффекты
        createParticle(touch.clientX, touch.clientY, `+${power}`);
        createRipple(touch.clientX, touch.clientY);
        
        // Хэптик (вибрация) для Telegram
        if (window.Telegram.WebApp.HapticFeedback) {
            window.Telegram.WebApp.HapticFeedback.impactOccurred('medium');
        }

        updateUI();
    } else {
        // Эффект тряски, если нет энергии
        document.getElementById('tap-zone').classList.add('shake');
        setTimeout(() => document.getElementById('tap-zone').classList.remove('shake'), 300);
    }
});

function createParticle(x, y, text) {
    const p = document.createElement('div');
    p.className = 'tap-particle';
    p.innerText = text;
    p.style.left = `${x - 10}px`;
    p.style.top = `${y - 20}px`;
    document.body.appendChild(p);
    
    setTimeout(() => p.remove(), 800);
}

function createRipple(x, y) {
    const r = document.createElement('div');
    r.className = 'tap-glow';
    // Центрируем относительно места нажатия
    r.style.left = `${x - 100}px`;
    r.style.top = `${y - 100}px`;
    document.body.appendChild(r);
    
    setTimeout(() => r.remove(), 400);
}
