const express = require('express');
const router = express.Router();
const pool = require('./db');
const { hashPassword, verifyPassword } = require('./auth');
const path = require('path');
const fs = require('fs');

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

// ========================================================
// 影片生成 API (實驗功能)
// ========================================================
router.post('/video/generate', async (req, res) => {
  console.log('影片生成 API 被呼叫，請求內容:', req.body);
  
  try {
    const { question, script, audioUrl, style = 'simple', options = {} } = req.body;
    
    if (!question || !script) {
      return res.status(400).json({ error: 'Question and script are required.' });
    }
    
    console.log('開始生成影片...');
    console.log('影片樣式:', style);
    console.log('場景數量:', script.scenes.length);
    
    // 使用 VideoGenerator 生成真實影片
    const videoGenerator = new VideoGenerator();
    const videoResult = await videoGenerator.generateMathVideo(question, script, style, options);
    
    res.status(200).json({
      success: true,
      videoUrl: videoResult.videoUrl,
      videoId: videoResult.videoId,
      duration: videoResult.duration,
      size: videoResult.size,
      message: '影片生成完成'
    });
    
  } catch (error) {
    console.error('影片生成錯誤:', error);
    res.status(500).json({ 
      error: 'Failed to generate video', 
      details: error.message 
    });
  }
});

// 引入影片生成器
const VideoGenerator = require('./video/VideoGenerator');

// 提供影片檔案的靜態服務
router.get('/video/file/:videoId', (req, res) => {
  try {
    const { videoId } = req.params;
    const videoPath = path.join(__dirname, 'output', 'videos', `${videoId}.mp4`);
    
    // 檢查檔案是否存在
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: '影片檔案不存在' });
    }
    
    // 設置正確的 MIME 類型
    res.setHeader('Content-Type', 'video/mp4');
    res.setHeader('Content-Disposition', `inline; filename="${videoId}.mp4"`);
    
    // 支援範圍請求 (用於影片播放)
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error('提供影片檔案時發生錯誤:', error);
    res.status(500).json({ error: '無法提供影片檔案' });
  }
});

// 提供影片檔案服務
router.get('/video/:videoId', (req, res) => {
  try {
    const { videoId } = req.params;
    const videoPath = path.join(__dirname, 'video', 'output', `${videoId}.mp4`);
    
    // 檢查檔案是否存在
    if (!fs.existsSync(videoPath)) {
      return res.status(404).json({ error: '影片檔案不存在' });
    }
    
    // 設定適當的 headers
    const stat = fs.statSync(videoPath);
    const fileSize = stat.size;
    const range = req.headers.range;
    
    if (range) {
      // 支援部分內容請求 (用於視頻播放)
      const parts = range.replace(/bytes=/, "").split("-");
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
      const chunksize = (end - start) + 1;
      const file = fs.createReadStream(videoPath, { start, end });
      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': 'video/mp4',
      };
      res.writeHead(200, head);
      fs.createReadStream(videoPath).pipe(res);
    }
  } catch (error) {
    console.error('影片服務錯誤:', error);
    res.status(500).json({ error: '影片服務失敗' });
  }
});

module.exports = router;

const aiConfig = require('./aiConfig');

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
        analysis: '此為假資料，因未設定 API 金鑰。',
        solution_concept: ['1. 確認金鑰'],
        detailed_steps: ['2. 於 .env 檔案中設定 OPENAI_API_KEY'],
        difficulty: difficulty || 'medium',
        choices: type === '單選題' || type === '多選題' ? ['A. 選項一', 'B. 選項二', 'C. 選項三', 'D. 選項四'] : null
      });
    }
    return res.json({ generated: result });
  }

  // 串接 OpenAI
  try {
    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey });

    // --- 1. 從設定檔取得參數 ---
    const modelName = aiConfig.modelOverride || aiConfig.models[difficulty] || aiConfig.models.medium;
    const { systemPrompt, userPrompt } = aiConfig.getPrompts({
      template,
      type,
      variations: count,
      difficulty,
      options_template,
      constraints
    });

    // --- 2. 呼叫 API ---
    const completion = await openai.chat.completions.create({
      model: modelName,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: "json_object" },
      temperature: aiConfig.temperature,
      max_tokens: aiConfig.maxTokens
    });
    
    // 嘗試解析回應
    let responseText = completion.choices[0].message.content;
    const result = JSON.parse(responseText);
    res.json(result);
  } catch (error) {
    console.error('AI 生成失敗:', error);
    res.status(500).json({ message: 'AI 生成失敗', error: error.message });
  }
});

// ========================================================
// TTS 文字轉語音 API
// ========================================================
router.post('/tts/generate', async (req, res) => {
  console.log('TTS API 被呼叫，請求內容:', req.body);
  
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('OpenAI API key 未設定');
    return res.status(500).json({ error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.' });
  }

  try {
    const { text, voice = 'alloy' } = req.body;

    if (!text || text.trim() === '') {
      console.error('文字參數缺失或為空');
      return res.status(400).json({ error: 'Parameter "text" is required and cannot be empty.' });
    }

    console.log('開始生成語音，文字:', text.substring(0, 50) + '...', '語音:', voice);

    const OpenAI = require('openai');
    const openai = new OpenAI({ apiKey });

    // 呼叫 OpenAI 的語音生成 API
    const mp3 = await openai.audio.speech.create({
      model: "tts-1",
      voice: voice,
      input: text,
    });

    console.log('語音生成成功，準備傳送音訊檔');

    // 設定回應標頭，告訴瀏覽器這是一個 MP3 音訊檔
    res.setHeader('Content-Type', 'audio/mpeg');
    res.setHeader('Content-Disposition', 'inline; filename="speech.mp3"');
    
    // 將 OpenAI 的回應轉換為 Buffer 並傳送
    const buffer = Buffer.from(await mp3.arrayBuffer());
    console.log('音訊檔案大小:', buffer.length, 'bytes');
    
    if (buffer.length === 0) {
      throw new Error('收到空的音訊檔案');
    }
    
    res.send(buffer);
    console.log('音訊檔案已成功傳送給前端');

  } catch (error) {
    console.error('TTS Generation Error:', error);
    
    // 更詳細的錯誤處理
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({ error: 'OpenAI API quota exceeded. Please check your billing.' });
    } else if (error.code === 'invalid_api_key') {
      return res.status(401).json({ error: 'Invalid OpenAI API key.' });
    } else {
      return res.status(500).json({ 
        error: 'Failed to generate audio', 
        details: error.message || 'Unknown error'
      });
    }
  }
});
