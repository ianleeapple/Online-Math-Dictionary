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
