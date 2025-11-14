<template>
  <body>
    <div>
      <h2>測驗紀錄</h2>

      <!-- 載入中提示 -->
      <div v-if="loading" style="text-align: center; padding: 40px;">
        <p>載入中...</p>
      </div>

      <!-- 沒有記錄 -->
      <div v-else-if="records.length === 0" style="text-align: center; padding: 40px;">
        <p>目前沒有測驗記錄</p>
      </div>

      <!-- 測驗記錄列表 -->
      <div v-else class="record-container" v-for="(record, index) in records" :key="record.id" @click="toggle(index)">
        <div class="record-title">
          {{ formatDateTime(record.submit_time) }} {{ record.topic }}
          <div class="badge-container">
            <!-- 訂正狀態徽章 -->
            <span class="correction-badge" :class="getCorrectionBadgeClass(record)">
              {{ getCorrectionText(record) }}
            </span>
            <!-- 分數徽章 -->
            <span v-if="record.score !== null" class="score-badge" :class="getScoreBadgeClass(record.score)">
              {{ record.score }} 分
            </span>
          </div>
        </div>

        <div v-if="record.expanded" class="record-details" @click.stop>
          <table>
            <tbody>
              <tr>
                <td class="label">交卷時間</td>
                <td>{{ formatDateTime(record.submit_time) }}</td>
              </tr>
              <tr>
                <td class="label">主題</td>
                <td>{{ record.topic }}</td>
              </tr>
              <tr>
                <td class="label">觀念</td>
                <td>{{ record.concept }}</td>
              </tr>
              <tr>
                <td class="label">計時方式</td>
                <td>{{ getTimingModeLabel(record) }}</td>
              </tr>
              <tr>
                <td class="label">作答時間</td>
                <td>{{ formatDuration(record.answer_time) }}</td>
              </tr>
              <tr>
                <td class="label">難易度</td>
                <td>{{ record.difficulty }}</td>
              </tr>
              <tr>
                <td class="label">題數</td>
                <td>{{ record.question_count }} 題</td>
              </tr>
              <tr>
                <td class="label">題型</td>
                <td>{{ formatQuestionTypes(record.question_types) }}</td>
              </tr>
              <tr>
                <td class="label">測驗成績</td>
                <td>
                  <span v-if="record.score !== null" :class="getScoreTextClass(record.score)">
                    {{ record.score }} 分
                  </span>
                  <span v-else style="color: #999;">尚未批改</span>
                </td>
              </tr>
              <tr>
                <td class="label">是否訂正</td>
                <td :style="{ color: getTableCorrectionColor(record) }">
                  {{ getTableCorrectionText(record) }}
                </td>
              </tr>
            </tbody>
          </table>

          <div class="record-buttons">
            <button class="btn" @click="viewDetail(record)">查看詳解</button>
            <button class="btn" @click="correctPaper(record)">訂正考卷</button>
            <button class="btn" @click="similarTest(record)">類題考卷</button>
            <button class="btn" @click="retake(record)">再做一次</button>
            <button class="btn" @click="goToQuizCreate">其他測驗</button>
          </div>
        </div>
      </div>
    </div>
  </body>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const records = ref([]);
const loading = ref(true);

onMounted(async () => {
  await loadRecords();
});

// 載入測驗記錄
async function loadRecords() {
  loading.value = true;
  
  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    if (!currentUser.id) {
      alert('請先登入');
      router.push('/login');
      return;
    }

    const response = await fetch(`/api/quiz-records/user/${currentUser.id}`);
    
    if (!response.ok) {
      throw new Error('載入測驗記錄失敗');
    }

    const data = await response.json();
    
    // 為每筆記錄新增 expanded 屬性
    records.value = data.map(record => ({
      ...record,
      expanded: false
    }));

  } catch (error) {
    console.error('載入測驗記錄失敗:', error);
    alert('載入測驗記錄失敗: ' + error.message);
  } finally {
    loading.value = false;
  }
}

// 展開及收合記錄
function toggle(index) {
  records.value[index].expanded = !records.value[index].expanded;
}

