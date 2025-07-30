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

// 新增使用者 (註冊)
router.post('/users', async (req, res) => {
  const { name, email, password, role, school, birthday } = req.body;
  // 密碼應進行雜湊處理，這裡僅為示範
  try {
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, school, birthday) VALUES (?, ?, ?, ?, ?, ?)', 
      [name, email, password, role, school, birthday]
    );
    res.status(201).json({ id: result.insertId, name, email, role });
  } catch (error) {
    // 處理 email 重複等錯誤
    console.error('註冊失敗:', error); // 在後端顯示詳細錯誤
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: '此 Email 已被註冊' });
    }
    res.status(500).json({ message: '資料庫錯誤', error });
  }
});

// 新增測驗
router.post('/quizzes', async (req, res) => {
  // 假設 user_id 從 session 或 token 取得，這裡暫時寫死為 1
  const user_id = 1; 
  const { title, score, concept, difficulty, question_count, timing_mode, question_types } = req.body;
  try {
    const [result] = await pool.query(
      'INSERT INTO quiz (user_id, title, score, concept, difficulty, question_count, timing_mode, question_types) VALUES (?, ?, ?, ?, ?, ?, ?, ?)', 
      [user_id, title, score, concept, difficulty, question_count, timing_mode, JSON.stringify(question_types)]
    );
    res.status(201).json({ id: result.insertId, ...req.body });
  } catch (error) {
    res.status(500).json({ message: '資料庫錯誤', error });
  }
});

// 刪除使用者
router.delete('/users/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM users WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '找不到該使用者' });
    }
    res.status(200).json({ message: '使用者已刪除' });
  } catch (error) {
    res.status(500).json({ message: '資料庫錯誤', error });
  }
});

// 刪除測驗
router.delete('/quizzes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM quiz WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '找不到該測驗' });
    }
    res.status(200).json({ message: '測驗已刪除' });
  } catch (error) {
    res.status(500).json({ message: '資料庫錯誤', error });
  }
});

// 刪除班級
router.delete('/classes/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const [result] = await pool.query('DELETE FROM classes WHERE id = ?', [id]);
    if (result.affectedRows === 0) {
      return res.status(404).json({ message: '找不到該班級' });
    }
    res.status(200).json({ message: '班級已刪除' });
  } catch (error) {
    res.status(500).json({ message: '資料庫錯誤', error });
  }
});

module.exports = router;
