const express = require('express'); // 引入 Express
const app = express(); // 建立 Express 應用程式

// 設定首頁路由
app.get('/', (req, res) => {
    res.send('Working!');
});

// 啟動伺服器
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});