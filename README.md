# 線上數學題庫系統 (Online Math Dictionary)

進階版數學題庫系統，前端採用 Vue 3 (Vite)，後端為 Express API，資料庫為 MySQL。支援 AI 生成題目、語音合成和數學解題影片生成。

## ✨ 主要功能

- 📚 **數學題庫管理**: 題目建立、編輯、分類
- 🤖 **AI 智能生成**: 使用 Google Gemini 2.5 Pro 生成高品質數學題目
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
- **Google Gemini 2.5 Pro**: AI 智能題目生成 (支援 Early Access)
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
GEMINI_MODEL=gemini-2.5-pro

# AI 生成參數 (可選)
AI_TEMPERATURE=0.7
# AI_MAX_TOKENS=8192  # 註解掉此行即為無上限

# 語音合成 (TTS)
# Gemini TTS (主要，免費，使用同一個 GEMINI_API_KEY)
GEMINI_TTS_MODEL=gemini-2.0-flash-exp
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

## 🗄️ 資料庫架構

主要表格：
- `users`: 使用者資料 (學生/教師，含 bcrypt 密碼雜湊)
- `classes`: 班級資料 (教師建立的班級)
- `class_members`: 班級成員關聯表
- `quiz`: 測驗記錄 (題型、難度、分數等)
- `achievement`: 成就系統 (學習進度追蹤)

資料庫初始化：
```bash
mysql -u root -p < server/schema.sql
```

## 🚀 未來規劃

### 短期目標
- [ ] 影片緩存機制
- [ ] 批量影片生成
- [ ] 更多影片樣式模板
- [ ] 手寫識別輸入

### 中期目標
- [ ] Remotion Studio 完整整合
- [ ] 影片直播功能
- [ ] 多語言支援
- [ ] 行動版 APP

### 長期目標
- [ ] VR/AR 數學教學
- [ ] 智能答疑機器人
- [ ] 個人化學習路徑

## 🛡️ 安全性注意事項

- **密碼安全**: 使用 bcrypt 進行密碼雜湊，不儲存明文密碼
- **環境變數**: 敏感資訊透過 `.env` 管理，勿提交至版本控制
- **API 金鑰**: OpenAI API 金鑰請妥善保管，注意使用額度
- **資料庫權限**: 生產環境請限制資料庫使用者權限

## 🐛 常見問題

### Q: AI 生成回傳空白或錯誤
**A:** 請檢查：
1. `GEMINI_API_KEY` 是否正確設定在 `.env`
2. 是否有網路連線問題
3. 檢查 `AI_MAX_TOKENS` 設定 (建議註解掉或設為 8192)
4. 查看後端 Console 的詳細錯誤訊息

### Q: 影片生成失敗
**A:** 請檢查：
1. Remotion 依賴是否正確安裝 (`cd server/video && npm install`)
2. Chrome Headless 是否正常下載
3. 系統記憶體是否足夠 (建議 8GB+)

### Q: 語音生成無聲音
**A:** 請確認：
1. OpenAI API 金鑰是否有效
2. TTS API 額度是否充足
3. 瀏覽器是否允許自動播放音訊

### Q: 無法連線到資料庫
**A:** 請檢查：
1. MySQL 服務是否正常啟動
2. `.env` 檔案中的 `DB_*` 設定是否正確
3. 資料庫 `math_platform` 是否已建立
4. 使用者權限是否足夠

### Q: 登入失敗 (密碼錯誤)
**A:** 如果是舊資料庫遷移：
1. 執行密碼遷移工具: `node server/migrate-passwords.js`
2. 這會將明文密碼轉換為 bcrypt 雜湊

## � 技術亮點

### 1. **Google Gemini 整合**
- 使用最新 `@google/generative-ai` SDK
- 支援 Gemini 2.5 Pro (Early Access)
- 智能 Token 管理 (無上限模式)
- 詳細錯誤處理與除錯日誌

### 2. **密碼安全**
- bcrypt 雜湊演算法 (12 rounds)
- 密碼遷移工具 (明文→雜湊)
- 登入時密碼驗證
- API 回應絕不包含密碼

### 3. **影片渲染技術**
- Remotion React 元件式渲染
- MathJax 數學公式支援
- 多場景教學流程
- 支援語音旁白整合

### 4. **開發體驗**
- VS Code Tasks 整合
- API Proxy 自動轉發 (Vite)
- 集中化 AI 設定檔
- 詳細的錯誤訊息與日誌

## �📝 責任聲明

- 本專案使用 **Google Gemini API** 與 **OpenAI API**，請遵守各自的使用條款
- 影片生成功能僅供教育目的使用
- 請妥善保管 API 金鑰，避免外洩
- 注意 API 使用額度，避免超額費用

## 📄 授權條款

本專案採用 MIT 授權條款，詳見 [LICENSE](LICENSE) 檔案。

## 🤝 貢獻指南

歡迎提交 Issue 或 Pull Request 來改善此專案！

### 開發建議
- 使用 VS Code 作為開發環境
- 安裝 Volar (Vue Language Features) 擴充功能
- 啟用 ESLint 與 Prettier 進行程式碼格式化
- 提交前請確保所有測試通過

## 📞 聯絡資訊

如有任何問題或建議，歡迎透過 GitHub Issues 聯繫。

---

**專案狀態**: 🟢 持續開發中  
**最後更新**: 2025年10月6日  
**核心技術**: Vue 3 + Express + MySQL + Google Gemini 2.5 Pro + MathJax 3