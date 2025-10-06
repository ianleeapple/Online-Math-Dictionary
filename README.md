# 線上數學題庫系統 (Online Math Dictionary)

進階版數學題庫系統，前端採用 Vue 3 (Vite)，後端為 Express API，資料庫為 MySQL。支援 AI 生成題目、語音合成和數學解題影片生成。

## ✨ 主要功能

- 📚 **數學題庫管理**: 題目建立、編輯、分類
- 🤖 **AI 智能生成**: 使用 Google Gemini 2.5 Flash 生成高品質數學題目
- 🎤 **語音合成**: Gemini TTS (主要) + OpenAI TTS (備用) 雙供應商架構
- 🎥 **影片生成**: Remotion 數學解題影片自動生成 (支援 MathJax 公式渲染)
- 📈 **數據分析**: 使用者答題統計和分析
- 👥 **用戶管理**: 學生/教師角色分離
- 🛡️ **安全認證**: JWT + bcrypt 加密
- 🏆 **成就系統**: 學習進度追蹤和獎勵

## 🛠️ 技術架構

### 前端
- **Vue 3**: 核心框架 (Composition API)
- **Vite**: 快速建置工具
- **Vue Router**: SPA 路由管理
- **Axios**: HTTP 請求

### 後端
- **Node.js + Express**: 伺服器框架
- **MySQL**: 主資料庫
- **bcrypt**: 密碼雜湊加密

### AI 相關
- **Google Gemini 2.5 Flash**: AI 智能題目生成
- **Gemini TTS**: 主要語音合成服務 (免費)
- **OpenAI TTS**: 備用語音合成服務 (付費，高品質)
- **Remotion**: React 影片渲染引擎
- **MathJax 3**: 前端使用 CDN，後端使用 mathjax-full SSR

### 開發工具
- **Remotion Studio**: 影片可視化編輯器
- **Chrome Headless**: 影片渲染引擎
- **VS Code**: 推薦開發環境

## � 開發環境安裝

### 1. 安裝依賴

**前端依賴**:
```bash
npm install
```

**後端依賴**:
```bash
cd server
npm install
```

**影片生成依賴** (可選):
```bash
cd server/video
npm install
```

### 2. 環境設定

複製環境設定檔：
```bash
cd server
cp .env.example .env
```

編輯 `.env` 檔案，設定以下項目：
```env
# 資料庫連線
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=math_platform

# 密碼安全設定
BCRYPT_SALT_ROUNDS=12

# AI 功能 (Google Gemini - 必填)
GEMINI_API_KEY=your_gemini_api_key_here
GEMINI_MODEL=gemini-2.5-flash

# AI 生成參數 (可選)
AI_TEMPERATURE=0.7

# 語音合成 (TTS)
# Gemini TTS (主要，免費，使用同一個 GEMINI_API_KEY)
GEMINI_TTS_MODEL=gemini-2.5-flash
GEMINI_TTS_VOICE=Puck  # 可選: Puck, Charon, Kore, Fenrir, Aoede

# OpenAI TTS (備用，付費，高品質)
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_TTS_VOICE=nova  # 可選: nova, alloy, echo, fable, onyx, shimmer
```

**取得 API Key：**
- Google Gemini API: https://aistudio.google.com/apikey (免費額度，支援文字生成與 TTS)
- OpenAI API: https://platform.openai.com/api-keys (備用 TTS，付費)

### 3. 啟動服務

**前端** (Vue + Vite):
```bash
npm run dev
```

**後端** (Express):
```bash
cd server
node index.js
```

**Remotion Studio** (可選 - 影片編輯器):
```bash
cd server/video
npm run studio
```

## 🎥 AI 影片生成功能

### 技術架構
- **Remotion**: React 組件式影片渲染
- **MathJax**: 數學公式渲染
- **OpenAI TTS**: 中文語音合成
- **Chrome Headless**: 影片渲染引擎

### 支援的影片樣式
- **簡潔風格**: 白背景 + 清晰文字
- **白板風格**: 教學白板效果
- **動畫風格**: 漸層背景 + 動畫效果

### 影片特色
- 🎨 **多場景教學**: 題目 → 分析 → 概念 → 步驟 → 答案
- 📝 **數學公式**: 完整支援 LaTeX 語法
- ✨ **動畫效果**: 打字機、淡入淡出、縮放
- 🔊 **語音旁白**: AI 生成的中文語音

