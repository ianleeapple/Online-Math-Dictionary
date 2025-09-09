const express = require('express');
const router = express.Router();
const pool = require('./db');
const { hashPassword, verifyPassword } = require('./auth');

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
  
  try {
    // 將密碼進行雜湊處理
    const hashedPassword = await hashPassword(password);
    
    const [result] = await pool.query(
      'INSERT INTO users (name, email, password, role, school, birthday) VALUES (?, ?, ?, ?, ?, ?)', 
      [name, email, hashedPassword, role, school, birthday]
    );
    
    res.status(201).json({ id: result.insertId, name, email, role });
  } catch (error) {
    // 處理 email 重複等錯誤
    console.error('註冊失敗:', error); // 在後端顯示詳細錯誤
    if (error.code === 'ER_DUP_ENTRY') {
      return res.status(409).json({ message: '此 Email 已被註冊' });
    }
    res.status(500).json({ message: '資料庫錯誤', error: error.message });
  }
});

// 使用者登入
router.post('/login', async (req, res) => {
  const { email, password, role } = req.body;
  try {
    // 先取得使用者資料（包含雜湊密碼）
    const [rows] = await pool.query(
      'SELECT id, name, email, role, school, birthday, password FROM users WHERE email = ? AND role = ?',
      [email, role]
    );
    
    if (rows.length === 0) {
      return res.status(401).json({ message: '帳號或身份不正確' });
    }
    
    const user = rows[0];
    
    // 驗證密碼
    const isPasswordValid = await verifyPassword(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: '密碼錯誤' });
    }
    
    // 絕對不要在回應中包含密碼！
    res.status(200).json({ 
      message: '登入成功', 
      user: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role,
        school: user.school,
        birthday: user.birthday
        // 注意：這裡故意不包含密碼
      }
    });
  } catch (error) {
    console.error('登入失敗:', error);
    res.status(500).json({ message: '資料庫錯誤', error: error.message });
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

// AI 類題生成測試 API
router.post('/ai/generate', async (req, res) => {
  const { template, type, variations, difficulty, options_template, constraints } = req.body;
  const count = variations || 3;
  const apiKey = process.env.OPENAI_API_KEY;
  // 若沒設金鑰則回傳假資料
  if (!apiKey) {
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push({
        question: `【AI生成】${template || '題目'}（變體${i + 1}）`,
        answer: '42',
        solution_steps: ['步驟一', '步驟二', '步驟三'],
        difficulty: difficulty || 'medium',
        choices: type === '單選題' || type === '多選題' ? ['A. 選項一', 'B. 選項二', 'C. 選項三', 'D. 選項四'] : []
      });
    }
    return res.json({ generated: result });
  }

  // 串接 OpenAI
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey });

    // 組合 prompt
    let userPrompt = `原始題目：${template}\n題型：${type}\n難度：${difficulty}\n`;
    if (options_template) userPrompt += `選項範例：\n${options_template}\n`;
    if (constraints) userPrompt += `額外限制：\n${constraints}\n`;
    userPrompt += `\n請根據以上題目生成${count}個類似但不同的題目，輸出為JSON格式：\n` +
      `{"generated":[{"question":"題目內容","answer":"正確答案","solution_steps":["步驟1","步驟2"],"difficulty":"easy|medium|hard","choices":["A. ..."]}]}`;

    const completion = await openai.chat.completions.create({
  model: 'gpt-3.5-turbo',   // 模型由此變更
  messages: [
    { role: 'system', content: '你是資深數學命題專家，請根據用戶提供的原始題目，生成多個「結構、敘述、解法邏輯皆有變化」的類似題目。請避免僅改變數字或名稱，應嘗試變換題目敘述方式、條件、數學概念或題型（如選填、應用、推理、圖形等）、增加或減少步驟、引入多步推理、隱含條件或設計陷阱，讓每題的解題過程有明顯不同並附上詳細解題步驟。若為選擇題，選項需具迷惑性且非僅數字變化。請以 JSON 格式輸出，範例：{"generated":[{"question":"題目內容","answer":"正確答案","solution_steps":["步驟1","步驟2"],"difficulty":"easy|medium|hard","choices":["A. ..."]}]}' },
    { role: 'user', content: userPrompt }
  ],
      temperature: 0.7,
      max_tokens: 2000
    });
    // 嘗試解析回應
    let responseText = completion.choices[0].message.content;
    let jsonMatch = responseText.match(/```json\n([\s\S]*?)\n```/) ||
                    responseText.match(/```([\s\S]*?)```/) ||
                    [null, responseText];
    const jsonContent = jsonMatch[1] || responseText;
    const result = JSON.parse(jsonContent);
    res.json(result);
  } catch (error) {
    console.error('AI 生成失敗:', error);
    res.status(500).json({ error: 'AI 生成失敗', details: error.message });
  }
});
