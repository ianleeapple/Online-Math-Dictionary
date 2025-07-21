const express = require('express');
const router = express.Router();
const pool = require('./db');

// 取得所有使用者
router.get('/users', async (req, res) => {
  const [rows] = await pool.query('SELECT id, name, email, role FROM users');
  res.json(rows);
});

// 取得所有成就
router.get('/achievements', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM achievement');
  res.json(rows);
});

// 取得所有測驗
router.get('/quizzes', async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM quiz');
  res.json(rows);
});

module.exports = router;
