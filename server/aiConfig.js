require('dotenv').config();

/**
 * AI 生成功能的設定檔
 * 優先**--- 輸出格式 (必須嚴格遵守的 JSON 結構) ---**
請將所有生成的題目以一個 JSON 物件回傳，根物件需有名為 "generated" 的陣列。陣列中每個題目物件必須包含以下欄位：
*   question: (String) 完整的題目文字。
*   analysis: (String) 題目的核心概念解析，說明這題在考驗什麼數學知識點。
*   choices: (Array of Strings or null) 選項陣列。
*   answer: (String) 正確答案。
*   solution_concept: (Array of Strings) 解題的「概念」步驟，說明思考流程與應用的主要定理或公式，例如「先使用畢氏定理求出斜邊，再計算周長」。
*   detailed_steps: (Array of Strings) 極其詳細的「計算」步驟，必須遵循以下格式：
    - 列出主要公式（如：面積 = 長 * 寬）
    - 定義題目中的所有變數（如：長 = 10cm，寬 = 5cm）
    - 將變數代入公式（如：面積 = 10 * 5）
    - 逐步計算出最終結果（如：計算 10 * 5 = 50，最終答案為 50 平方公分、a²+b²=c² -> 3²+4²=c² -> 9+16=25 -> c=5）
    - **重要格式要求：**
      * 每個步驟應該是**不包含**任何數字編號或項目符號（如 '1.', 'a.', '*'）的純文字描述，前端會自動加上編號
      * 避免重複變數名稱，例如不要寫「計算初始市值 P：P = ...」，直接寫「計算初始市值 P = ...」即可
*   difficulty: (String) 題目的難度 ('easy', 'medium', 'hard')。

請開始生成。`;的設定，若無則使用此處的預設值。
 */
