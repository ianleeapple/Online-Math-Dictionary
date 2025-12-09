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

【要求】:
1. **不要只念字**:要像真正的老師一樣解釋、引導、提問
2. **加入教學停頓**:用 <pause/> 標記重要停頓點(思考時間)
3. **語氣標記**:用 <emphasis> 強調重點,<slow> 放慢講解難點
4. **數字讀法**:必須使用標準中文讀法(一、二、三、四、五、六、七、八、九、十),嚴禁使用軍事讀法(幺、倆、洞、拐)
5. **語音風格**:
   - 使用台灣國語的自然語調,避免過於標準的中國普通話
   - 語氣要親切、輕鬆,不要過於嚴肅正式
   - 用口語化的方式表達,像是和朋友聊天一樣
6. **場景分割**:只有「步驟場景(steps)」需要分割,其他場景不分割
   - 步驟場景:每 5 個步驟分成一個場景 (type: "steps", "steps-2", "steps-3"...)
   - 如果第 5 個步驟內容較長(超過一行),允許延伸到 6-7 行
   - 概念場景:不需要分割,保持在同一個場景
7. **內容格式**:
   - 解題概念:如果內容沒有編號,前端會自動加上(1. 2. 3.),所以不要重複加編號
   - 步驟:只寫內容即可,不要加"步驟 1:"、"步驟 2:"等前綴,前端會自動加編號(1. 2. 3...)
8. **教學技巧**:
   - 開場:引起興趣,提出問題
   - 分析:用提問引導思考,不直接給答案
   - 概念:用生活例子類比,降低抽象感
   - 步驟:逐步講解,強調關鍵轉折點
   - 答案:總結要點,留下深刻印象

【原始腳本】：
${JSON.stringify(videoScript, null, 2)}

【輸出格式】（JSON）：
{
  "scenes": [
    {
      "type": "intro|analysis|concept|concept-2|steps|steps-2|steps-3|answer",
      "visualContent": "畫面上的文字內容(最多3-5行,超過則拆分成多個場景)",
      "narrative": "教學旁白(帶 SSML 標記)",
      "duration": 估計時長(秒),
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
  "totalDuration": 總時長(秒)
}

【場景分割範例】：
不好(單一場景包含 8 個步驟,畫面會擠壓):
{
  "type": "steps",
  "visualContent": "步驟 1: ...\n步驟 2: ...\n步驟 3: ...\n步驟 4: ...\n步驟 5: ...\n步驟 6: ...\n步驟 7: ...\n步驟 8: ...",
  "narrative": "我們來看步驟一到八..."
}

好(拆分成 2 個場景,每 5 步驟一組,第 5 步允許較長,不加"步驟"前綴):
{
  "type": "steps",
  "visualContent": "設定複利終值公式: $P_n = P_0(1+r)^n$,其中 $P_n$ 是期末金額, $P_0$ 是期初本金, $r$ 是年利率, $n$ 是期數\n定義題目中的變數: 期末目標金額 $P_n = 500000$ 元, 年利率 $r = 4\\% = 0.04$, 期數 $n = 15$ 年\n將變數代入公式: $500000 = P_0(1 + 0.04)^{15}$\n將公式變形以解出 $P_0$: $P_0 = \\frac{500000}{(1.04)^{15}}$\n計算 $(1.04)^{15}$ 的值。假設使用計算器或對數表得 $(1.04)^{15} \\approx 1.8009435$ (此步驟較長,允許延伸)",
  "narrative": "首先我們來看前五個步驟...",
  "duration": 12
},
{
  "type": "steps-2",
  "visualContent": "進行除法運算以求得初始本金: $P_0 = 500000 \\div 1.8009435 \\approx 277597.98$ 元\n依題目要求四捨五入至整數: $P_0 \\approx 277598$ 元",
  "narrative": "繼續看最後兩個步驟...",
  "duration": 6
}

【概念場景範例】(不分割,前端會自動加編號):
{
  "type": "concept",
  "visualContent": "辨識問題為複利計算,但需反推初始本金(現值)\n應用複利終值公式並變形為現值公式\n將已知條件代入公式,並計算冪次\n進行除法運算以求得初始本金,並依要求四捨五入",
  "narrative": "...",
  "duration": 10
}

【重要】：
- 只有「步驟場景」需要分割,概念場景保持完整
- 每個分割場景必須有獨立的 narrative (語音旁白)
- 每 5 個步驟分成一個場景,第 5 步驟允許較長(可到 6-7 行)
- 步驟內容不要加"步驟 1:"、"步驟 2:"前綴,直接寫內容,前端會自動加編號
- 解題概念內容不要加編號,前端會自動處理

【旁白範例】(使用台灣口語風格)：
不好："我們來看這道題目。根據題意，x 的平方等於 9。"
[旁白範例]：
[不好]："我們來看這道題目。根據題意，x 的平方等於 9。"
[好]："注意看<pause/>這道題目雖然簡單<pause/>但是藏著一個<emphasis>關鍵陷阱</emphasis>。<pause/>我們一起來思考<pause/>x 的平方等於 9<pause/>那 x 可能是多少呢？<pause duration='long'/>對了<pause/>別忘了<emphasis>負數的平方也是正數</emphasis><pause/>所以答案有兩個。"

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
