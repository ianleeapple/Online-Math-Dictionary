# 線上數學題庫系統 (Online Math Dictionary)

本專案為一個全端開發的線上數學題庫系統，旨在提供一個包含使用者管理、班級管理、線上測驗與成績紀錄的安全平台。

## ✨ 主要功能

*   **安全使用者系統**：區分「學生」與「老師」兩種角色，具備註冊與登入功能，採用 bcrypt 密碼雜湊加密
*   **班級管理**：老師可以建立班級並取得加入代碼；學生可以憑代碼加入班級
*   **線上測驗**：使用者可以建立測驗、進行作答並查詢歷史測驗紀錄
*   **成就系統**：根據使用者的活動給予相對應的成就
*   **個人檔案**：完整的個人資料展示，包含學習成就統計
*   **表單驗證**：所有表單都具備完整的輸入驗證機制

## 🛠️ 技術棧

*   **前端 (Frontend)**: Vue 3 (Composition API), Vue Router, Vite
*   **後端 (Backend)**: Node.js, Express.js
*   **資料庫 (Database)**: MySQL
*   **安全性 (Security)**: bcrypt 密碼雜湊, JWT (準備中)
*   **開發工具**: Vite 開發伺服器, 熱重載

## 🔒 安全特性

*   **密碼安全**：使用 bcrypt 進行密碼雜湊處理 (Salt rounds: 12)
*   **環境變數**：敏感資訊透過 `.env` 檔案管理
*   **表單驗證**：前端與後端雙重驗證機制
*   **JWT 支援**：為未來的 Token 認證做好準備

---

## 🚀 專案啟動指南

請遵循以下步驟來在本機環境設定並執行此專案。

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
## 📁 專案結構

```
Online-Math-Dictionary/
├── public/                    # 靜態資源
│   ├── student.png           # 學生角色圖示
│   ├── teacher.png           # 老師角色圖示
│   └── vite.svg             # Vite 標誌
├── src/                      # 前端源碼
│   ├── components/          # Vue 元件
│   │   └── HelloWorld.vue   # 範例元件
│   ├── views/               # 頁面元件
│   │   ├── HomeView.vue     # 首頁
│   │   ├── LoginView.vue    # 登入頁面
│   │   ├── RegisterView.vue # 註冊頁面
│   │   ├── ProfileView.vue  # 個人檔案
│   │   ├── ClassGroupView.vue # 班級管理
│   │   ├── QuizCreateView.vue # 測驗建立
│   │   └── QuizRecordView.vue # 測驗紀錄
│   ├── assets/              # 資源檔案
│   ├── App.vue              # 主應用元件
│   ├── main.js              # 應用程式進入點
│   ├── router.js            # 路由設定
│   └── style.css            # 全域樣式
├── server/                   # 後端源碼
│   ├── auth.js              # 密碼安全工具
│   ├── db.js                # 資料庫連線設定
│   ├── routes.js            # API 路由定義
│   ├── index.js             # 伺服器進入點
│   ├── schema.sql           # 資料庫結構
│   └── .env                 # 環境變數 (需自行建立)
├── .gitignore               # Git 忽略規則
├── package.json             # 前端依賴管理
├── vite.config.js           # Vite 設定
└── README.md                # 專案說明
```

## 📝 API 端點

後端 API 統一以 `/api` 開頭，主要端點如下：

### 認證相關
*   `POST /api/login`: 使用者登入
*   `POST /api/register`: 使用者註冊

### 使用者管理
*   `GET /api/users`: 取得所有使用者
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

## 🔧 開發相關

### 開發指令
```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 建置生產版本
npm run build

# 預覽生產版本
npm run preview
```

### 資料庫管理
```bash
# 重建資料庫
mysql -u root -p < server/schema.sql

# 備份資料庫
mysqldump -u root -p math_platform > backup.sql
```

## 🛡️ 安全性注意事項

*   **密碼安全**：系統使用 bcrypt 進行密碼雜湊，不會儲存明文密碼
*   **環境變數**：敏感資訊請勿提交至版本控制，確保 `.env` 檔案在 `.gitignore` 中
*   **JWT Secret**：請使用強密碼作為 JWT_SECRET，並定期更換
*   **資料庫權限**：生產環境請限制資料庫使用者權限

## 🐛 常見問題

### Q: 無法連線到資料庫
**A:** 請檢查：
1.  MySQL 服務是否正常啟動
2.  `.env` 檔案中的資料庫連線資訊是否正確
3.  資料庫是否已建立 (`math_platform`)

### Q: 登入後個人資料顯示「未填寫」
**A:** 請確認：
1.  註冊時是否完整填寫個人資料
2.  瀏覽器 localStorage 是否正常運作
3.  後端 API 是否正常回傳使用者資料

### Q: 無法建立測驗
**A:** 請檢查：
1.  所有必填欄位是否已填寫
2.  網路連線是否正常
3.  後端伺服器是否正常運行

## 📄 授權條款

本專案採用 MIT 授權條款，詳見 [LICENSE](LICENSE) 檔案。

## 🤝 貢獻指南

歡迎提交 Issue 或 Pull Request 來改善此專案！

---

*最後更新：2025年8月3日*