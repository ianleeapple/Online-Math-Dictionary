<template>
  <div class="question-page">
    <h2>檢視題庫</h2>

    <div class="form-container">
      <!-- 範圍選單 -->
      <div class="form-group">
        <label><h3>請選擇範圍</h3></label>
        <select v-model="selectedLevel">
          <option disabled value="">請選擇範圍</option>
          <option value="國中">國中</option>
          <option value="高中">高中</option>
        </select>
      </div>

      <!-- 主題選單 -->
      <div class="form-group">
        <label><h3>選擇主題</h3></label>
        <select v-model="selectedTopic">
          <option disabled value="">請選擇一個主題</option>
          <option v-for="topic in topics" :key="topic" :value="topic">{{ topic }}</option>
        </select>
      </div>

      <!-- 觀念選單 -->
      <div class="form-group">
        <label><h3>選擇觀念</h3></label>
        <select v-model="selectedConcept">
          <option disabled value="">請選擇一個觀念</option>
          <option v-for="concept in filteredConcepts" :key="concept" :value="concept">{{ concept }}</option>
        </select>
      </div>

      <div class="btn-row" style="margin-top:8px;">
        <button class="btn" @click="fetchQuestions">搜尋題目</button>
      </div>
    </div>

    <div class="form-container" style="margin-top:16px;">
      <h3>符合的題目 ({{ questions.length }})</h3>
      <div v-if="loading">載入中...</div>
      <div v-else>
        <div v-if="questions.length === 0">目前無符合的題目，請調整篩選條件。</div>
        <table v-else class="question-table">
          <thead>
            <tr>
              <th>範圍</th>
              <th>主題</th>
              <th>觀念</th>
              <th>題目內容</th>
              <th>題目附圖</th>
              <th>答案</th>
              <th>難易度</th>
              <th>建立時間</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="q in questions" :key="q.id">
              <td>{{ q.level }}</td>
              <td>{{ q.topic }}</td>
              <td>{{ q.concept }}</td>
              <td>{{ q.content }}</td>
              <td>
                <span v-if="q.image_url">有</span>
                <span v-else>無</span>
              </td>
              <td>{{ q.answer }}</td>
              <td>{{ q.difficulty }}</td>
              <td>{{ formatDate(q.created_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const allConcepts = ref({
  國中: {
    '主題01': ['觀念01-A', '觀念01-B'],
    '主題02': ['觀念02-A', '觀念02-B', '觀念02-C'],
    '主題03': ['觀念03-A'],
    '主題04': ['觀念04-A', '觀念04-B'],
    '主題05': ['觀念05-A', '觀念05-B', '觀念05-C']
  },
  高中: {
    '主題H01': ['觀念H01-A', '觀念H01-B'],
    '主題H02': ['觀念H02-A', '觀念H02-B', '觀念H02-C'],
    '主題H03': ['觀念H03-A'],
    '主題H04': ['觀念H04-A', '觀念H04-B'],
    '主題H05': ['觀念H05-A', '觀念H05-B']
  }
});

const selectedLevel = ref('');
const selectedTopic = ref('');
const selectedConcept = ref('');

const topics = computed(() => {
  if (!selectedLevel.value) return [];
  return Object.keys(allConcepts.value[selectedLevel.value] || {});
});
const filteredConcepts = computed(() => {
  if (!selectedLevel.value || !selectedTopic.value) return [];
  return allConcepts.value[selectedLevel.value][selectedTopic.value] || [];
});

watch(selectedLevel, () => {
  selectedTopic.value = '';
  selectedConcept.value = '';
});
watch(selectedTopic, () => {
  selectedConcept.value = '';
});

// questions list
const questions = ref([]);
const loading = ref(false);

function buildQueryParams() {
  const params = new URLSearchParams();
  if (selectedLevel.value) params.append('level', selectedLevel.value);
  if (selectedTopic.value) params.append('topic', selectedTopic.value);
  if (selectedConcept.value) params.append('concept', selectedConcept.value);
  return params.toString();
}

async function fetchQuestions() {
  if (!selectedLevel.value || !selectedTopic.value || !selectedConcept.value) {
    return alert('請先選擇範圍、主題與觀念以進行搜尋');
  }

  loading.value = true;
  try {
    const q = buildQueryParams();
    const res = await fetch('/api/question?' + q);
    
    const rawText = await res.text();
    
    if (rawText.startsWith('<!DOCTYPE') || rawText.startsWith('<html')) {
      throw new Error('伺服器回傳 HTML 而非 JSON，可能後端服務未正確啟動');
    }
    
    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      throw new Error('伺服器回應格式錯誤');
    }
    
    if (!res.ok) {
      throw new Error(data.message || '無法取得題目');
    }

    questions.value = Array.isArray(data) ? data : [];
    
  } catch (e) {
    alert('取得題目失敗：' + e.message);
    questions.value = [];
  } finally {
    loading.value = false;
  }
}

function copyQuestion(q) {
  const text = q.content || '';
  navigator.clipboard?.writeText(text).then(() => {
    alert('題目已複製到剪貼簿');
  }, () => {
    alert('複製失敗');
  });
}

function viewRaw(q) {
  alert(JSON.stringify(q, null, 2));
}

function formatDate(ts) {
  if (!ts) return '';
  const d = new Date(ts);
  return d.toLocaleString();
}
</script>

<style scoped>
.question-page {
  font-family: 'Noto Sans TC', sans-serif;
  background-color: #f9f9f9;
  padding: 20px;
  box-sizing: border-box;
}
h2 { margin-bottom: 20px; }

.form-container {
  width: 100%;
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  border: 2px solid #d0d6dc;
  margin: 0 auto 24px;
  box-sizing: border-box;
}

.form-group { margin-bottom: 16px; }
.form-group > label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #2d2d2d;
}

.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 12px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
}

