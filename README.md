# Online Math Dictionary (數學題庫系統)

## 前端
- 使用 Vue 3 (Vite) 建立 SPA
- 所有頁面皆為 Vue 元件
- 透過 fetch/axios 串接 Express API

## 後端
- 使用 Express 提供 RESTful API
- API 路徑統一為 `/api/`
- 連接 MySQL 資料庫

## 資料庫
- MySQL，資料表：users、quiz、achievement
- 初始化 SQL 請見 `server/schema.sql`

## 啟動方式
1. 進入專案根目錄，安裝前端依賴：
   ```
   npm install
   npm run dev
   ```
2. 進入 server 目錄，安裝後端依賴：
   ```
   cd server
   npm install
   node index.js
   ```
3. 建立 MySQL 資料庫與資料表：
   ```
   mysql -u root -p < server/schema.sql
   ```

## 目標
- 提供學生與老師帳號註冊/登入、題庫管理、成就查詢等功能
=======
# Online-Math-Dictionary
For Frontend file sort<br/>
frontend/<br/>
├── index.html                # 首頁或入口頁<br/>
├── assets/                   # 圖片、CSS、字體等靜態資源<br/>
│   └── styles.css            # 公用樣式<br/>
├── components/               # 可重複使用的 Vue component（選用）<br/>
│   └── QuizCard.vue          # 可選：紀錄卡片元件（若未來用 Vue CLI）<br/>
├── pages/                    # 每個主要畫面 (HTML + Vue script)<br/>
│   ├── quiz-create.html      # 測驗建立畫面<br/>
│   ├── quiz-record.html      # 測驗紀錄畫面<br/>
│   └── quiz-explain.html     # 詳解畫面（可選）<br/>
├── scripts/                  # 各畫面的 script 拆分出來<br/>
│   ├── quiz-create.js<br/>
│   ├── quiz-record.js<br/>
│   └── utils.js              # 公用函式，例如格式化時間<br/>
└── data/                     # 假資料（開發用 mock）<br/>
    └── mock-records.json
