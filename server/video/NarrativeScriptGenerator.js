const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * 教學旁白腳本生成器
 * 使用 Gemini AI 生成帶有教學停頓感、引導性的旁白腳本
 */
class NarrativeScriptGenerator {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ 
      model: 'gemini-2.5-flash',
      generationConfig: {
        temperature: 0.8, // 稍高的創意度，讓旁白更自然
      }
    });
  }

  /**
   * 生成教學旁白腳本（不只是念字，而是真正的教學解說）
   * @param {Object} videoScript - 原始影片腳本
   * @returns {Promise<Object>} 帶有旁白的完整腳本
   */
  async generateNarrative(videoScript) {
    const prompt = `你是一位經驗豐富的數學老師，正在製作教學影片。
請根據以下影片腳本，生成適合教學的旁白內容。

【要求】：
1. **不要只念字**：要像真正的老師一樣解釋、引導、提問
2. **加入教學停頓**：用 <pause/> 標記重要停頓點（思考時間）
3. **語氣標記**：用 <emphasis> 強調重點，<slow> 放慢講解難點
4. **教學技巧**：
   - 開場：引起興趣，提出問題
   - 分析：用提問引導思考，不直接給答案
   - 概念：用生活例子類比，降低抽象感
   - 步驟：逐步講解，強調關鍵轉折點
   - 答案：總結要點，留下深刻印象

【原始腳本】：
${JSON.stringify(videoScript, null, 2)}

【輸出格式】（JSON）：
{
  "scenes": [
    {
      "type": "intro|analysis|concept|steps|answer",
      "visualContent": "畫面上的文字內容",
      "narrative": "教學旁白（帶 SSML 標記）",
      "duration": 估計時長（秒）,
      "timing": {
        "segments": [
          {
            "text": "這段話的內容",
            "startTime": 0.0,
            "endTime": 2.5,
            "emphasis": "normal|strong",
            "speed": "normal|slow"
          }
        ]
      }
    }
  ],
  "totalDuration": 總時長（秒）
}

【旁白範例】：
❌ 不好："我們來看這道題目。根據題意，x 的平方等於 9。"
[旁白範例]：
[不好]："我們來看這道題目。根據題意，x 的平方等於 9。"
[好]："同學們注意看<pause/>這道題目雖然簡單<pause/>但是藏著一個<emphasis>關鍵陷阱</emphasis>。<pause/>我們一起來思考<pause/>x 的平方等於 9<pause/>那 x 可能是多少呢？<pause duration='long'/>對了<pause/>別忘了<emphasis>負數的平方也是正數</emphasis><pause/>所以答案有兩個。"

請生成旁白腳本：`;

    try {
      // 帶重試和降級機制
      const maxRetries = 2;
      const fallbackModels = ['gemini-2.5-flash', 'gemini-2.0-flash'];
      let currentModel = 'gemini-2.5-flash';
      let result, response;
      
      for (let attempt = 0; attempt < maxRetries; attempt++) {
        try {
          const model = this.genAI.getGenerativeModel({ 
            model: currentModel,
            generationConfig: { temperature: 0.8 }
          });
          
          result = await model.generateContent(prompt);
          response = await result.response;
          console.log(`[AI 旁白] 成功 (模型: ${currentModel}, 嘗試: ${attempt + 1})`);
          break;
          
        } catch (error) {
          console.error(`[AI 旁白] 失敗 (嘗試 ${attempt + 1}/${maxRetries}):`, error.message);
          
          if (error.status === 503 || error.message.includes('overloaded')) {
            if (attempt < maxRetries - 1) {
              const nextModelIndex = fallbackModels.indexOf(currentModel) + 1;
              if (nextModelIndex < fallbackModels.length) {
                currentModel = fallbackModels[nextModelIndex];
                console.log(`[AI 旁白] 降級到: ${currentModel}`);
                await new Promise(resolve => setTimeout(resolve, 1000));
                continue;
              } else {
                console.log('[AI 旁白] 等待 2 秒後重試...');
                await new Promise(resolve => setTimeout(resolve, 2000));
              }
            }
          }
          
          if (attempt === maxRetries - 1) {
            throw error;
          }
        }
      }
      
      if (!response) {
        throw new Error('API 沒有返回有效回應');
      }
      
      let responseText = response.text();
      console.log('[AI 旁白] 原始回應前 200 字元:', responseText.substring(0, 200));
      
      // 清理 markdown 標記和其他可能的格式
      responseText = responseText
        .replace(/```json\n?/g, '')
        .replace(/```\n?/g, '')
        .replace(/^[\s\n]*/, '')  // 移除開頭空白
        .replace(/[\s\n]*$/, '')  // 移除結尾空白
        .trim();
      
      // 嘗試找到 JSON 物件的開始和結束
      const jsonStart = responseText.indexOf('{');
      const jsonEnd = responseText.lastIndexOf('}');
      
      if (jsonStart === -1 || jsonEnd === -1 || jsonStart > jsonEnd) {
        console.error('[AI 旁白] 無法找到有效的 JSON 結構');
        console.error('[AI 旁白] 清理後的回應:', responseText.substring(0, 300));
        throw new Error('API 返回的內容不包含有效的 JSON');
      }
      
      // 提取 JSON 部分
      const jsonText = responseText.substring(jsonStart, jsonEnd + 1);
      console.log('[AI 旁白] 提取的 JSON 前 200 字元:', jsonText.substring(0, 200));
      
      try {
        const narrative = JSON.parse(jsonText);
        return narrative;
      } catch (parseError) {
        console.error('[AI 旁白] JSON 解析失敗:', parseError.message);
        console.error('[AI 旁白] 嘗試解析的內容:', jsonText.substring(0, 500));
        throw new Error(`JSON 解析失敗: ${parseError.message}`);
      }
    } catch (error) {
      console.error('旁白腳本生成失敗:', error);
      throw error;
    }
  }

  /**
   * 將 SSML 標記轉換為 Gemini TTS 支援的格式
   * @param {string} text - 帶標記的文字
   * @returns {string} 格式化後的文字
   */
  convertToSSML(text) {
    // 將自定義標記轉換為 SSML
    let ssml = text;
    
    // <pause/> → 暫停
    ssml = ssml.replace(/<pause\s*\/>/g, ', '); // 短暫停
    ssml = ssml.replace(/<pause duration=['"]long['"]\s*\/>/g, '. '); // 長暫停
    
    // <emphasis> → 強調（用音調變化）
    ssml = ssml.replace(/<emphasis>(.*?)<\/emphasis>/g, '「$1」');
    
    // <slow> → 放慢（用句號增加停頓）
    ssml = ssml.replace(/<slow>(.*?)<\/slow>/g, '$1。');
    
    return ssml;
  }

  /**
   * 估算旁白時長（基於文字長度和標記）
   * @param {string} text - 旁白文字
   * @returns {number} 估計時長（秒）
   */
  estimateDuration(text) {
    // 移除所有標記，計算純文字長度
    const plainText = text.replace(/<[^>]+>/g, '');
    
    // 中文：平均 3-4 字/秒
    // 停頓標記：每個加 0.5-1 秒
    const chineseChars = (plainText.match(/[\u4e00-\u9fa5]/g) || []).length;
    const pauseCount = (text.match(/<pause/g) || []).length;
    const longPauseCount = (text.match(/duration=['"]long['"]/g) || []).length;
    
    const baseDuration = chineseChars / 3.5; // 基礎時長
    const pauseDuration = pauseCount * 0.5 + longPauseCount * 0.5; // 停頓時長
    
    return Math.ceil(baseDuration + pauseDuration);
  }
}

module.exports = NarrativeScriptGenerator;
