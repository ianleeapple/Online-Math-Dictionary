// routes/quiz.js
const express = require('express');
const router = express.Router();

// 建立測驗的 API
router.post('/create', (req, res) => {
  const {
    topic,
    concept,
    difficulty,
    count,
    timing,
    questionTypes
  } = req.body;

  console.log('收到測驗建立請求：', req.body);

  // 這裡可以進一步：儲存到資料庫、產生題目等等
  // 先回傳成功訊息模擬
  res.json({
    message: '測驗已建立！',
    data: {
      topic,
      concept,
      difficulty,
      count,
      timing,
      questionTypes
    }
  });
});

//以下為暫定用資料，實際是從資料庫撈取
router.get('/records', (req, res) => {
  // 從資料庫撈取某個使用者的測驗記錄
  const dummyRecords = [
    {
      date: '2025/04/15',
      topic: '一元一次方程式',
      duration: '15 分鐘',
      subject: '解一元一次方程式',
      concept: '代數基本運算',
      difficulty: '中等',
      questionCount: 20,
      timerMode: '正向計時',
      type: '選擇題',
      score: 85,
      corrected: true
    }
  ];
  res.json(dummyRecords);
});


module.exports = router;
