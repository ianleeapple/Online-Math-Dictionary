const mysql = require('mysql2/promise');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const aiConfig = require('./aiConfig');

/**
 * AI 題目生成任務佇列處理器
 * 負責背景處理大量題目生成任務，避免 HTTP 請求 timeout
 */
class TaskQueue {
  constructor(dbConfig) {
    this.dbConfig = dbConfig;
    this.isProcessing = false;
    this.pollInterval = 5000; // 每 5 秒檢查一次佇列
    this.maxRetries = 2; // 單題最多重試 2 次
    this.timeoutMs = 45000; // 單題生成超時 45 秒（比 routes.js 多一點時間）
    
    // 初始化 Gemini AI
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY 未設定');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // 使用 aiConfig 的設定
    this.modelName = aiConfig.geminiModel || 'gemini-2.5-flash';
    this.generationConfig = {
      temperature: aiConfig.temperature || 0.7,
    };
    
    if (aiConfig.maxTokens) {
      this.generationConfig.maxOutputTokens = aiConfig.maxTokens;
    }
    
    console.log('[TaskQueue] 任務佇列處理器已初始化');
    console.log(`[TaskQueue] 使用模型: ${this.modelName}`);
    console.log(`[TaskQueue] Temperature: ${this.generationConfig.temperature}`);
  }

  /**
   * 啟動佇列處理器
   */
  start() {
    console.log('[TaskQueue] 開始監聽任務佇列...');
    this.pollTasks();
  }

  /**
   * 輪詢檢查並處理 pending 任務
   */
  async pollTasks() {
    if (this.isProcessing) {
      // 如果正在處理，跳過這次輪詢
      setTimeout(() => this.pollTasks(), this.pollInterval);
      return;
    }

    try {
      const connection = await mysql.createConnection(this.dbConfig);
      
      // 查詢最舊的 pending 任務
      const [tasks] = await connection.query(
        'SELECT * FROM generation_tasks WHERE status = ? ORDER BY created_at ASC LIMIT 1',
        ['pending']
      );

      if (tasks.length > 0) {
        const task = tasks[0];
        console.log(`[TaskQueue] 發現待處理任務 #${task.id}，共 ${task.total_count} 題`);
        await this.processTask(task, connection);
      }

      await connection.end();
    } catch (error) {
      console.error('[TaskQueue] 輪詢錯誤:', error);
    }

    // 繼續下一次輪詢
    setTimeout(() => this.pollTasks(), this.pollInterval);
  }

