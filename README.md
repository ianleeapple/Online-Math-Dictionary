# 線上數學題庫系統 (Online Math Dictionary)

進階版數學題庫系統，前端採用 Vue 3 (Vite)，後端為 Express API，資料庫為 MySQL。支援 AI 生成題目、語音合成和數學解題影片生成。

## ✨ 主要功能

- 📚 **數學題庫管理**: 題目建立、編輯、分類，支援圖片上傳與 MathJax 公式。
- 🤖 **AI 智能生成**: 使用 Google Gemini 2.5 Flash 生成高品質數學題目，確保題目多樣性。
- 🔄 **AI 類題生成佇列**: 背景任務佇列系統，批次生成 1-10 題類似題目，避免 HTTP timeout。
- 🎥 **AI 解題影片**: 自動生成數學解題影片，包含語音旁白、步驟動畫與公式渲染。
- 🛠️ **智能修復與再生**: 
  - **Fail-Fast 機制**: 影片生成過程若發生錯誤（如腳本生成失敗）會立即回報，不浪費資源。
  - **自動偵測**: 若影片檔案遺失，系統會自動偵測並允許重新生成。
- 🎤 **語音合成**: 使用 Gemini TTS，確保服務穩定。
- 📈 **數據分析**: 使用者答題統計和分析。
- 👥 **用戶管理**: 學生/教師角色分離，JWT + bcrypt 安全認證。
- 🏆 **成就系統**: 學習進度追蹤和獎勵。

## 🛠️ 技術架構

### 前端
- **Vue 3**: 核心框架 (Composition API)
- **Vite**: 快速建置工具
- **Vue Router**: SPA 路由管理
- **Axios**: HTTP 請求
- **MathJax 3**: 數學公式渲染

### 後端
- **Node.js + Express**: 伺服器框架
- **MySQL**: 主資料庫
- **TaskQueue**: 自製背景任務佇列 (處理 AI 生成)
- **Multer**: 檔案上傳處理

### AI & 影片
- **Google Gemini 2.5 Flash**: 題目生成、影片腳本生成、TTS
- **Remotion**: React 影片渲染引擎 (Server-side rendering)
- **Chrome Headless**: 影片渲染核心

## 🚀 開發環境安裝