// 查看詳解
async function viewDetail(record) {
  try {
    // 直接導向詳解頁面
    router.push({
      name: 'QuizSolution',
      params: { id: record.id }
    });
    
  } catch (error) {
    console.error('載入測驗詳情失敗:', error);
    alert('載入測驗詳情失敗: ' + error.message);
  }
}

// 訂正考卷
async function correctPaper(record) {
  try {
    // 檢查是否有需要訂正的題目
    const response = await fetch(`/api/quiz-records/${record.id}/corrections`);
    
    if (!response.ok) {
      throw new Error('檢查訂正狀態失敗');
    }

    const data = await response.json();
    
    if (data.totalWrong === 0) {
      alert('本次測驗已無需要訂正的題目');
      return;
    }

    // 導向訂正頁面
    router.push({
      name: 'CorrectPaper',
      params: { id: record.id }
    });

  } catch (error) {
    console.error('訂正考卷失敗:', error);
    alert('訂正考卷失敗: ' + error.message);
  }
}

// 類題考卷
function similarTest(record) {
  console.log('類題考卷:', record);
  alert('類題考卷功能開發中');
  // TODO: 實作類題考卷功能
}

// 再作一次功能
async function retake(record) {
  try {
    // 取得該測驗記錄的詳細資料(包含所有題目)
    const response = await fetch(`/api/quiz-records/${record.id}`);
    
    if (!response.ok) {
      throw new Error('載入測驗詳情失敗');
    }

    const detail = await response.json();
    
    console.log('重考測驗詳情:', detail);
    
    // 提取題目 ID 列表(保持順序)
    const questionIds = detail.questions.map(q => q.question_id).join(',');
    
    // 使用原始的時間限制
    let timeLimit = record.time_limit; // 直接使用資料庫中儲存的時間限制(分鐘)
    
    console.log('重考參數:', {
      timing_mode: record.timing_mode,
      question_count: record.question_count,
      timeLimit: timeLimit,
      note: timeLimit ? `使用原始時間限制: ${timeLimit} 分鐘` : '正向計時無時間限制'
    });
    
    // 導向測驗頁面,使用 retake 模式
    router.push({
      name: 'QuizTaking',
      query: {
        retake: 'true',
        recordId: record.id,
        questionIds: questionIds,
        topic: record.topic,
        concept: record.concept,
        difficulty: record.difficulty,
        count: record.question_count,
        timing: record.timing_mode,
        timeLimit: timeLimit || undefined, // 使用原始時間限制
        types: record.question_types
      }
    });
    
  } catch (error) {
    console.error('重考測驗失敗:', error);
    alert('無法重新作答: ' + error.message);
  }
}

// 其他測驗按鈕功能(跳轉到測驗建立頁面)
function goToQuizCreate() {
  router.push({ name: 'QuizCreate' });
}

// 格式化完整日期時間（包含時分秒）
function formatDateTime(datetime) {
  if (!datetime) return '';
  
  try {
    const date = new Date(datetime);
    
    // 檢查日期是否有效
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', datetime);
      return '日期格式錯誤';
    }
    
    // 直接加上 8 小時 (UTC+8)
    date.setHours(date.getHours() + 8);
    
    // 格式化顯示（包含時分秒）
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
  } catch (error) {
    console.error('formatDateTime error:', error);
    return '日期格式錯誤';
  }
}

function formatDateOnly(datetime) {
  if (!datetime) return '';
  
  try {
    const date = new Date(datetime);
    
    // 檢查日期是否有效
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', datetime);
      return '日期格式錯誤';
    }
    
    // 直接加上 8 小時 (UTC+8)
    date.setHours(date.getHours() + 8);
    
    // 格式化顯示 (只顯示日期)
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    
    return `${year}/${month}/${day}`;
  } catch (error) {
    console.error('formatDateOnly error:', error);
    return '日期格式錯誤';
  }
}

