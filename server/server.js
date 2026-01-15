const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../')));

// Хранилище данных (в реальном проекте используйте БД)
const users = {};
const leaderboard = [];

// Античит: максимальное количество кликов в секунду
const MAX_CPS = 50;

// Валидация данных
function validateUserData(data) {
    const { telegramId, totalClicks, tokens } = data;
    
    if (!telegramId || typeof telegramId !== 'number') {
        return { valid: false, error: 'Invalid telegramId' };
    }
    
    if (totalClicks < 0 || !Number.isInteger(totalClicks)) {
        return { valid: false, error: 'Invalid totalClicks' };
    }
    
    if (tokens < 0 || typeof tokens !== 'number') {
        return { valid: false, error: 'Invalid tokens' };
    }
    
    return { valid: true };
}

// API: Синхронизация игры
app.post('/api/sync', (req, res) => {
    try {
        const { telegramId, totalClicks, tokens, balance, playerLevel, clicksPerSecond } = req.body;
        
        // Валидация данных
        const validation = validateUserData({ telegramId, totalClicks, tokens });
        if (!validation.valid) {
            return res.status(400).json({ error: validation.error });
        }
        
        // Античит: проверка скорости кликов
        if (clicksPerSecond > MAX_CPS) {
            console.log(`Cheat detected for user ${telegramId}: CPS = ${clicksPerSecond}`);
            return res.status(403).json({ 
                error: 'Cheat detected', 
                details: 'Click speed too high',
                maxCPS: MAX_CPS 
            });
        }
        
        // Античит: проверка разницы в кликах
        if (users[telegramId]) {
            const previous = users[telegramId];
            const timeDiff = Date.now() - previous.lastSync;
            const clicksDiff = totalClicks - previous.totalClicks;
            const maxClicks = Math.floor((timeDiff / 1000) * MAX_CPS) + 100; // +100 как буфер
            
            if (clicksDiff > maxClicks) {
                console.log(`Cheat detected for user ${telegramId}: ${clicksDiff} clicks in ${timeDiff}ms`);
                return res.status(403).json({ 
                    error: 'Cheat detected', 
                    details: 'Impossible click count increase'
                });
            }
        }
        
        // Сохраняем данные пользователя
        users[telegramId] = {
            ...req.body,
            lastSync: Date.now(),
            ip: req.ip
        };
        
        // Обновляем таблицу лидеров
        updateLeaderboard(telegramId, totalClicks, tokens);
        
        res.json({ 
            success: true, 
            message: 'Game synced successfully',
            serverTime: Date.now()
        });
        
    } catch (error) {
        console.error('Sync error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API: Получение таблицы лидеров
app.get('/api/leaderboard', (req, res) => {
    try {
        const topPlayers = leaderboard
            .sort((a, b) => b.totalClicks - a.totalClicks)
            .slice(0, 100)
            .map(player => ({
                telegramId: player.telegramId,
                totalClicks: player.totalClicks,
                tokens: player.tokens,
                playerLevel: player.playerLevel
            }));
        
        res.json({ leaderboard: topPlayers });
    } catch (error) {
        console.error('Leaderboard error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API: Статистика игры
app.get('/api/stats', (req, res) => {
    try {
        const totalPlayers = Object.keys(users).length;
        const totalClicks = Object.values(users).reduce((sum, user) => sum + user.totalClicks, 0);
        const totalTokens = Object.values(users).reduce((sum, user) => sum + user.tokens, 0);
        const onlinePlayers = Object.values(users).filter(user => Date.now() - user.lastSync < 300000).length;
        
        res.json({
            totalPlayers,
            totalClicks,
            totalTokens,
            onlinePlayers,
            serverUptime: process.uptime()
        });
    } catch (error) {
        console.error('Stats error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API: Покупка предметов
app.post('/api/purchase', (req, res) => {
    try {
        const { telegramId, itemId, itemName, price, wallet } = req.body;
        
        if (!telegramId || !itemId || !price) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Логируем покупку
        console.log(`Purchase: User ${telegramId} bought ${itemName} for ${price} tokens`);
        
        // Здесь можно добавить валидацию покупки, проверку баланса и т.д.
        
        res.json({ 
            success: true, 
            message: 'Purchase recorded',
            transactionId: 'tx_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9)
        });
        
    } catch (error) {
        console.error('Purchase error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// API: Верификация кошелька
app.post('/api/verify-wallet', (req, res) => {
    try {
        const { telegramId, walletAddress } = req.body;
        
        if (!telegramId || !walletAddress) {
            return res.status(400).json({ error: 'Missing required fields' });
        }
        
        // Простая валидация TON адреса
        const tonAddressRegex = /^[A-Za-z0-9_-]{48}$/;
        if (!tonAddressRegex.test(walletAddress)) {
            return res.status(400).json({ error: 'Invalid TON address' });
        }
        
        // Сохраняем связь telegramId -> walletAddress
        if (users[telegramId]) {
            users[telegramId].walletAddress = walletAddress;
            users[telegramId].walletVerified = true;
            users[telegramId].walletVerificationDate = Date.now();
        }
        
        res.json({ 
            success: true, 
            message: 'Wallet verified',
            verified: true 
        });
        
    } catch (error) {
        console.error('Wallet verification error:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

// Вспомогательная функция: обновление таблицы лидеров
function updateLeaderboard(telegramId, totalClicks, tokens) {
    const existingIndex = leaderboard.findIndex(player => player.telegramId === telegramId);
    
    if (existingIndex !== -1) {
        leaderboard[existingIndex].totalClicks = totalClicks;
        leaderboard[existingIndex].tokens = tokens;
        leaderboard[existingIndex].lastUpdate = Date.now();
    } else {
        leaderboard.push({
            telegramId,
            totalClicks,
            tokens,
            lastUpdate: Date.now()
        });
    }
}

// Отдача статических файлов
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../index.html'));
});

// Запуск сервера
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
    console.log(`Game available at http://localhost:${PORT}`);
});

// Обработка завершения
process.on('SIGINT', () => {
    console.log('Shutting down server...');
    // Здесь можно сохранить данные в файл
    fs.writeFileSync(
        path.join(__dirname, 'backup.json'),
        JSON.stringify({ users, leaderboard, timestamp: Date.now() }, null, 2)
    );
    process.exit(0);
});
