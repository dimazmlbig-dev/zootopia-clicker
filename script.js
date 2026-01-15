// Переключение табов
function showTab(index) {
    const tabs = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.nav-btn');
    
    tabs.forEach(t => t.classList.remove('active'));
    buttons.forEach(b => b.classList.remove('active'));
    
    tabs[index].classList.add('active');
    buttons[index].classList.add('active');
    
    if (window.Telegram?.WebApp) {
        Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
}

// Копирование рефералки
function copyReferralLink() {
    const linkInput = document.getElementById('referralLink');
    linkInput.select();
    document.execCommand('copy');
    
    if (window.Telegram?.WebApp) {
        Telegram.WebApp.showAlert("Ссылка скопирована!");
    } else {
        alert("Скопировано!");
    }
}

// Инициализация ID при старте
window.addEventListener('load', () => {
    const userIdEl = document.getElementById('userId');
    const refInput = document.getElementById('referralLink');
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    
    if (user) {
        userIdEl.innerText = user.id;
        refInput.value = `https://t.me/zooclikbot?start=${user.id}`;
    } else {
        userIdEl.innerText = "LocalHost";
        refInput.value = "https://t.me/zooclikbot?start=12345";
    }
});
