// routes/users.js 負責註冊、登入、登出 包含 JWT 驗證的使用者管理功能
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const mysql = require('mysql2/promise');

// JWT 密鑰（實際上應儲存在環境變數中）   !尚未處理
const JWT_SECRET = 'your_jwt_secret_key';

// 建立資料庫連線（依實際資料庫設定修改）   !尚未處理(沒資料庫)
const dbConfig = {
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'math_platform'
};

// 註冊使用者（學生或老師）
router.post('/register', async (req, res) => {
  const { role, name, email, password } = req.body;
  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      'INSERT INTO users (role, name, email, password) VALUES (?, ?, ?, ?)',
      [role, name, email, hashedPassword]
    );
    conn.end();
    res.status(201).json({ message: '註冊成功' });
  } catch (err) {
    res.status(500).json({ error: '註冊失敗', details: err });
  }
});

// 使用者登入
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute(
      'SELECT * FROM users WHERE email = ?',
      [email]
    );
    conn.end();

    if (rows.length === 0) return res.status(401).json({ error: '帳號不存在' });

    const user = rows[0];
    const match = await bcrypt.compare(password, user.password);

    if (!match) return res.status(401).json({ error: '密碼錯誤' });

    const token = jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
    res.json({ message: '登入成功', token, user: { id: user.id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: '登入失敗', details: err });
  }
});

// 使用者登出（前端處理即可，此為形式 API）
router.post('/logout', (req, res) => {
  res.json({ message: '已登出' });
});

// 驗證 token 並取得當前使用者資訊
router.get('/me', async (req, res) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: '缺少授權憑證' });

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const conn = await mysql.createConnection(dbConfig);
    const [rows] = await conn.execute('SELECT id, name, email, role FROM users WHERE id = ?', [decoded.id]);
    conn.end();

    if (rows.length === 0) return res.status(404).json({ error: '使用者不存在' });

    res.json({ user: rows[0] });
  } catch (err) {
    res.status(401).json({ error: '無效或過期的 Token' });
  }
});

module.exports = router;
