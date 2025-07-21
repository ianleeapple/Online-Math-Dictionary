// Express 伺服器主程式
const express = require('express');
const cors = require('cors');
const app = express();
const port = 3001;

app.use(cors());
app.use(express.json());

// 範例 API
app.get('/api/hello', (req, res) => {
  res.json({ message: 'Hello from Express API!' });
});

const routes = require('./routes');
app.use('/api', routes);

// TODO: 加入 users、quiz、achievement 等路由

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});
