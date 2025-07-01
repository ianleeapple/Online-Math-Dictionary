// server.js (Express 伺服器入口)
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3000;

const userRoutes = require('./routes/users'); // 使用者相關 API

// 啟用 CORS，允許前端（Vue）跨來源請求
app.use(cors());

// 解析 JSON 請求體，例如 POST 傳來的帳號密碼等資料
app.use(express.json());

// 所有與使用者有關的 API，統一掛在 /api/users 路徑底下
app.use('/api/users', userRoutes);

// 啟動伺服器，監聽指定的 port
app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

//use quiz api
const quizRoutes = require('./routes/quiz');
app.use('/api/quiz', quizRoutes);

