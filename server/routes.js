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
const { GoogleGenerativeAI } = require('@google/generative-ai');

// AI 類題生成測試 API (使用 Google Gemini)
router.post('/ai/generate', async (req, res) => {
  const { template, type, variations, difficulty, options_template, constraints } = req.body;
  const count = variations || 3;
  const apiKey = process.env.GEMINI_API_KEY;
  
  // 若沒設金鑰則回傳假資料
  if (!apiKey) {
    const result = [];
    for (let i = 0; i < count; i++) {
      result.push({
        question: `【AI生成】${template || '題目'}（變體${i + 1}）`,
        answer: '42',
        analysis: '此為假資料，因未設定 API 金鑰。',
        solution_concept: ['1. 確認金鑰'],
        detailed_steps: ['2. 於 .env 檔案中設定 GEMINI_API_KEY'],
        difficulty: difficulty || 'medium',
        choices: type === '單選題' || type === '多選題' ? ['A. 選項一', 'B. 選項二', 'C. 選項三', 'D. 選項四'] : null
      });
    }
    return res.json({ generated: result });
  }

  // 串接 Google Gemini
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    
    // --- 1. 從設定檔取得參數 ---
    const modelName = aiConfig.geminiModel || 'gemini-pro';
    const { systemPrompt, userPrompt } = aiConfig.getPrompts({
      template,
      type,
      variations: count,
      difficulty,
      options_template,
      constraints
    });

    // --- 2. 取得模型實例 ---
    const generationConfig = {
      temperature: aiConfig.temperature || 0.7,
    };
    
    // 只有設定 maxTokens 時才加入限制（否則使用模型預設上限）
    if (aiConfig.maxTokens) {
      generationConfig.maxOutputTokens = aiConfig.maxTokens;
      console.log('Token 限制:', aiConfig.maxTokens);
    } else {
      console.log('Token 限制: 無上限（使用模型預設）');
    }
    
    const model = genAI.getGenerativeModel({ 
      model: modelName,
      generationConfig
    });

    // --- 3. 組合完整的 Prompt (Gemini 不分 system 和 user) ---
    const fullPrompt = `${systemPrompt}\n\n${userPrompt}\n\n請務必以有效的 JSON 格式回應，不要包含任何額外說明文字。格式如下：\n{"generated": [{"question": "...", "answer": "...", "analysis": "...", "solution_concept": [...], "detailed_steps": [...], "difficulty": "...", "choices": [...]}]}`;

    console.log('Prompt 長度:', fullPrompt.length, '字元');
    console.log('Prompt 前 300 字元:', fullPrompt.substring(0, 300));
    
    // --- 4. 呼叫 API（帶重試和降級機制）---
    console.log('呼叫 Google Gemini API...');
    console.log('使用模型:', modelName);
    
    let result, response;
    let currentModel = modelName;
    const maxRetries = 2;
    const fallbackModels = ['gemini-2.5-flash', 'gemini-1.5-flash', 'gemini-1.5-pro'];
    
    // 重試邏輯
    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        const model = genAI.getGenerativeModel({ 
          model: currentModel,
          generationConfig
        });
        
        result = await model.generateContent(fullPrompt);
        response = await result.response;
        console.log(`✅ API 呼叫成功 (模型: ${currentModel}, 嘗試: ${attempt + 1})`);
        break; // 成功就跳出
        
      } catch (error) {
        console.error(`❌ API 呼叫失敗 (嘗試 ${attempt + 1}/${maxRetries}):`, error.message);
        
        // 503 錯誤：模型過載
        if (error.status === 503 || error.message.includes('overloaded')) {
          if (attempt < maxRetries - 1) {
            // 嘗試降級到其他模型
            const nextModelIndex = fallbackModels.indexOf(currentModel) + 1;
            if (nextModelIndex < fallbackModels.length) {
              currentModel = fallbackModels[nextModelIndex];
              console.log(`⚠️ 模型過載，降級到: ${currentModel}`);
              await new Promise(resolve => setTimeout(resolve, 1000)); // 等待 1 秒
              continue;
            } else {
              console.log('⏳ 等待 2 秒後重試...');
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          }
        }
        
        // 最後一次嘗試還是失敗，拋出錯誤
        if (attempt === maxRetries - 1) {
          throw new Error(`AI 生成失敗 (${maxRetries} 次嘗試): ${error.message}`);
        }
      }
    }
    
    if (!response) {
      throw new Error('API 沒有返回有效回應');
    }
    
    // 詳細除錯資訊
    console.log('\n完整回應結構:');
    console.log('- candidates:', response.candidates?.length || 0);
    console.log('- promptFeedback:', JSON.stringify(response.promptFeedback));
    
    if (response.candidates && response.candidates.length > 0) {
      const candidate = response.candidates[0];
      console.log('- finishReason:', candidate.finishReason);
      console.log('- safetyRatings:', JSON.stringify(candidate.safetyRatings));
      console.log('- content parts:', candidate.content?.parts?.length || 0);
    }
    
    let responseText = '';
    try {
      responseText = response.text();
    } catch (textError) {
      console.error('無法取得 text():', textError.message);
      
      // 嘗試手動提取文字
      if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
        responseText = response.candidates[0].content.parts[0].text;
        console.log('手動提取到文字內容');
      }
    }
    
    console.log('Gemini 原始回應:', responseText.substring(0, 500));
    console.log('回應長度:', responseText.length);
    
    // 檢查空回應
    if (!responseText || responseText.trim().length === 0) {
      console.error('Gemini 回傳空白回應');
      
      // 檢查是否被安全過濾器阻擋
      if (response.promptFeedback?.blockReason) {
        return res.status(400).json({ 
          message: 'Prompt 被安全過濾器阻擋', 
          error: `Block reason: ${response.promptFeedback.blockReason}`,
          promptFeedback: response.promptFeedback
        });
      }
      
      if (response.candidates?.[0]?.finishReason === 'SAFETY') {
        return res.status(400).json({ 
          message: '回應被安全過濾器阻擋', 
          error: 'Response blocked by safety filters',
          safetyRatings: response.candidates[0].safetyRatings
        });
      }
      
      return res.status(500).json({ 
        message: 'AI 回應為空', 
        error: 'Gemini returned empty response',
        finishReason: response.candidates?.[0]?.finishReason || 'UNKNOWN'
      });
    }
    
    // 清理回應文字 (移除可能的 markdown 代碼塊標記)
    responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    
    console.log('清理後的回應:', responseText.substring(0, 200) + '...');
    
    // 嘗試解析回應
    try {
      const parsedResult = JSON.parse(responseText);
      res.json(parsedResult);
    } catch (parseError) {
      console.error('JSON 解析失敗:', parseError.message);
      
      // 嘗試修復常見的 JSON 格式問題
      try {
        console.log('[JSON 修復] 嘗試修復 LaTeX 轉義問題...');
        
        // 方法 1: 找到 JSON 的開始和結束
        const jsonStart = responseText.indexOf('{');
        const jsonEnd = responseText.lastIndexOf('}');
        
        if (jsonStart !== -1 && jsonEnd !== -1 && jsonStart < jsonEnd) {
          let fixedText = responseText.substring(jsonStart, jsonEnd + 1);
          
          // 方法 2: 修復 LaTeX 公式中的轉義問題
          // 將字串中的 LaTeX 公式部分暫時替換為佔位符
          const latexPattern = /\\\\?\([^)]*\\\\?\)/g;
          const latexFormulas = [];
          let formulaIndex = 0;
          
          fixedText = fixedText.replace(latexPattern, (match) => {
            const placeholder = `__LATEX_FORMULA_${formulaIndex}__`;
            latexFormulas.push(match);
            formulaIndex++;
            return placeholder;
          });
          
          // 現在可以安全解析 JSON
          const parsedResult = JSON.parse(fixedText);
          
          // 將佔位符還原為 LaTeX 公式
          const restoreLatex = (obj) => {
            if (typeof obj === 'string') {
              let result = obj;
              latexFormulas.forEach((formula, index) => {
                result = result.replace(`__LATEX_FORMULA_${index}__`, formula);
              });
              return result;
            } else if (Array.isArray(obj)) {
              return obj.map(restoreLatex);
            } else if (typeof obj === 'object' && obj !== null) {
              const restored = {};
              for (const key in obj) {
                restored[key] = restoreLatex(obj[key]);
              }
              return restored;
            }
            return obj;
          };
          
          const restoredResult = restoreLatex(parsedResult);
          console.log('[JSON 修復] 成功修復並解析');
          return res.json(restoredResult);
        }
      } catch (fixError) {
        console.error('[JSON 修復] 修復失敗:', fixError.message);
      }
      
      // 修復失敗，返回原始錯誤
      console.error('原始文字:', responseText);
      return res.status(500).json({ 
        message: 'AI 回應格式錯誤', 
        error: parseError.message,
        rawResponse: responseText.substring(0, 500) // 回傳前 500 字元供除錯
      });
    }
    
  } catch (error) {
    console.error('AI 生成失敗:', error);
    res.status(500).json({ message: 'AI 生成失敗', error: error.message });
  }
});