### API 端點
```http
# 生成影片
POST /api/video/generate
{
  "question": "數學題目內容",
  "script": {影片腦本},
  "style": "simple|whiteboard|animated",
  "options": {其他選項}
}

# 取得影片檔案
GET /api/video/file/:videoId

# 生成語音
POST /api/tts/generate
{
  "text": "要轉換的文字",
  "voice": "nova|alloy|echo|fable|onyx|shimmer"
}
```

### 成本評估
- **影片渲染**: 完全免費 (本地端 Remotion)
- **語音合成**: 
  - Gemini TTS: 完全免費 (主要使用)
  - OpenAI TTS: ~$0.003-0.008 USD/次 (備用)
- **AI 腦本**: ~$0.003-0.006 USD/次
- **總成本**: 使用 Gemini TTS 時約 $0.003-0.006 USD/部 (台幣 0.1-0.2元)

### 1. 環境準備

*   請先確認您的電腦已安裝 [Node.js](https://nodejs.org/) (建議版本 16 或以上)
*   您需要一個正在運行的 **MySQL** 資料庫伺服器 (可透過 XAMPP, WAMP, Docker 等工具啟動)

### 2. 專案下載與依賴安裝

1.  **下載專案**：
    ```bash
    git clone <repository-url>
    cd Online-Math-Dictionary
    ```

2.  **安裝前端依賴**：
    ```bash
    npm install
    ```

3.  **安裝後端依賴**：
    ```bash
    cd server
    npm install
    cd ..
    ```

### 3. 環境變數設定

1.  **複製環境變數範本**：
    ```bash
    cp server/.env.example server/.env
    ```

2.  **編輯 `server/.env` 檔案**，設定您的資料庫連線資訊：
    ```env
    # MySQL 資料庫連線設定
    DB_HOST=localhost
    DB_USER=root
    DB_PASSWORD=your_password_here
    DB_NAME=math_platform

    # 密碼安全設定
    BCRYPT_SALT_ROUNDS=12
    JWT_SECRET=your_secure_jwt_secret_here
    ```

### 4. 資料庫設定

1.  **啟動 MySQL 服務**
2.  **建立資料庫**：
    ```bash
    mysql -u root -p < server/schema.sql
    ```
    或手動在 MySQL 管理工具中執行 `server/schema.sql` 內的 SQL 指令

### 5. 啟動應用程式

**方式一：使用 VS Code 任務 (推薦)**
1.  開啟 VS Code
2.  按 `Ctrl+Shift+P` 開啟命令面板
3.  執行 "Tasks: Run Task" → 選擇 "dev"

**方式二：手動啟動**
1.  **啟動後端伺服器**：
    ```bash
    cd server
    node index.js
    ```
    成功後會看到 `Server running at http://localhost:3001`

2.  **啟動前端開發伺服器** (另開新終端)：
    ```bash
    npm run dev
    ```
    成功後會看到本地網址 (通常是 `http://localhost:5173`)

3.  **開啟瀏覽器**訪問前端網址即可開始使用

---

## 🤖 AI 類題生成功能說明

本專案採用 **Google Gemini 2.5 Pro** 作為 AI 引擎，提供高品質、具教育意義的數學題目生成功能。

### 核心架構

*   **集中化設定 (`server/aiConfig.js`)**: 所有與 AI 相關的設定，包括 Prompt 範本、模型選擇、API 參數（溫度、Token 限制）等，都集中在此檔案中，方便統一管理。
*   **環境變數覆蓋 (`.env`)**: 您可以透過 `.env` 檔案調整 AI 行為，無需修改程式碼。
*   **Gemini 2.5 Pro 優勢**: 
  - 支援 **8,192 tokens** 輸出 (無上限模式)
  - 更強的數學推理能力
  - 免費額度充足 (每分鐘 2 次請求)
  - Early Access 模型支援

### 如何客製化 AI 行為

透過編輯 `server/.env` 檔案來調整 AI：

1.  **選擇 Gemini 模型**:
    ```env
    GEMINI_MODEL=gemini-2.5-pro          # 推薦 (需 Early Access)
    # GEMINI_MODEL=gemini-2.0-flash-exp  # 快速模型
    # GEMINI_MODEL=gemini-1.5-pro        # 穩定版
    ```

2.  **調整創意程度**:
    ```env
    AI_TEMPERATURE=0.7  # 0.0-2.0，越高越有創意
    ```

3.  **設定 Token 限制**:
    ```env
    # AI_MAX_TOKENS=8192     # 設定上限
    # 註解掉此行 = 無上限（使用模型預設 8,192）
    ```

### Prompt 設計原則

*   **角色定位**: AI 扮演資深數學命題教授與教科書作者
*   **核心要求**: 
  - 避免純數字替換
  - 概念延伸與變化
  - 高迷惑性選項設計
  - 嚴謹的解題步驟
*   **JSON 結構**: 統一輸出格式，包含：
  - `question`: 完整題目
  - `analysis`: 核心概念解析
  - `solution_concept`: 解題思路
  - `detailed_steps`: 詳細計算步驟
  - `choices`: 選項 (選擇題)
  - `answer`: 正確答案

### 成本評估 (Google Gemini)

- **免費額度**: 每分鐘 2 次請求，每天 50 次請求
- **付費方案**: $0.075 / 1M input tokens, $0.30 / 1M output tokens
- **單次生成成本**: 約 $0.002-0.004 USD (台幣 0.06-0.12 元)
- **比 OpenAI 便宜**: 約為 GPT-4 的 1/10 成本
## 📁 專案結構

```
Online-Math-Dictionary/
├── public/                      # 靜態資源
│   ├── student.png             # 學生角色圖示
│   ├── teacher.png             # 老師角色圖示
│   └── vite.svg                # Vite 標誌
├── src/                        # 前端源碼
│   ├── components/             # Vue 元件
│   │   └── MathContent.vue     # 數學公式渲染元件
│   ├── views/                  # 頁面元件
│   │   ├── HomeView.vue        # 首頁
│   │   ├── LoginView.vue       # 登入頁面
│   │   ├── RegisterView.vue    # 註冊頁面
│   │   ├── ProfileView.vue     # 個人檔案
│   │   ├── ClassGroupView.vue  # 班級管理
│   │   ├── QuizCreateView.vue  # 測驗建立
│   │   ├── QuizRecordView.vue  # 測驗紀錄
│   │   └── AITestView.vue      # AI 生成測試頁面
│   ├── assets/                 # 資源檔案
│   ├── App.vue                 # 主應用元件
│   ├── main.js                 # 應用程式進入點
│   ├── router.js               # 路由設定
│   └── style.css               # 全域樣式
├── server/                     # 後端源碼
│   ├── auth.js                 # 密碼安全工具 (bcrypt)
│   ├── db.js                   # MySQL 連線池設定
│   ├── routes.js               # API 路由定義
│   ├── index.js                # Express 伺服器進入點
│   ├── aiConfig.js             # AI 生成設定與 Prompt
│   ├── schema.sql              # 資料庫結構定義
│   ├── migrate-passwords.js    # 密碼遷移工具
│   ├── .env                    # 環境變數 (需自行建立)
│   ├── .env.example            # 環境變數範本
│   ├── video/                  # 影片生成模組
│   │   ├── VideoGenerator.js   # 影片生成器
│   │   ├── components/         # Remotion 元件
│   │   └── package.json        # Remotion 依賴
│   ├── output/                 # 生成的影片輸出 (gitignore)
│   └── temp/                   # 暫存檔案 (gitignore)
├── .github/                    # GitHub 設定
│   └── copilot-instructions.md # Copilot 客製指令
├── .gitignore                  # Git 忽略規則
├── package.json                # 前端依賴管理
├── vite.config.js              # Vite 設定 (API Proxy)
└── README.md                   # 專案說明文件
```

## 📝 API 端點

後端 API 統一以 `/api` 開頭，主要端點如下：

### 認證相關
*   `POST /api/login`: 使用者登入 (email + password + role)
*   `POST /api/users`: 使用者註冊 (含密碼雜湊)

### 使用者管理
*   `GET /api/users`: 取得所有使用者 (不含密碼)
*   `DELETE /api/users/:id`: 刪除指定使用者

### 測驗系統
*   `GET /api/quizzes`: 取得所有測驗
*   `POST /api/quizzes`: 新增一筆測驗
*   `DELETE /api/quizzes/:id`: 刪除指定測驗

### 班級管理
*   `POST /api/classes`: 建立新班級
*   `DELETE /api/classes/:id`: 刪除指定班級

### 成就系統
*   `GET /api/achievements`: 取得所有成就

### AI 生成 (Google Gemini)
*   `POST /api/ai/generate`: AI 類題生成
  ```json
  {
    "template": "原始題目",
    "type": "選擇題|填充題|計算題",
    "variations": 3,
    "difficulty": "easy|medium|hard",
    "options_template": "選項範本",
    "constraints": "特殊約束"
  }
  ```

### 影片生成 (Remotion)
*   `POST /api/video/generate`: 生成數學解題影片
*   `GET /api/video/file/:videoId`: 取得影片檔案
*   `GET /api/video/:videoId`: 影片串流服務

### 語音合成 (Gemini TTS + OpenAI TTS)
*   `POST /api/tts/generate`: 文字轉語音 (自動優先使用 Gemini TTS)
  ```json
  {
    "text": "要轉換的文字",
    "voice": "Puck|Charon|Kore|Fenrir|Aoede" // Gemini 音色
  }
  ```

## 🎯 使用說明

### 註冊與登入
1.  首次使用請點擊「註冊」建立帳號
2.  選擇身份角色（學生/老師）
3.  填寫基本資料並設定密碼
4.  使用帳號密碼登入系統

### 個人檔案
*   登入後可在個人檔案頁面查看：
    - 基本資料
    - 學習統計
    - 獲得的成就

### 測驗功能
*   **建立測驗**：填寫測驗資訊，系統會驗證所有必填欄位
*   **查看紀錄**：瀏覽歷史測驗結果和統計

### 班級管理 (老師功能)
*   建立班級並取得加入代碼
*   管理班級成員

## 🚀 專案啟動

### 1. 啟動後端 API 伺服器

```bash
cd server
npm start
```
API 伺服器將在 `http://localhost:3000` 啟動。

### 2. 啟動前端開發伺服器

```bash
npm run dev
```
前端開發伺服器將在 `http://localhost:5173` 啟動。

### 3. 啟動 Remotion Studio (影片開發)

```bash
cd server/video
npm run studio
```
Remotion Studio 將在 `http://localhost:3000` 啟動 (與後端 API 衝突，請擇一啟動)。

## 🎥 影片生成流程

1. **觸發 API**:
   - `POST /api/video/generate`
   - 帶有 `questionId` 或 `script` (JSON 格式)

2. **後端處理**:
   - **AI 劇本生成**: 若提供 `questionId`，使用 Gemini 生成教學劇本。
   - **語音合成 (TTS)**: 使用 Gemini TTS 將劇本轉換為語音 (`.wav`)。
   - **音訊同步**: 計算每個場景的音訊時長，同步影片時間軸。
   - **Remotion 渲染**:
     - 使用 `@remotion/renderer` 呼叫 Chrome Headless 進行渲染。
     - 將 MathJax 公式渲染為 SVG，嵌入影片。
   - **影片輸出**: 生成 `output.mp4` 影片。

## 🤖 AI 功能

### 1. 題目生成

- **API**: `POST /api/questions/generate`
- **模型**: `gemini-2.5-flash`
- **流程**:
  1. 使用者提供主題、難度。
  2. 後端組合 Prompt，呼叫 Gemini API。
  3. **JSON 修復**: 智能修復 Gemini 回傳的 JSON 格式 (包含 LaTeX 公式)。
  4. 將生成的題目存入資料庫。

### 2. 語音合成 (TTS)

- **主要**: Gemini TTS (`gemini-2.5-flash`)
- **備用**: OpenAI TTS
- **特色**:
  - 雙供應商架構，自動容錯切換。
  - 純 JavaScript 實現 PCM 音訊合併，無需 `ffmpeg`。

## 📂 專案結構

```
/
├── public/                 # 靜態資源 (圖片、音訊)
│   ├── audio/              # TTS 生成的音訊
│   └── video/              # Remotion 生成的影片
├── server/
│   ├── video/              # Remotion 影片專案
│   │   ├── components/     # Remotion React 元件
│   │   ├── public/         # 影片專案的靜態資源
│   │   ├── AudioSyncManager.js # 音訊同步與合併
│   │   ├── NarrativeScriptGenerator.js # AI 劇本生成
│   │   └── VideoGenerator.js # 影片渲染主程式
│   ├── .env.example        # 環境變數範本
│   ├── db.js               # 資料庫連線
│   ├── index.js            # Express 主程式
│   └── routes.js           # API 路由
└── src/                    # Vue 前端專案
    ├── components/         # Vue 元件
    ├── views/              # 頁面元件
    ├── router.js           # 路由設定
    └── main.js             # Vue 啟動點
```

## ⚠️ 注意事項

- **API 金鑰**: 請務必將 `.env` 加入 `.gitignore`，避免金鑰外洩。
- **Remotion 與 API 衝突**: Remotion Studio 和後端 API 預設都使用 3000 port，請擇一啟動或修改 `remotion.config.js` 的 port。
- **Chrome/Chromium**: 影片渲染需要安裝 Chrome 或 Chromium 瀏覽器。

## 📜 License

[MIT](LICENSE)