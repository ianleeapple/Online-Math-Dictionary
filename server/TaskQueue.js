const mysql = require('mysql2/promise');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const aiConfig = require('./aiConfig');

const sanitizeTextField = (value) => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed) return null;
  const lowered = trimmed.toLowerCase();
  if (lowered === 'null' || lowered === 'undefined') {
    return null;
  }
  return trimmed;
};

const normalizeArrayInput = (input) => {
  if (input == null) return [];

  let workingValue = input;
  if (typeof input === 'string') {
    const trimmed = input.trim();
    if (!trimmed) return [];

    try {
      const parsed = JSON.parse(trimmed);
      workingValue = Array.isArray(parsed) ? parsed : trimmed.split(',');
    } catch (err) {
      workingValue = trimmed.includes('\n') ? trimmed.split(/\r?\n/) : trimmed.split(',');
    }
  }

  if (!Array.isArray(workingValue)) {
    workingValue = [workingValue];
  }

  return workingValue
    .map((item) => {
      if (item == null) return '';
      if (typeof item === 'string') return item.trim();
      return String(item).trim();
    })
    .filter(Boolean);
};

const prepareArrayForStorage = (input) => {
  const normalized = normalizeArrayInput(input);
  return normalized.length > 0 ? JSON.stringify(normalized) : null;
};

/**
 * AI 題目生成任務佇列處理器
 * 負責背景處理大量題目生成任務，避免 HTTP 請求 timeout
 */
class TaskQueue {
  constructor(dbConfig) {
    this.dbConfig = dbConfig;
    this.isProcessing = false;
    this.pollInterval = 5000; // 每 5 秒檢查一次佇列
  this.maxRetries = 3; // 單題最多重試 3 次
  this.backoffBaseMs = 2000; // 重試的基礎延遲時間
    this.timeoutMs = 45000; // 單題生成超時 45 秒（比 routes.js 多一點時間）
    
    // 初始化 Gemini AI
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error('GEMINI_API_KEY 未設定');
    }
    this.genAI = new GoogleGenerativeAI(apiKey);
    
    // 使用 aiConfig 的設定
  this.modelName = aiConfig.geminiModel || 'gemini-2.5-flash';
  this.fallbackModelName = 'gemini-2.5-flash-lite';
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
      let successfulCount = 0;

