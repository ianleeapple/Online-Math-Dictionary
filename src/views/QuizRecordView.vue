<template>
  <div class="quiz-record-bg">
    <h2>測驗紀錄</h2>
    <div v-for="(record, index) in records" :key="index" class="record-container">
      <div class="record-info">
        <p class="title">{{ record.date }} 測驗主題：{{ record.topic }}</p>
        <p>作答時間：{{ record.duration }}</p>
        <p>主題：{{ record.subject }}</p>
        <p>觀念：{{ record.concept }}</p>
        <p>難易度：{{ record.difficulty }}</p>
        <p>題數：{{ record.questionCount }} 題</p>
        <p>計時方式：{{ record.timerMode }}</p>
        <p>題型：{{ record.type }}</p>
        <p>測驗成績：{{ record.score }} 分</p>
        <p>是否訂正：
          <span :style="{ color: record.corrected ? 'green' : 'red' }">
            {{ record.corrected ? '已訂正' : '未訂正' }}
          </span>
        </p>
      </div>
      <div class="record-buttons">
        <button class="btn" @click="viewExplanation(record)">查看詳解</button>
        <button class="btn" @click="correctPaper(record)">訂正考卷</button>
        <button class="btn" @click="retake(record)">再作一次</button>
        <button class="btn" @click="similarTest(record)">類題考卷</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const records = ref([
  {
    date: "2025/04/15",
    topic: "一元一次方程式",
    duration: "15 分鐘",
    subject: "解一元一次方程式",
    concept: "代數基本運算",
    difficulty: "中等",
    questionCount: 20,
    timerMode: "正向計時",
    type: "選擇題",
    score: 85,
    corrected: true
  },
  {
    date: "2025/04/20",
    topic: "二元一次方程式",
    duration: "20 分鐘",
    subject: "代數",
    concept: "解聯立方程式",
    difficulty: "困難",
    questionCount: 15,
    timerMode: "倒數計時",
    type: "填空題",
    score: 70,
    corrected: false
  }
]);
function viewExplanation(record) {
  alert(`查看詳解：${record.topic}`);
}
function correctPaper(record) {
  alert(`訂正考卷：${record.topic}`);
}
function retake(record) {
  alert(`再作一次：${record.topic}`);
}
function similarTest(record) {
  alert(`類題考卷：${record.topic}`);
}
</script>

<style scoped>
.quiz-record-bg {
  background-color: #f9f9f9;
  min-height: 100vh;
  padding: 20px;
}
.record-container {
  border: 2px solid #d0d6dc;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  background-color: white;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}
.record-buttons {
  display: flex;
  flex-direction: column;
  gap: 10px;
  align-self: center;
}
.record-info {
  flex-grow: 1;
}
.record-info p {
  margin: 6px 0;
  font-size: 16px;
}
.record-info .title {
  font-size: 20px;
  font-weight: bold;
  color: #2d2d2d;
}
.btn {
  background-color: #d67b7b;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}
.btn:hover {
  background-color: #c06565;
}
</style>