// ========================================================
// ========================================================
// TTS 文字轉語音 API (支援 Gemini TTS、OpenAI TTS)
// ========================================================
router.post('/tts/generate', async (req, res) => {
  console.log('TTS API 被呼叫，請求內容:', req.body);
  
  try {
    const { text, voice = 'alloy', provider = 'gemini' } = req.body;

    if (!text || text.trim() === '') {
      console.error('文字參數缺失或為空');
      return res.status(400).json({ error: 'Parameter "text" is required and cannot be empty.' });
    }

    console.log('開始生成語音，提供者:', provider, '文字:', text.substring(0, 50) + '...', '語音:', voice);

    let audioBuffer;

    // ========== OpenAI TTS ==========
    if (provider === 'openai') {
      const apiKey = process.env.OPENAI_API_KEY;
      if (!apiKey) {
        console.error('OpenAI API key 未設定');
        return res.status(500).json({ error: 'OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.' });
      }

      const OpenAI = require('openai');
      const openai = new OpenAI({ apiKey });

      // 呼叫 OpenAI 的語音生成 API
      const mp3 = await openai.audio.speech.create({
        model: "tts-1",
        voice: voice,
        input: text,
      });

      audioBuffer = Buffer.from(await mp3.arrayBuffer());
    } 
    // ========== Gemini TTS (實驗性功能) ==========
    else if (provider === 'gemini') {
      const apiKey = process.env.GEMINI_API_KEY;
      if (!apiKey) {
        console.error('Gemini API key 未設定');
        return res.status(500).json({ 
          error: 'Gemini API key not configured. Please set GEMINI_API_KEY in your .env file.',
          hint: '取得金鑰: https://makersuite.google.com/app/apikey'
        });
      }

      try {
        const { GoogleGenerativeAI } = require('@google/generative-ai');
        const genAI = new GoogleGenerativeAI(apiKey);

        // 使用 Gemini 2.5 Flash TTS 模型（正確格式）
        const modelName = 'gemini-2.5-flash-preview-tts';
        const model = genAI.getGenerativeModel({ 
          model: modelName,
          generationConfig: {
            responseModalities: ['AUDIO']  // 關鍵：必須在這裡指定音訊模式
          }
        });

        console.log(`[Gemini TTS] 使用模型: ${modelName}`);
        console.log(`[Gemini TTS] 文字長度: ${text.length} 字元`);
        
        // 生成語音（Gemini TTS 會回傳 PCM 格式）
        const result = await model.generateContent({
          contents: [{
            role: 'user',
            parts: [{ text: text }]
          }]
        });
        
        const response = result.response;

        // 從回應中提取音訊資料（PCM 格式）
        if (response.candidates && response.candidates[0]) {
          const part = response.candidates[0].content?.parts?.[0];
          const audioContent = part?.inlineData?.data;
          const mimeType = part?.inlineData?.mimeType;
          
          if (!audioContent) {
            throw new Error('Gemini TTS 回應中沒有音訊資料');
          }
          
          console.log(`[Gemini TTS] 格式: ${mimeType}`);
          
          // Gemini 返回的是 PCM 格式，需要加上 WAV header
          const pcmBuffer = Buffer.from(audioContent, 'base64');
          
          // 將 PCM 轉換為 WAV 格式
          // Gemini TTS 規格: 24kHz, 16-bit, Mono
          const sampleRate = 24000;
          const numChannels = 1;
          const bitsPerSample = 16;
          const byteRate = sampleRate * numChannels * bitsPerSample / 8;
          const blockAlign = numChannels * bitsPerSample / 8;
          const dataSize = pcmBuffer.length;
          const fileSize = 36 + dataSize;
          
          const wavHeader = Buffer.alloc(44);
          wavHeader.write('RIFF', 0);
          wavHeader.writeUInt32LE(fileSize, 4);
          wavHeader.write('WAVE', 8);
          wavHeader.write('fmt ', 12);
          wavHeader.writeUInt32LE(16, 16);
          wavHeader.writeUInt16LE(1, 20);
          wavHeader.writeUInt16LE(numChannels, 22);
          wavHeader.writeUInt32LE(sampleRate, 24);
          wavHeader.writeUInt32LE(byteRate, 28);
          wavHeader.writeUInt16LE(blockAlign, 32);
          wavHeader.writeUInt16LE(bitsPerSample, 34);
          wavHeader.write('data', 36);
          wavHeader.writeUInt32LE(dataSize, 40);
          
          audioBuffer = Buffer.concat([wavHeader, pcmBuffer]);
          
          console.log(`[Gemini TTS] WAV 檔案大小: ${(audioBuffer.length / 1024).toFixed(2)} KB`);
          
          // 設定為 WAV 格式
          res.setHeader('Content-Type', 'audio/wav');
        } else {
          throw new Error('Gemini TTS 回應格式不正確或沒有音訊資料');
        }
      } catch (geminiError) {
        console.error('[Gemini TTS] 失敗，錯誤詳情:', geminiError.message);
        
        // 如果 Gemini TTS 失敗，自動回退到 OpenAI TTS
        if (process.env.OPENAI_API_KEY) {
          console.log('[Gemini TTS] 自動回退到 OpenAI TTS');
          
          const OpenAI = require('openai');
          const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

          const mp3 = await openai.audio.speech.create({
            model: "tts-1",
            voice: 'nova',
            input: text,
          });

          audioBuffer = Buffer.from(await mp3.arrayBuffer());
          console.log(`[OpenAI TTS] 備用方案成功，檔案大小: ${(audioBuffer.length / 1024).toFixed(2)} KB`);
          res.setHeader('Content-Type', 'audio/mpeg');
        } else {
          throw new Error(`Gemini TTS 失敗且沒有 OpenAI 備用: ${geminiError.message}`);
        }
      }
    }
    else {
      return res.status(400).json({ error: 'Invalid provider. Use "openai" or "gemini".' });
    }

    console.log('語音生成成功，音訊檔案大小:', audioBuffer.length, 'bytes');
    
    if (audioBuffer.length === 0) {
      throw new Error('收到空的音訊檔案');
    }

    // 設定回應標頭（Gemini 已在上面設定 Content-Type）
    if (provider !== 'gemini') {
      res.setHeader('Content-Type', 'audio/mpeg');
    }
    res.setHeader('Content-Disposition', `inline; filename="speech.${provider === 'gemini' ? 'wav' : 'mp3'}"`);
    res.send(audioBuffer);
    
    console.log('音訊檔案已成功傳送給前端');

  } catch (error) {
    console.error('TTS Generation Error:', error);
    
    // 更詳細的錯誤處理
    if (error.code === 'insufficient_quota') {
      return res.status(429).json({ error: 'API quota exceeded. Please check your billing.' });
    } else if (error.code === 'invalid_api_key') {
      return res.status(401).json({ error: 'Invalid API key.' });
    } else {
      return res.status(500).json({ 
        error: 'Failed to generate audio', 
        details: error.message || 'Unknown error'
      });
    }
  }
});

module.exports = router;