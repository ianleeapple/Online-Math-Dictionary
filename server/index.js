// Express 伺服器主程式
const express = require('express');
const cors = require('cors');
const path = require('path');
const routes = require('./routes');

const app = express();

// 中介軟體
app.use(cors());
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
    message: '伺服器錯誤',
    error: err.message 
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`伺服器運行於 port ${PORT}`);
  console.log(`API 端點: http://localhost:${PORT}/api`);
});