### 1. 環境準備
*   [Node.js](https://nodejs.org/) (建議 v16+)
*   MySQL 資料庫伺服器
*   Chrome 或 Chromium 瀏覽器 (Remotion 渲染需要)

### 2. 下載與依賴安裝
```bash
# 下載專案
git clone <repository-url>
cd Online-Math-Dictionary

# 安裝前端依賴
npm install

# 安裝後端依賴
cd server
npm install

# 安裝影片生成依賴 (重要：這是獨立的模組)
cd video
npm install
```

### 3. 環境變數設定 (.env)
複製 `server/.env.example` 到 `server/.env` 並設定：

```env
# 資料庫連線
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=math_platform

# 密碼安全設定
BCRYPT_SALT_ROUNDS=12
JWT_SECRET=your_secure_jwt_secret

# AI 功能 (Google Gemini - 必填)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# AI 生成參數
AI_TEMPERATURE=0.7

# 語音合成 (TTS)
# Gemini TTS (主要)
GEMINI_TTS_MODEL=gemini-2.5-flash
GEMINI_TTS_VOICE=Puck  # 可選: Puck, Charon, Kore, Fenrir, Aoede
```

### 4. 資料庫初始化
```bash
# 匯入資料庫結構
mysql -u root -p < server/schema.sql
```

### 5. 啟動服務

**方式一：使用 VS Code Tasks (推薦)**
- 按 `Ctrl+Shift+P` -> `Tasks: Run Task` -> `dev`

**方式二：手動啟動**
```bash
# 終端機 1: 啟動後端 (Port 3000)
cd server
node index.js

# 終端機 2: 啟動前端 (Port 5173)
npm run dev
```

---

## 🤖 AI 類題生成功能詳解

本專案採用 **Google Gemini 2.5 Flash** 作為 AI 引擎，提供高品質、具教育意義的數學題目生成功能。

### 核心特色
1.  **防過擬合 (Anti-Overfitting)**: Prompt 設計強制要求 AI 在生成類題時，必須改變數字、情境與變數，避免生成重複題目。
2.  **JSON 智能修復**: 內建 `repairJsonString` 函式，能自動修復 AI 回傳的不完整或格式錯誤的 JSON (包含 LaTeX 公式轉義問題)。
3.  **背景佇列 (TaskQueue)**: 
    - 支援批次生成 1-10 題。
    - 45 秒超時保護，最多重試 2 次。

### Prompt 設計原則
*   **角色定位**: AI 扮演資深數學命題教授。
*   **核心要求**: 
    - 避免純數字替換，需有概念延伸。
    - 高迷惑性選項設計。
    - 嚴謹的解題步驟。
*   **輸出結構**: 統一 JSON 格式，包含 `question`, `analysis`, `solution_concept`, `detailed_steps`, `choices`, `answer`。

### 成本評估 (Google Gemini)
- **免費額度**: 每分鐘 15 次請求 (Flash 模型)。
- **單次生成成本**: 極低 (Flash 模型價格約為 Pro 的 1/10)。

---

## 🎥 AI 影片生成功能詳解

### 技術流程
1.  **觸發**: 使用者請求生成影片 (`POST /api/video/generate`)。
2.  **腳本生成**: AI 根據題目生成教學腳本 (JSON)。
3.  **語音合成**: 使用 **Gemini TTS**。
4.  **音訊處理**: 純 JavaScript 實現 PCM 音訊合併與同步，無需 ffmpeg。
5.  **渲染**: Remotion 呼叫 Chrome Headless 渲染 MP4。

### 成本評估
- **影片渲染**: 完全免費 (本地端 Remotion)。
- **語音合成 (Gemini 2.5 Flash TTS)**: 
  - **輸入 (文字)**: 每 100 萬個文字詞元 $0.50 美元。
  - **輸出 (音訊)**: 每 100 萬個音訊詞元 $10.00 美元。
  - **免費額度**: 不適用 (無免費額度)。

---

## 🎯 使用說明

### 註冊與登入
1.  首次使用請點擊「註冊」建立帳號。
2.  選擇身份角色（學生/老師）。
3.  填寫基本資料並設定密碼。

### AI 類題生成操作
1.  在題目管理頁面選擇一個題目。
2.  點擊「產生類題」按鈕。
3.  選擇要生成的題目數量（1-10 題）。
4.  系統會建立背景任務，可繼續瀏覽其他頁面。
5.  任務完成後會自動刷新題目列表，生成的題目會標記「(AI生成)」。

### 影片生成操作
1.  在題目詳情或測驗解析頁面。
2.  點擊「生成解題影片」。
3.  等待約 30-60 秒 (視題目長度而定)。
4.  生成完成後可直接播放。
5.  若影片播放失敗或檔案遺失，重新整理頁面後可再次點擊生成。

---

## 📝 API 端點文件

### 題目管理
```http
# 新增題目 (支援圖片上傳)
POST /api/questions
Content-Type: multipart/form-data
{
  "topic": "主題",
  "concept": "觀念",
  "difficulty": "難易度",
  "content": "題目內容",
  "options": ["選項1", "選項2", "選項3", "選項4"],
  "answer": "正確答案",
  "image": File (可選)
}

# 取得所有題目
GET /api/questions

# 取得特定題目
GET /api/questions/:id
```

### AI 類題生成佇列
```http
# 建立任務 (批次生成 1-10 題類似題目)
POST /api/generation-tasks
{
  "userId": 1,
  "sourceQuestionId": 123,
  "count": 5
}

# 查詢任務狀態
GET /api/generation-tasks/:taskId
Response: {
  "id": 456,
  "status": "pending|processing|completed|failed",
  "progress": 60
}
```

### 影片生成
```http
# 生成影片
POST /api/video/generate
{
  "question": "數學題目內容",
  "script": {影片腳本(可選)},
  "style": "simple|whiteboard|animated"
}

# 取得影片檔案 (含存在性檢查)
GET /api/video/file/:videoId

# 取得題目關聯影片資訊
GET /api/question/:id/video
```

### 語音合成
```http
# 生成語音
POST /api/tts/generate
{
  "text": "要轉換的文字",
  "voice": "Puck"
}
```

---

## 📁 專案結構

```
Online-Math-Dictionary/
├── public/                      # 靜態資源
│   ├── audio/                   # TTS 生成的音訊
│   └── video/                   # Remotion 生成的影片
├── src/                         # 前端源碼
│   ├── components/              # Vue 元件 (MathContent, FormulaEditor...)
│   ├── views/                   # 頁面元件 (Home, QuizSolution, AITest...)
│   ├── assets/                  # 資源檔案
│   ├── App.vue                  # 主應用元件
│   └── main.js                  # 應用程式進入點
├── server/                      # 後端源碼
│   ├── auth.js                  # 密碼安全工具 (bcrypt)
│   ├── db.js                    # MySQL 連線池設定
│   ├── routes.js                # API 路由定義
│   ├── index.js                 # Express 伺服器進入點
│   ├── aiConfig.js              # AI 生成設定與 Prompt (含防過擬合設定)
│   ├── TaskQueue.js             # AI 類題生成背景佇列處理器
│   ├── schema.sql               # 資料庫結構定義
│   ├── video/                   # 影片生成模組 (Remotion)
│   │   ├── VideoGenerator.js    # 影片生成器 (Fail-Fast 邏輯)
│   │   ├── NarrativeScriptGenerator.js # AI 腳本生成
│   │   ├── AudioSyncManager.js  # 音訊同步
│   │   └── components/          # Remotion React 元件
│   ├── uploads/                 # 檔案上傳目錄
│   ├── output/                  # 生成的影片輸出
│   └── temp/                    # 暫存檔案
└── README.md                    # 專案說明文件
```

## ⚠️ 注意事項

- **API 金鑰**: 請務必將 `.env` 加入 `.gitignore`，避免金鑰外洩。
- **Port 衝突**: Remotion Studio 和後端 API 預設都使用 3000 port，若要同時開發，請修改 `remotion.config.js` 的 port。
- **Chrome/Chromium**: 影片渲染需要安裝 Chrome 或 Chromium 瀏覽器。

## 📜 License

[MIT](LICENSE)
