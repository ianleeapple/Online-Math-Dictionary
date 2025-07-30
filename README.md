# 線上數學題庫系統 (Online Math Dictionary)

本專案為一個全端開發的線上數學題庫系統，旨在提供一個包含使用者管理、班級管理、線上測驗與成績紀錄的平台。

## ✨ 主要功能

*   **使用者系統**：區分「學生」與「老師」兩種角色，並提供註冊與登入功能。
*   **班級管理**：老師可以建立班級並取得加入代碼；學生可以憑代碼加入班級。
*   **線上測驗**：使用者可以建立測驗、進行作答並查詢歷史測驗紀錄。
*   **成就系統**：根據使用者的活動給予相對應的成就。

## 🛠️ 技術棧

*   **前端 (Frontend)**: Vue 3 (Composition API), Vite
*   **後端 (Backend)**: Node.js, Express.js
*   **資料庫 (Database)**: MySQL

---

## 🚀 專案啟動指南

請遵循以下步驟來在本機環境設定並執行此專案。

### 1. 環境準備

*   請先確認您的電腦已安裝 [Node.js](https://nodejs.org/) (建議版本 16 或以上)。
*   您需要一個正在運行的 **MySQL** 資料庫伺服器 (可透過 XAMPP, WAMP, Docker 等工具啟動)。

### 2. 資料庫設定

1.  **啟動 MySQL 服務**。
2.  使用任何 MySQL 管理工具 (例如 HeidiSQL, phpMyAdmin, MySQL Workbench) 或透過指令行連線到您的資料庫。
3.  執行位於 `server/schema.sql` 檔案中的所有 SQL 指令。這將會建立 `math_platform` 資料庫以及所有需要的資料表。
    ```bash
    # 指令行參考
    mysql -u root -p < server/schema.sql
    ```
4.  (可選) 如果您的資料庫連線資訊不同，請修改 `server/db.js` 檔案中的設定。

### 3. 後端伺服器啟動

1.  開啟一個新的終端機 (Terminal)。
2.  進入後端專案目錄並安裝依賴套件：
    ```bash
    cd server
    npm install
    ```
3.  啟動後端伺服器：
    ```bash
    node index.js
    ```
    成功後，您應該會看到 `Server running at http://localhost:3001` 的訊息。請保持此終端機運行。

### 4. 前端應用程式啟動

1.  **另外開啟一個新的終端機**。
2.  確認您位於專案的根目錄，並安裝依賴套件：
    ```bash
    npm install
    ```
3.  啟動前端開發伺服器：
    ```bash
    npm run dev
    ```
    成功後，您會看到一個本地網址 (通常是 `http://localhost:5173`)。在瀏覽器中打開此網址即可開始使用本系統。

## 📝 API 端點

後端 API 統一以 `/api` 開頭，主要端點如下：

*   `GET /api/users`: 取得所有使用者
*   `POST /api/users`: 註冊新使用者
*   `DELETE /api/users/:id`: 刪除指定使用者
*   `GET /api/quizzes`: 取得所有測驗
*   `POST /api/quizzes`: 新增一筆測驗
*   `DELETE /api/quizzes/:id`: 刪除指定測驗
*   `GET /api/achievements`: 取得所有成就
*   `DELETE /api/classes/:id`: 刪除指定班級