.btn {
  background-color: #d67b7b;
  color: white;
  padding: 10px 18px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}
.btn:hover { background-color: #c06565; }

.btn-row {
  display: flex;
  gap: 12px;
  align-items: center;
  margin-top: 16px;
}

/* 題目卡片只微調內距（不改變版位） */
.question-card {
  padding: 16px;
  border-radius: 8px;
  margin-top: 12px;
  box-sizing: border-box;
}

.question-image {
  margin: 16px 0;
}
.question-image img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 6px;
}

/* 新增題目表格樣式 */
.question-table {
  width: 100%;
  border-collapse: collapse;
  margin-top: 16px;
  table-layout: fixed;
}
.question-table th,
.question-table td {
  padding: 12px;
  border: 1px solid #e0e6ea;
  text-align: center;
  word-wrap: break-word;
}
.question-table th {
  background-color: #f2f2f2;
  font-weight: bold;
}

/* 設定各欄位寬度 */
.question-table th:nth-child(1),
.question-table td:nth-child(1) {
  width: 8%;
}
.question-table th:nth-child(2),
.question-table td:nth-child(2) {
  width: 10%;
}
.question-table th:nth-child(3),
.question-table td:nth-child(3) {
  width: 12%;
}
.question-table th:nth-child(4) {
  width: 30%;
  text-align: center;
}
.question-table td:nth-child(4) {
  width: 30%;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  text-align: left;
}
.question-table th:nth-child(5),
.question-table td:nth-child(5) {
  width: 8%;
}
.question-table th:nth-child(6),
.question-table td:nth-child(6) {
  width: 12%;
}
.question-table th:nth-child(7),
.question-table td:nth-child(7) {
  width: 8%;
}
.question-table th:nth-child(8),
.question-table td:nth-child(8) {
  width: 12%;
}

.question-thumbnail {
  max-width: 100px;
  max-height: 100px;
  border-radius: 4px;
  margin-top: 8px;
}
</style>