// Express 伺服器主程式
const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');
require('dotenv').config();

const app = express();

// 中介軟體 - 順序很重要
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 全域錯誤處理
process.on('uncaughtException', (err) => {
  console.error('未捕獲的異常:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('未處理的Promise拒絕:', err);
  process.exit(1);
});

// 靜態檔案服務
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// API 路由
app.use('/api', routes);

// 錯誤處理
app.use((err, req, res, next) => {
  console.error('伺服器錯誤:', err);
  res.status(500).json({ 
    success: false,
    message: '伺服器錯誤',
    error: err.message 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`伺服器運行於 port ${PORT}`);
  console.log(`API 端點: http://localhost:${PORT}/api`);
});

// 404 處理
app.use((req, res) => {
  console.log('404 Not Found:', req.method, req.url);
  res.status(404).json({ 
    success: false,
    message: 'API endpoint not found',
    path: req.url
  });
});