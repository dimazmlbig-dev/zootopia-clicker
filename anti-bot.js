let clickCount = 0;

function checkAntiBot() {
    clickCount++;
    if (clickCount >= 100) {
        const modal = document.getElementById('captchaModal');
        const q = document.getElementById('captchaQuestion');
        const n1 = Math.floor(Math.random() * 10);
        const n2 = Math.floor(Math.random() * 10);
        
        q.innerText = `${n1} + ${n2} = ?`;
        q.dataset.res = n1 + n2;
        modal.style.display = 'flex';
        clickCount = 0;
    }
}

function verifyCaptcha() {
    const ans = document.getElementById('captchaAnswer').value;
    const res = document.getElementById('captchaQuestion').dataset.res;
    
    if (ans == res) {
        document.getElementById('captchaModal').style.display = 'none';
        document.getElementById('captchaAnswer').value = '';
    } else {
        alert("Неправильно!");
    }
}
