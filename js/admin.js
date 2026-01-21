// --- Модуль "Мастер аккаунта" ---

const AdminManager = {
    
    ADMIN_USER_ID: 1720219688, // ВАШ ID
    WALLET_ADDRESS: 'UQCJRRRYnrs_qsA2AgIE71dPsHf_-AKaZV9UMeT4vBbh6Yes', // ВАШ КОШЕЛЕК

    init: function(user) {
        if (user && user.id === this.ADMIN_USER_ID) {
            this.createAdminButton();
        }
        // Здесь в будущем будет инициализация формы и т.д.
    },

    // Создает секретную кнопку "Админ" в навигации
    createAdminButton: function() {
        const nav = document.querySelector('.bottom-nav');
        if (!nav) return;

        const adminButton = document.createElement('button');
        adminButton.className = 'nav-item';
        adminButton.setAttribute('onclick', "showTab('admin')");
        adminButton.innerHTML = `<i class="fas fa-user-shield"></i><span>Админ</span>`;
        
        nav.appendChild(adminButton);
    }
    
    // В будущем здесь будут функции для создания NFT и т.д.
};
