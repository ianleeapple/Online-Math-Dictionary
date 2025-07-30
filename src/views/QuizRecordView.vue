<template>
    <body>
    <div>
        <h2>測驗紀錄</h2>

    <div
      class="record-container"
      v-for="(record, index) in records"
      :key="index"
      @click="toggle(index)"
    >
      <div class="record-title">
        {{ record.date }} 測驗主題：{{ record.topic }}
      </div>

      <div v-if="record.expanded" class="record-details" @click.stop>
        <table>
          <tbody>
            <tr>
              <td class="label">作答時間</td>
              <td>{{ record.duration }}</td>
            </tr>
            <tr>
              <td class="label">主題</td>
              <td>{{ record.subject }}</td>
            </tr>
            <tr>
              <td class="label">觀念</td>
              <td>{{ record.concept }}</td>
            </tr>
            <tr>
              <td class="label">難易度</td>
              <td>{{ record.difficulty }}</td>
            </tr>
            <tr>
              <td class="label">題數</td>
              <td>{{ record.questionCount }} 題</td>
            </tr>
            <tr>
              <td class="label">計時方式</td>
              <td>{{ record.timerMode }}</td>
            </tr>
            <tr>
              <td class="label">題型</td>
              <td>{{ record.type }}</td>
            </tr>
            <tr>
              <td class="label">測驗成績</td>
              <td>{{ record.score }} 分</td>
            </tr>
            <tr>
              <td class="label">是否訂正</td>
              <td :style="{ color: record.corrected ? 'green' : 'red' }">
                {{ record.corrected ? '已訂正' : '未訂正' }}
              </td>
            </tr>
          </tbody>
        </table>

        <div class="record-buttons">
          <button class="btn" @click="viewExplanation(record)">查看詳解</button>
          <button class="btn" @click="correctPaper(record)">訂正考卷</button>
          <button class="btn" @click="retake(record)">再作一次</button>
          <button class="btn" @click="similarTest(record)">類題考卷</button>
        </div>
      </div>
    </div>
  </div>
  </body>
</template>

<script setup>
import { reactive, onMounted } from 'vue';
const records = reactive([]);
onMounted(async () => {
  try {
    const res = await fetch('/api/quizzes');
    const quizzes = await res.json();
    quizzes.forEach(q => {
      records.push({
        date: q.created_at ? q.created_at.split('T')[0] : '',
        topic: q.title || '',
        duration: q.duration || '',
        subject: q.subject || '',
        concept: q.concept || '',
        difficulty: q.difficulty || '',
        questionCount: q.count || '',
        timerMode: q.timerMode || '',
        type: q.type || '',
        score: q.score || '',
        corrected: q.corrected || false,
        expanded: false
      });
    });
  } catch (e) {
    console.error('API 請求失敗', e);
  }
});

function toggle(index) {
  records[index].expanded = !records[index].expanded;
}
function viewExplanation(record) {
  console.log("查看詳解", record.topic);
}
function correctPaper(record) {
  console.log("訂正考卷", record.topic);
}
function retake(record) {
  console.log("再作一次", record.topic);
}
function similarTest(record) {
  console.log("類題考卷", record.topic);
}
</script>

<style scoped>
body {
  font-family: 'Noto Sans TC', sans-serif;
  background-color: #f9f9f9;
  padding: 20px;
}

h2 {
  margin-bottom: 20px;
}

.record-container {
  border: 2px solid #d0d6dc;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  background-color: white;
  cursor: pointer;
}

.record-title {
  font-size: 20px;
  font-weight: bold;
  color: #2d2d2d;
}

.record-details {
  margin-top: 15px;
  animation: fadeIn 0.3s ease-in-out;
}

table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 10px;
}

td {
  padding: 8px 12px;
  border: 1px solid #ddd;
  vertical-align: middle;
}

td.label {
  background-color: #f2f2f2;
  font-weight: bold;
  width: 20%;
}

.record-buttons {
  margin-top: 15px;
  display: flex;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
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

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
