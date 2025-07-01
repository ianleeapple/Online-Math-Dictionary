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
