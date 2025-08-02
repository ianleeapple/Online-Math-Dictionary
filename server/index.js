// Express 伺服器主程式
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

// 全域錯誤處理
process.on('uncaughtException', (err) => {
  console.error('未捕獲的異常:', err);
  process.exit(1);
});

process.on('unhandledRejection', (err) => {
  console.error('未處理的Promise拒絕:', err);
  process.exit(1);
});

app.use(cors());
app.use(express.json());

// 範例 API
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express API!' });
});

const routes = require('./routes');
app.use('/api', routes);

// 錯誤處理中間件
app.use((err, req, res, next) => {
  console.error('Express 錯誤:', err);
  res.status(500).json({ message: '伺服器內部錯誤', error: err.message });
});

// TODO: 加入 users、quiz、achievement 等路由

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
}).on('error', (err) => {
  console.error('伺服器啟動失敗:', err);
});
