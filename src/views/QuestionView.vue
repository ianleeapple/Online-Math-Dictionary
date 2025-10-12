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
        <!-- 已移除重設選擇按鈕 -->
      </div>
    </div>

    <div class="form-container" style="margin-top:16px;">
      <h3>符合的題目 ({{ questions.length }})</h3>
      <div v-if="loading">載入中...</div>
      <div v-else>
        <div v-if="questions.length === 0">目前無符合的題目，請調整篩選條件。</div>
        <div v-for="q in questions" :key="q.id" class="question-card" style="margin-top:12px; padding:12px; border-radius:8px; border:1px solid #e0e6ea;">
          <div style="display:flex; justify-content:space-between; align-items:center;">
            <div>
              <strong>#{{ q.id }}</strong>
              <span style="margin-left:8px; color:#666;">[{{ q.level }}] {{ q.topic }} / {{ q.concept }}</span>
            </div>
            <div style="color:#999; font-size:12px;">{{ formatDate(q.created_at) }}</div>
          </div>

          <div style="margin-top:8px; white-space:pre-wrap;">{{ q.content }}</div>

          <div v-if="q.options && q.type !== 'fill'" style="margin-top:8px;">
            <div v-for="(opt, idx) in q.options" :key="idx" style="padding:6px 8px; background:#fafafa; border-radius:6px; margin-top:6px;">
              <strong>{{ optionLabel(idx) }}.</strong> {{ opt }}
            </div>
          </div>

          <div style="margin-top:8px; color:#2d2d2d;">
            <strong>答案：</strong>
            <span v-if="q.answer">{{ q.answer }}</span>
            <span v-else style="color:#999;">未提供</span>
          </div>

          <div style="margin-top:8px; display:flex; gap:8px;">
            <button class="btn" @click="copyQuestion(q)">複製題目內容</button>
            <button class="btn" @click="viewRaw(q)">顯示原始</button>
          </div>
        </div>
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
  // 必要條件：至少選一個範圍與主題與觀念（依需求可調）
  if (!selectedLevel.value || !selectedTopic.value || !selectedConcept.value) {
    // 允許使用者只用範圍或主題搜尋也可以，把這裡改為提示或允許
    // 目前要求三者齊全
    return alert('請先選擇範圍、主題與觀念以進行搜尋');
  }

  loading.value = true;
  try {
    const q = buildQueryParams();
    const res = await fetch('/api/questions?' + q);
    const data = await res.json();
    if (!res.ok) throw new Error(data.message || '無法取得題目');

    // 假設後端回傳陣列，且 options 為 JSON 字串或已為陣列
    questions.value = data.map(item => {
      // 嘗試處理 options 欄位
      const copy = { ...item };
      try {
        if (typeof copy.options === 'string') {
          copy.options = JSON.parse(copy.options);
        }
      } catch { /* leave as-is */ }
      return copy;
    });
  } catch (e) {
    alert('取得題目失敗：' + e.message);
    questions.value = [];
  } finally {
    loading.value = false;
  }
}

function optionLabel(idx) {
  return String.fromCharCode(65 + idx);
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

.options { margin-top: 6px; }
.radio-group { margin: 10px 0 0; }
.radio-row {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  align-items: center;
}
.radio-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}
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
</style>