// 格式化作答時間
function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes} 分 ${secs} 秒`;
}

// 取得計時方式標籤
function getTimingModeLabel(record) {
  if (record.timing_mode === 'forward') {
    return '正向計時';
  } else if (record.timing_mode === 'countdown') {
    // 倒數計時模式:判斷是系統建議還是自訂
    if (record.time_limit) {
      // 系統建議倒數計時:每題5分鐘
      const systemSuggestedTime = record.question_count * 5;
      
      if (record.time_limit === systemSuggestedTime) {
        return '倒數計時 (系統建議)';
      } else {
        return `倒數計時 (自訂:${record.time_limit}分鐘)`;
      }
    } else {
      // 沒有時間限制資料(舊資料)
      return '倒數計時';
    }
  }
  
  return record.timing_mode || '未知';
}

// 格式化題型
function formatQuestionTypes(types) {
  const typeLabels = {
    'single': '單選題',
    'multiple': '多選題',
    'fill': '選填題'
  };
  
  return types.split(',').map(t => typeLabels[t] || t).join('、');
}

// 取得成績徽章的 CSS class
function getScoreBadgeClass(score) {
  if (score === 0) {
    return 'score-fail';      // 0 分時顯示紅色
  } else if (score < 60) {
    return 'score-warning';   // <60 分時顯示橘色
  } else {
    return 'score-pass';      // >=60 分時顯示綠色
  }
}

// 取得成績文字的 CSS class
function getScoreTextClass(score) {
  if (score === 0) {
    return 'text-fail';
  } else if (score < 60) {
    return 'text-warning';
  } else {
    return 'text-pass';
  }
}

// 取得訂正徽章的 CSS class
function getCorrectionBadgeClass(record) {
  // 如果沒有分數（尚未批改），不顯示訂正狀態
  if (record.score === null) {
    return 'correction-none';
  }
  
  // 滿分視為已訂正
  if (record.score === 100) {
    return 'correction-done';
  }
  
  // 根據 corrected 欄位決定：已訂正 = 綠色，未訂正 = 紅色
  return record.corrected ? 'correction-done' : 'correction-pending';
}

// 取得訂正徽章的文字
function getCorrectionText(record) {
  // 如果沒有分數（尚未批改），不顯示
  if (record.score === null) {
    return '';
  }
  
  // 滿分視為已訂正
  if (record.score === 100) {
    return '已訂正';
  }
  
  // 根據 corrected 欄位決定文字
  return record.corrected ? '已訂正' : '未訂正';
}

// 取得表格中訂正狀態的文字
function getTableCorrectionText(record) {
  // 如果沒有分數（尚未批改）
  if (record.score === null) {
    return '尚未批改';
  }
  
  // 滿分視為已訂正
  if (record.score === 100) {
    return '已完成訂正';
  }
  
  // 根據 corrected 欄位決定文字
  return record.corrected ? '已完成訂正' : '未完成訂正';
}

// 取得表格中訂正狀態的顏色
function getTableCorrectionColor(record) {
  // 如果沒有分數（尚未批改）
  if (record.score === null) {
    return '#999';
  }
  
  // 滿分或已訂正顯示綠色
  if (record.score === 100 || record.corrected) {
    return 'green';
  }
  
  // 未訂正顯示紅色
  return 'red';
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
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.badge-container {
  display: flex;
  gap: 8px;
  align-items: center;
}

/* 訂正狀態徽章樣式 */
.correction-badge {
  text-align: center;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  min-width: 60px;
}

/* 已訂正（綠色） */
.correction-done {
  background-color: #27ae60;
}

/* 未訂正（紅色） */
.correction-pending {
  background-color: #e74c3c;
}

/* 尚未批改時不顯示 */
.correction-none {
  display: none;
}

.score-badge {
  text-align: center;
  color: white;
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 16px;
  font-weight: bold;
  min-width: 50px;
}

/* 右上角成績背景顏色 */
.score-pass {
  background-color: #27ae60; /* >=60 分時顯示綠色 */
}

.score-warning {
  background-color: #f39c12; /* <60 分時顯示橘色 */
}

.score-fail {
  background-color: #e74c3c; /* 0 分時顯示紅色 */
}

/* 成績文字顏色 */
.text-pass {
  color: #27ae60;
}

.text-warning {
  color: #f39c12;
}

.text-fail {
  color: #e74c3c;
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