  /**
   * 處理單一任務
   */
  async processTask(task, connection) {
    this.isProcessing = true;

    try {
      // 更新任務狀態為 processing
      await connection.query(
        'UPDATE generation_tasks SET status = ?, updated_at = NOW() WHERE id = ?',
        ['processing', task.id]
      );

      console.log(`[TaskQueue] 開始處理任務 #${task.id}`);

      // 取得原始題目資料
      const [questions] = await connection.query(
        'SELECT * FROM question WHERE id = ?',
        [task.source_question_id]
      );

      if (questions.length === 0) {
        throw new Error('找不到原始題目');
      }

      const sourceQuestion = questions[0];
      console.log(`[TaskQueue] 原始題目: ${sourceQuestion.content.substring(0, 50)}...`);

      // 逐一生成題目
      for (let i = 0; i < task.total_count; i++) {
        try {
          console.log(`[TaskQueue] 生成第 ${i + 1}/${task.total_count} 題...`);
          
          const generatedQuestion = await this.generateSingleQuestion(sourceQuestion);
          
          // 加上 AI 標記並存入資料庫
          const contentWithTag = generatedQuestion.content + ' (AI生成)';
          
          await connection.query(
            'INSERT INTO question (level, topic, concept, content, image_url, type, answer, difficulty) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
            [
              sourceQuestion.level,
              sourceQuestion.topic,
              sourceQuestion.concept,
              contentWithTag,
              null, // AI 生成的題目目前不包含圖片
              generatedQuestion.type || sourceQuestion.type,
              generatedQuestion.answer || '',
              generatedQuestion.difficulty || sourceQuestion.difficulty
            ]
          );

          // 更新已完成數量
          await connection.query(
            'UPDATE generation_tasks SET completed_count = ?, updated_at = NOW() WHERE id = ?',
            [i + 1, task.id]
          );

          console.log(`[TaskQueue] 第 ${i + 1} 題已完成並存入資料庫`);
          
          // 延遲 1 秒，避免 API rate limit
          await this.sleep(1000);
          
        } catch (error) {
          console.error(`[TaskQueue] 生成第 ${i + 1} 題失敗:`, error.message);
          
          // 記錄錯誤但繼續處理其他題目
          const errorMsg = `第 ${i + 1} 題失敗: ${error.message}`;
          await connection.query(
            'UPDATE generation_tasks SET error_message = CONCAT(IFNULL(error_message, ""), ?, "\n"), updated_at = NOW() WHERE id = ?',
            [errorMsg, task.id]
          );
        }
      }

      // 更新任務狀態為 completed
      await connection.query(
        'UPDATE generation_tasks SET status = ?, updated_at = NOW() WHERE id = ?',
        ['completed', task.id]
      );

      console.log(`[TaskQueue] 任務 #${task.id} 已完成，共生成 ${task.completed_count} 題`);

    } catch (error) {
      console.error(`[TaskQueue] 任務 #${task.id} 處理失敗:`, error);
      
      // 更新任務狀態為 failed
      await connection.query(
        'UPDATE generation_tasks SET status = ?, error_message = ?, updated_at = NOW() WHERE id = ?',
        ['failed', error.message, task.id]
      );
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * 使用 AI 生成單一類題（帶 timeout 和重試）
   * 使用與 routes.js 相同的邏輯
   */
  async generateSingleQuestion(sourceQuestion, retryCount = 0) {
    try {
      // 建立 Prompt（使用 aiConfig）
      const { systemPrompt, userPrompt } = aiConfig.getPrompts({
        template: sourceQuestion.content,
        type: this.getTypeText(sourceQuestion.type),
        variations: 1, // 一次只生成一題
        difficulty: this.getDifficultyText(sourceQuestion.difficulty),
        options_template: '',
        constraints: `必須與原題目屬於相同的範圍 (${sourceQuestion.level})、主題 (${sourceQuestion.topic}) 和觀念 (${sourceQuestion.concept})`
      });

      const fullPrompt = `${systemPrompt}\n\n${userPrompt}\n\n請務必以有效的 JSON 格式回應，不要包含任何額外說明文字。格式如下：\n{"generated": [{"question": "...", "answer": "...", "analysis": "...", "solution_concept": [...], "detailed_steps": [...], "difficulty": "...", "choices": [...]}]}`;

      console.log(`[TaskQueue] Prompt 長度: ${fullPrompt.length} 字元`);

      // 設定 timeout 並呼叫 API
      const model = this.genAI.getGenerativeModel({ 
        model: this.modelName,
        generationConfig: this.generationConfig
      });

      // 使用 Promise.race 實現 timeout
      const result = await Promise.race([
        model.generateContent(fullPrompt),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('生成超時')), this.timeoutMs)
        )
      ]);

      const response = await result.response;
      console.log(`[TaskQueue] ✅ API 呼叫成功`);

      // 取得回應文字
      let responseText = '';
      try {
        responseText = response.text();
      } catch (textError) {
        // 手動提取
        if (response.candidates?.[0]?.content?.parts?.[0]?.text) {
          responseText = response.candidates[0].content.parts[0].text;
        } else {
          throw new Error('無法取得回應文字');
        }
      }

      console.log(`[TaskQueue] 回應長度: ${responseText.length} 字元`);

      // 檢查安全過濾
      if (!responseText || responseText.trim().length === 0) {
        if (response.promptFeedback?.blockReason) {
          throw new Error(`Prompt 被阻擋: ${response.promptFeedback.blockReason}`);
        }
        if (response.candidates?.[0]?.finishReason === 'SAFETY') {
          throw new Error('回應被安全過濾器阻擋');
        }
        throw new Error('AI 回應為空');
      }

      // 清理並解析 JSON
      responseText = responseText.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();

      const parsedResult = JSON.parse(responseText);

      if (!parsedResult.generated || parsedResult.generated.length === 0) {
        throw new Error('AI 回應中沒有生成的題目');
      }

      const generatedQuestion = parsedResult.generated[0];

      // 驗證必要欄位
      if (!generatedQuestion.question) {
        throw new Error('生成的題目缺少 question 欄位');
      }

      // 處理答案：移除選項標記，只保留答案內容
      let cleanAnswer = generatedQuestion.answer || '';
      
      // 處理各種選項格式：
      // "選項(C):10" → "10"
      // "(C) 10" → "10"
      // "C: 10" → "10"
      // "答案是 C" → "C"
      cleanAnswer = cleanAnswer
        .replace(/^選項\s*[\(（]?([A-Za-z]?)[\)）]?\s*[:：]\s*/i, '') // 移除 "選項(C):" 或 "選項C:"
        .replace(/^[\(（]?([A-Za-z])[\)）]\s*[:：]?\s*/i, '')         // 移除 "(C):" 或 "(C)"
        .replace(/^([A-Za-z])\s*[:：]\s*/i, '')                       // 移除 "C:"
        .trim();

      console.log(`[TaskQueue] 原始答案: "${generatedQuestion.answer}" → 清理後: "${cleanAnswer}"`);

      // 返回符合資料庫格式的物件
      return {
        content: generatedQuestion.question,
        type: sourceQuestion.type,
        answer: cleanAnswer,
        difficulty: sourceQuestion.difficulty,
        // 額外保存完整資料（未來可能需要）
        fullData: generatedQuestion
      };

    } catch (error) {
      // 如果失敗且還有重試次數
      if (retryCount < this.maxRetries) {
        console.log(`[TaskQueue] 生成失敗，重試第 ${retryCount + 1} 次...`);
        await this.sleep(2000);
        return this.generateSingleQuestion(sourceQuestion, retryCount + 1);
      }

      throw error;
    }
  }

  /**
   * 建立 AI 提示詞（舊版，已廢棄）
   */
  buildPrompt(sourceQuestion) {
    return `請根據以下題目，生成一道類似的數學題目。

原始題目:
範圍: ${sourceQuestion.level}
主題: ${sourceQuestion.topic}
觀念: ${sourceQuestion.concept}
題目內容: ${sourceQuestion.content}
題型: ${sourceQuestion.type}
難度: ${sourceQuestion.difficulty}

要求:
1. 生成的題目必須與原題目屬於相同的範圍、主題和觀念
2. 保持相同的題型 (${sourceQuestion.type}) 和難度 (${sourceQuestion.difficulty})
3. 題目應該具有相似的結構和解題概念，但數字、情境或表達方式要有變化
4. 確保題目有明確的答案

請以 JSON 格式回應，格式如下:
{
  "content": "題目內容",
  "type": "${sourceQuestion.type}",
  "answer": "答案",
  "difficulty": "${sourceQuestion.difficulty}"
}

只需要回傳 JSON，不需要其他說明。`;
  }

  /**
   * 解析 AI 回應（舊版，已廢棄）
   */
  parseAIResponse(text) {
    try {
      // 移除可能的 markdown 程式碼區塊標記
      let cleaned = text.trim();
      if (cleaned.startsWith('```json')) {
        cleaned = cleaned.substring(7);
      }
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.substring(3);
      }
      if (cleaned.endsWith('```')) {
        cleaned = cleaned.substring(0, cleaned.length - 3);
      }
      
      const parsed = JSON.parse(cleaned.trim());
      
      // 驗證必要欄位
      if (!parsed.content) {
        throw new Error('缺少 content 欄位');
      }
      
      return parsed;
      
    } catch (error) {
      console.error('[TaskQueue] 解析 AI 回應失敗:', text);
      throw new Error('AI 回應格式錯誤');
    }
  }

  /**
   * 輔助函數：題型轉換
   */
  getTypeText(type) {
    const map = {
      single: '單選題',
      multiple: '多選題',
      fill: '填充題'
    };
    return map[type] || type;
  }

  /**
   * 輔助函數：難度轉換
   */
  getDifficultyText(difficulty) {
    const map = {
      '容易': 'easy',
      '中等': 'medium',
      '困難': 'hard',
      '魔王': 'hard'
    };
    return map[difficulty] || 'medium';
  }

  /**
   * 延遲函數
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = TaskQueue;