      for (let i = 0; i < task.total_count; i++) {
        try {
          console.log(`[TaskQueue] 生成第 ${i + 1}/${task.total_count} 題...`);
          
          const generatedQuestion = await this.generateSingleQuestion(sourceQuestion);
          
          // 加上 AI 標記並存入資料庫
          const contentWithTag = generatedQuestion.content + ' (AI生成)';

          const analysisText = sanitizeTextField(
            generatedQuestion.analysis || generatedQuestion.fullData?.analysis
          );
          const solutionConceptJson = prepareArrayForStorage(
            generatedQuestion.solutionConcept || generatedQuestion.fullData?.solution_concept
          );
          const detailedStepsJson = prepareArrayForStorage(
            generatedQuestion.detailedSteps || generatedQuestion.fullData?.detailed_steps
          );
          
          // 插入題目主表
          const [insertResult] = await connection.query(
            `INSERT INTO question 
             (level, topic, concept, content, image_url, type, answer, analysis, solution_concept, detailed_steps, difficulty)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
              sourceQuestion.level,
              sourceQuestion.topic,
              sourceQuestion.concept,
              contentWithTag,
              null, // AI 生成的題目目前不包含圖片
              generatedQuestion.type || sourceQuestion.type,
              generatedQuestion.answer || '',
              analysisText,
              solutionConceptJson,
              detailedStepsJson,
              generatedQuestion.difficulty || sourceQuestion.difficulty
            ]
          );
          
          const newQuestionId = insertResult.insertId;
          
          // 如果是選擇題，插入選項並更新答案為內容
          if ((generatedQuestion.type === 'single' || generatedQuestion.type === 'multiple') && 
              generatedQuestion.choices && generatedQuestion.choices.length > 0) {
            
            const choices = generatedQuestion.choices;
            const correctAnswer = generatedQuestion.answer || '';
            
            console.log(`[TaskQueue] 原始選項:`, choices);
            console.log(`[TaskQueue] 正確答案:`, correctAnswer);
            
            // 清理選項：移除可能的選項編號前綴
            const cleanedChoices = choices.map(choice => 
              choice.replace(/^[\(（]?[A-Za-z][\)）]?[\s\.]*/, '').trim()
            );
            
            console.log(`[TaskQueue] 清理後選項:`, cleanedChoices);
            
            // 隨機打亂選項順序
            const shuffledChoices = [...cleanedChoices];
            for (let j = shuffledChoices.length - 1; j > 0; j--) {
              const k = Math.floor(Math.random() * (j + 1));
              [shuffledChoices[j], shuffledChoices[k]] = [shuffledChoices[k], shuffledChoices[j]];
            }
            
            console.log(`[TaskQueue] 打亂後選項:`, shuffledChoices);
            
            // 插入選項到 question_options（不含前綴的純內容）
            for (let j = 0; j < shuffledChoices.length; j++) {
              await connection.query(
                'INSERT INTO question_options (question_id, option_order, option_content) VALUES (?, ?, ?)',
                [newQuestionId, j, shuffledChoices[j]]
              );
            }
            
            // 答案欄位直接儲存正確答案的內容（不是索引）
            // 對於多選題，答案可能是 "答案1,答案2" 格式
            await connection.query(
              'UPDATE question SET answer = ? WHERE id = ?',
              [correctAnswer, newQuestionId]
            );
            
            console.log(`[TaskQueue] 已插入 ${shuffledChoices.length} 個選項，正確答案內容: ${correctAnswer}`);
          }

          successfulCount += 1;

          // 更新已完成數量
          await connection.query(
            'UPDATE generation_tasks SET completed_count = ?, updated_at = NOW() WHERE id = ?',
            [successfulCount, task.id]
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

      const finalStatus = successfulCount === 0 ? 'failed' : 'completed';
      const statusMessage = `[TaskQueue] 任務 #${task.id} 處理結束，成功 ${successfulCount}/${task.total_count} 題`;

      await connection.query(
        'UPDATE generation_tasks SET status = ?, updated_at = NOW() WHERE id = ?',
        [finalStatus, task.id]
      );

      if (successfulCount === 0) {
        console.warn(`${statusMessage}（全部失敗）`);
      } else if (successfulCount < task.total_count) {
        console.warn(`${statusMessage}（部分失敗，詳見錯誤訊息）`);
      } else {
        console.log(`${statusMessage}`);
      }

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
      const usingFallbackModel = retryCount >= 2;
      const currentModelName = usingFallbackModel ? this.fallbackModelName : this.modelName;

      if (usingFallbackModel) {
        console.log(`[TaskQueue] 切換至備援模型 ${currentModelName}`);
      }

      const model = this.genAI.getGenerativeModel({ 
        model: currentModelName,
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
      let cleanAnswer = (generatedQuestion.answer || '').trim();

      const leadingMarkers = [
        /^答案\s*[為是:]?\s*/i,
        /^答案[:：]\s*/i,
        /^正確答案\s*[為是:]?\s*/i,
        /^選項\s*[\(（]?[A-Za-z]?[\)）]?\s*(?:[:：]|[為是])?\s*/i,
        /^選項\s*/i
      ];

      leadingMarkers.forEach(pattern => {
        cleanAnswer = cleanAnswer.replace(pattern, '').trim();
      });

      // 處理各種選項格式：
      // "選項(C):10" → "10"
      // "(C) 10" → "10"
      // "C: 10" → "10"
      // "答案是 (A)452元" → "452元"
      // 僅當前綴後仍有實質內容時才移除，以避免答案僅為選項字母
      const leadingOptionPattern = /^[\(（]?[A-Za-z][\)）]?[\.]?\s*/;
      if (leadingOptionPattern.test(cleanAnswer)) {
        const stripped = cleanAnswer.replace(leadingOptionPattern, '').trim();
        if (stripped.length > 0) {
          cleanAnswer = stripped;
        }
      }

      const colonOptionPattern = /^([A-Za-z])\s*[:：]\s*/;
      if (colonOptionPattern.test(cleanAnswer)) {
        const stripped = cleanAnswer.replace(colonOptionPattern, '').trim();
        if (stripped.length > 0) {
          cleanAnswer = stripped;
        }
      }

      console.log(`[TaskQueue] 原始答案: "${generatedQuestion.answer}" → 清理後: "${cleanAnswer}"`);

      // 轉換難度為中文
      const difficultyInChinese = generatedQuestion.difficulty 
        ? this.convertDifficultyToChinese(generatedQuestion.difficulty)
        : sourceQuestion.difficulty;

      const analysisText = sanitizeTextField(generatedQuestion.analysis);
      const solutionConceptArray = normalizeArrayInput(generatedQuestion.solution_concept);
      const detailedStepsArray = normalizeArrayInput(generatedQuestion.detailed_steps);

      // 返回符合資料庫格式的物件
      return {
        content: generatedQuestion.question,
        type: sourceQuestion.type,
        answer: cleanAnswer,
        difficulty: difficultyInChinese,
        choices: generatedQuestion.choices || null,
        analysis: analysisText,
        solutionConcept: solutionConceptArray,
        detailedSteps: detailedStepsArray,
        // 額外保存完整資料（未來可能需要）
        fullData: generatedQuestion
      };

    } catch (error) {
      const errorInfo = this.normalizeGenerativeError(error);
      const canRetry = retryCount < this.maxRetries && this.shouldRetry(errorInfo);

      if (canRetry) {
        const nextRetryCount = retryCount + 1;
        const delayMs = this.getBackoffDelay(retryCount, errorInfo);
        const fallbackNote = nextRetryCount >= 2 ? '，將改用備援模型' : '';
        console.warn(`[TaskQueue] 生成失敗 (${errorInfo.shortMessage})，${(delayMs / 1000).toFixed(1)} 秒後重試第 ${nextRetryCount} 次${fallbackNote}...`);
        await this.sleep(delayMs);
        return this.generateSingleQuestion(sourceQuestion, nextRetryCount);
      }

      if (errorInfo && errorInfo.fullMessage) {
        throw new Error(errorInfo.fullMessage);
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

  normalizeGenerativeError(error) {
    if (!error) {
      return null;
    }

    const status = error.status || error?.cause?.status || error?.response?.status;
    const code = error.code || error?.cause?.code;
    const message = error.message || '未知錯誤';
    let reason = '';

    if (error?.response?.promptFeedback?.blockReason) {
      reason = `Prompt 被阻擋: ${error.response.promptFeedback.blockReason}`;
    } else if (error?.response?.candidates?.[0]?.finishReason) {
      reason = `finishReason: ${error.response.candidates[0].finishReason}`;
    } else if (error?.cause?.message && error.cause.message !== message) {
      reason = error.cause.message;
    }

    const detailParts = [];
    if (status) detailParts.push(`狀態 ${status}`);
    if (code) detailParts.push(`代碼 ${code}`);
    if (reason) detailParts.push(reason);
    const detailText = detailParts.join(' / ');

    return {
      status,
      code,
      message,
      reason,
      shortMessage: detailText ? `${message} (${detailText})` : message,
      fullMessage: detailText ? `${message} (${detailText})` : message,
      original: error
    };
  }

  shouldRetry(errorInfo) {
    if (!errorInfo) {
      return false;
    }

    const lowerMessage = `${errorInfo.message || ''} ${errorInfo.reason || ''}`.toLowerCase();
    const statusNum = typeof errorInfo.status === 'string' ? parseInt(errorInfo.status, 10) : errorInfo.status;

    if (statusNum === 429) {
      return true;
    }

    if (statusNum && statusNum >= 500) {
      return true;
    }

    if (errorInfo.code && ['ECONNRESET', 'ETIMEDOUT', 'EAI_AGAIN'].includes(errorInfo.code)) {
      return true;
    }

    if (lowerMessage.includes('resource') && lowerMessage.includes('exhaust')) {
      return true;
    }

    if (lowerMessage.includes('temporarily') && lowerMessage.includes('unavailable')) {
      return true;
    }

    if (lowerMessage.includes('rate') && lowerMessage.includes('limit')) {
      return true;
    }

    if (lowerMessage.includes('busy')) {
      return true;
    }

    if (lowerMessage.includes('timeout') || lowerMessage.includes('超時')) {
      return true;
    }

    return false;
  }

  getBackoffDelay(retryCount, errorInfo) {
    const baseDelay = this.backoffBaseMs * Math.pow(2, retryCount);
    const jitter = Math.floor(Math.random() * 500);

    if (this.isRateLimitError(errorInfo)) {
      return baseDelay + 2000 + jitter;
    }

    return baseDelay + jitter;
  }

  isRateLimitError(errorInfo) {
    if (!errorInfo) {
      return false;
    }

    const lowerMessage = `${errorInfo.message || ''} ${errorInfo.reason || ''}`.toLowerCase();
    const statusNum = typeof errorInfo.status === 'string' ? parseInt(errorInfo.status, 10) : errorInfo.status;

    if (statusNum === 429) {
      return true;
    }

    return lowerMessage.includes('rate limit') || lowerMessage.includes('resource exhausted');
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
   * 輔助函數：難度轉換 (中文 → 英文，給 AI)
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
   * 輔助函數：難度反轉換 (英文 → 中文，給資料庫)
   */
  convertDifficultyToChinese(difficulty) {
    const map = {
      easy: '容易',
      medium: '中等',
      hard: '困難'
    };
    return map[difficulty] || '中等';
  }

  /**
   * 延遲函數
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

module.exports = TaskQueue;