const aiConfig = {
  // --- 模型設定 ---
  // Google Gemini 模型選擇
  // 可選模型：https://ai.google.dev/gemini-api/docs/models?hl=zh-tw
  geminiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',

  // --- API 參數設定 ---
  // 溫度 (0.0 - 2.0)，越高回答越有創意，越低越穩定。數學建議 0.5 - 1.0。
  temperature: parseFloat(process.env.AI_TEMPERATURE) || 0.7,

  // 最大 Token 上限，用來控制單次呼叫的最高成本。
  // 設為 null 或 undefined = 無上限（使用模型預設最大值）
  maxTokens: process.env.AI_MAX_TOKENS ? parseInt(process.env.AI_MAX_TOKENS) : null,

  // --- Prompt 範本 ---
  // 將 System Prompt 和 User Prompt 的生成邏輯整合在一起
  getPrompts: (params) => {
    const { template, type, variations, difficulty, options_template, constraints } = params;

    const systemPrompt = `你是一位資深的數學命題教授與教科書作者，專精於設計具有鑑別度與教育意義的數學題目。你的任務是根據使用者提供的範本，生成 ${variations} 個高相似度但「解題核心不同」的衍生題。`;

    const userPrompt = `
請依據以下資訊進行命題：

**原始範本題目:**
\`\`\`
${template}
\`\`\`

**基本要求:**
*   **題型:** ${type}
*   **難度:** ${difficulty}
*   **生成數量:** ${variations}

**額外限制與提示:**
*   ${options_template ? `選擇題選項範本: ${options_template}` : '非選擇題'}
*   ${constraints ? `特別約束: ${constraints}` : '無特別約束'}

**--- 命題核心原則 (極重要) ---**
1.  **數值與情境變化 (必須執行):** 請務必修改題目中的數字（例如長寬高、數量、利率等），並適度調整情境（例如人名、物品），避免與原題完全相同。但需確保數字設計合理（例如能整除、符合現實）。
2.  **概念延伸與變化:** 在保持核心考點不變的前提下，可嘗試：
    *   將題目情境從純數學應用到物理或生活問題。
    *   增加一到兩個隱含條件，需要學生先推理才能解題。
    *   逆向提問，例如從答案反推原始條件。
    *   結合另一個相關的數學概念。
3.  **迷惑性選項 (選擇題適用):** 選項必須具有高迷惑性，應包含常見的計算錯誤、概念誤解或單位錯誤的結果。
4.  **嚴謹的解題步驟:** 分為「解題概念」（說明思路）和「解題步驟」（詳細計算），兩者都必須清晰、嚴謹。
5.  **MathJax 與符號使用規則:**
    *   所有數學變數、分數、根號、次方、總和 (Σ) 等符號，都必須使用 MathJax 格式，例如 \\(x^2 + y^2 = z^2\\) 或 \\[\\frac{a}{b}\\]。
    *   基礎的加減乘除運算，請直接使用半形符號 +, -, *, /，不要使用 \\plus, \\minus, \\times, \\div。
    *   **重要：在 JSON 字串中，反斜線必須使用雙反斜線跳脫，例如寫成 \\\\( 而不是 \\(，寫成 \\\\frac 而不是 \\frac。**

**--- 輸出格式 (必須嚴格遵守的 JSON 結構) ---**
請將所有生成的題目以一個 JSON 物件回傳，根物件需有名為 "generated" 的陣列。陣列中每個題目物件必須包含以下欄位：
*   \`question\`: (String) 完整的題目文字。
*   \`analysis\`: (String) 題目的核心概念解析，說明這題在考驗什麼數學知識點。
*   \`choices\`: (Array of Strings or null) 選項陣列。**如果題型是單選題，必須提供完整的 4 個選項；如果是多選題，必須提供完整的 5 個選項**。選項應包含：1 個或多個正確答案，以及具有高度迷惑性的錯誤選項（例如常見計算錯誤、單位錯誤、概念混淆等）。**重要：選項內容請直接提供答案文字，不要包含 (A), (B), A., B. 等選項編號前綴**。如果是填充題則為 null。
*   \`answer\`: (String) 正確答案。**請直接提供正確答案的完整內容文字（不含選項編號）**。對於多選題，如果有多個正確答案，請用逗號分隔各答案內容。
*   \`solution_concept\`: (Array of Strings) 解題的「概念」步驟，說明思考流程與應用的主要定理或公式，例如「先使用畢氏定理求出斜邊，再計算周長」。**重要：** 陣列中的每個步驟都應該是**不包含**任何數字編號或項目符號（如 '1.', 'a.', '*'）的純文字描述。前端會自動加上編號。
*   \`detailed_steps\`: (Array of Strings) 極其詳細的「計算」步驟，必須遵循以下格式：* 列出主要公式（如：面積 = 長 * 寬）。* 定義題目中的所有變數（如：長 = 10cm，寬 = 5cm）。* 將變數代入公式（如：面積 = 10 * 5）。* 逐步計算出最終結果（如：計算 10 * 5 = 50，最終答案為 50 平方公分、a²+b²=c² -> 3²+4²=c² -> 9+16=25 -> c=5）。**重要：** 陣列中的每個步驟都應該是**不包含**任何數字編號或項目符號（如 '1.', 'a.', '*'）的純文字描述。前端會自動加上編號。
*   \`difficulty\`: (String) 題目的難度 ('easy', 'medium', 'hard')。

**範例輸出：**
\`\`\`json
{
  "generated": [
    {
      "question": "小明存入銀行10000元，年利率5%，3年後本利和是多少？",
      "choices": ["10500元", "11500元", "11576元", "12000元"],
      "answer": "11576元",
      "analysis": "複利計算",
      "solution_concept": ["使用複利公式計算"],
      "detailed_steps": ["本金P=10000元", "年利率r=5%=0.05", "期數n=3年", "代入公式：A=P(1+r)^n", "計算：A=10000×(1.05)^3=11576元"],
      "difficulty": "medium"
    },
    {
      "question": "下列哪些數是 12 的因數？(多選題範例)",
      "choices": ["1", "2", "3", "5", "7"],
      "answer": "1,2,3",
      "analysis": "因數判斷",
      "solution_concept": ["整除測試"],
      "detailed_steps": ["12/1=12 (整除)", "12/2=6 (整除)", "12/3=4 (整除)", "12/5=2...2 (不整除)", "12/7=1...5 (不整除)"],
      "difficulty": "easy"
    }
  ]
}
\`\`\`

請開始生成。`;

    return { systemPrompt, userPrompt };
  }
};

module.exports = aiConfig;
