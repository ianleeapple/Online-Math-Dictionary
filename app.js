var path = require("path");
const express = require('express'); // 引入 Express
const app = express(); // 建立 Express 應用程式

//設定目錄和引擎
app.set("views", path.resolve(__dirname, "views"));
app.set("view engine", "ejs");

// 設定靜態檔案目錄
app.use(express.static(path.join(__dirname, 'public')));

// 設定首頁路由
app.get("/", function(request, response) {
  response.render("index");
});

//404
app.use(function(request, response) {
    response.status(404).render("404");
  });

// 啟動伺服器
app.listen(3000, () => {
    console.log('Server running on http://localhost:3000');
});