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
              <th>題型</th>
              <th>答案</th>
              <th>難易度</th>
              <th>建立時間</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="q in questions" :key="q.id">
              <td>{{ q.level }}</td>
              <td v-html="formatTopic(q.topic)"></td>
              <td>{{ q.concept }}</td>
              <td>{{ q.content }}</td>
              <td>
                <span v-if="q.image_url">有</span>
                <span v-else>無</span>
              </td>
              <td>{{ getTypeName(q.type) }}</td>
              <td>{{ q.answer }}</td>
              <td>{{ q.difficulty }}</td>
              <td>{{ formatDate(q.created_at) }}</td>
              <td>
                <div class="action-buttons">
                  <button class="action-btn edit-btn" @click="editQuestion(q)">編輯</button>
                  <button class="action-btn delete-btn" @click="deleteQuestion(q.id)">刪除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 編輯題目區塊 -->
    <div v-if="editingQuestion" class="modal-overlay" @click.self="cancelEdit">
      <div class="modal-content">
        <h3>編輯題目</h3>
        
        <div class="form-group">
          <label>範圍 <span class="required">*</span></label>
          <select v-model="editForm.level" required>
            <option value="國中">國中</option>
            <option value="高中">高中</option>
          </select>
        </div>

        <div class="form-group">
          <label>主題 <span class="required">*</span></label>
          <select v-model="editForm.topic" required>
            <option disabled value="">請選擇主題</option>
            <option v-for="topic in editTopics" :key="topic" :value="topic">{{ topic }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>觀念 <span class="required">*</span></label>
          <select v-model="editForm.concept" required>
            <option disabled value="">請選擇觀念</option>
            <option v-for="concept in editConcepts" :key="concept" :value="concept">{{ concept }}</option>
          </select>
        </div>

        <div class="form-group">
          <label>題目內容 <span class="required">*</span></label>
          <textarea v-model="editForm.content" rows="4" required></textarea>
        </div>

        <div class="form-group">
          <label>題型 <span class="required">*</span></label>
          <select v-model="editForm.type" required>
            <option value="single">單選題</option>
            <option value="multiple">多選題</option>
            <option value="fill">選填題</option>
          </select>
        </div>

        <div class="form-group">
          <label>答案（選填）</label>
          <input type="text" v-model="editForm.answer" placeholder="請輸入答案" />
        </div>

        <div class="form-group">
          <label>難易度 <span class="required">*</span></label>
          <select v-model="editForm.difficulty" required>
            <option value="容易">容易</option>
            <option value="中等">中等</option>
            <option value="困難">困難</option>
            <option value="魔王">魔王</option>
          </select>
        </div>

        <div class="modal-actions">
          <button class="btn" @click="saveEdit">儲存變更</button>
          <button class="btn cancel-btn" @click="cancelEdit">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue';

const allConcepts = ref({
  國中: {
    '主題00 國中測試用主題': ['所有觀念'],
    '主題01 數線與數的運算': ['所有觀念'],
    '主題02 因數與倍數': ['所有觀念'],
    '主題03 一元一次方程式': ['所有觀念'],
    '主題04 二元一次方程式': ['所有觀念'],
    '主題05 直角坐標平面': ['所有觀念'],
    '主題06 比例': ['所有觀念'],
    '主題07 一元一次不等式': ['所有觀念'],
    '主題08 線對稱與三視圖': ['所有觀念'],
    '主題09 乘法公式與多項式': ['所有觀念'],
    '主題10 根式運算與畢氏定理': ['所有觀念'],
    '主題11 因式分解': ['所有觀念'],
    '主題12 一元二次方程式': ['所有觀念'],
    '主題13 數列與級數': ['所有觀念'],
    '主題14 函數定義與線型函數': ['所有觀念'],
    '主題15 三角形的基本性質': ['所有觀念'],
    '主題16 平行與四邊形': ['所有觀念'],
    '主題17 相似形': ['所有觀念'],
    '主題18 圓形': ['所有觀念'],
    '主題19 推理證明與三心': ['所有觀念'],
    '主題20 二次函數': ['所有觀念'],
    '主題21 統計': ['所有觀念'],
    '主題22 機率': ['所有觀念'],
    '主題23 立體圖形': ['所有觀念']
  },
  高中: {
    '主題00 高中測試用主題': ['所有觀念'],
    '主題01 數與式': ['所有觀念'],
    '主題02 指數與對數函數': ['所有觀念'],
    '主題03 直線與圓': ['所有觀念'],
    '主題04 多項式函數': ['所有觀念'],
    '主題05 數列級數': ['所有觀念'],
    '主題06 排列組合': ['所有觀念'],
    '主題07 機率': ['所有觀念'],
    '主題08 數據分析': ['所有觀念'],
    '主題09 三角函數': ['所有觀念'],
    '主題10 平面向量': ['所有觀念'],
    '主題11 平面上的比例(數B)': ['所有觀念'],
    '主題12 空間向量': ['所有觀念'],
    '主題13 空間中的平面與直線(數A)': ['所有觀念'],
    '主題14 矩陣': ['所有觀念'],
    '主題15 圓錐截痕(數B)': ['所有觀念'],
    '主題16 球面與經緯度(數B)': ['所有觀念'],
    '主題17 極限與函數': ['所有觀念'],
    '主題18 多項式的微積分': ['所有觀念'],
    '主題19 複數平面': ['所有觀念'],
    '主題20 機率分布與統計': ['所有觀念'],
    '主題21 二次曲線(數甲)': ['所有觀念'],
    '主題22 線性規劃(數乙)': ['所有觀念']
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

function getTypeName(type) {
  const typeMap = {
    'single': '單選題',
    'multiple': '多選題',
    'fill': '選填題'
  };
  return typeMap[type] || type;
}

// 將主題編號及名稱分行顯示"
function formatTopic(topic) {
  if (!topic) return '';
  const match = topic.match(/^(主題\d+)\s+(.+)$/);
  if (match) {
    return `${match[1]}<br>${match[2]}`;
  }
  return topic;
}

const editingQuestion = ref(null);
const editForm = ref({
  id: null,
  level: '',
  topic: '',
  concept: '',
  content: '',
  type: '',
  answer: '',
  difficulty: ''
});

const editTopics = computed(() => {
  if (!editForm.value.level) return [];
  return Object.keys(allConcepts.value[editForm.value.level] || {});
});

const editConcepts = computed(() => {
  if (!editForm.value.level || !editForm.value.topic) return [];
  return allConcepts.value[editForm.value.level][editForm.value.topic] || [];
});

// 為編輯表單新增一個標記，避免 watch 清空已設定的值
const isEditingInit = ref(false);

watch(() => editForm.value.level, () => {
  if (!isEditingInit.value) {
    editForm.value.topic = '';
    editForm.value.concept = '';
  }
});

watch(() => editForm.value.topic, () => {
  if (!isEditingInit.value) {
    editForm.value.concept = '';
  }
});

function editQuestion(question) {
  editingQuestion.value = question;
  
  // 設定初始化標記，防止 watch 清空值
  isEditingInit.value = true;
  
  // 確保所有欄位都正確填入
  editForm.value = {
    id: question.id,
    level: question.level || '',
    topic: question.topic || '',
    concept: question.concept || '',
    content: question.content || '',
    type: question.type || 'single',
    answer: question.answer || '',
    difficulty: question.difficulty || '中等'
  };
  
  // 使用 nextTick 確保 DOM 更新後再解除標記
  setTimeout(() => {
    isEditingInit.value = false;
  }, 100);
  
  console.log('編輯題目資料:', editForm.value);
}

function cancelEdit() {
  editingQuestion.value = null;
  isEditingInit.value = false;
  editForm.value = {
    id: null,
    level: '',
    topic: '',
    concept: '',
    content: '',
    type: '',
    answer: '',
    difficulty: ''
  };
}

async function saveEdit() {
  if (!editForm.value.level || !editForm.value.topic || !editForm.value.concept || 
      !editForm.value.content || !editForm.value.type || !editForm.value.difficulty) {
    alert('請填寫所有必填欄位');
    return;
  }

  try {
    const res = await fetch(`/api/question/${editForm.value.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        level: editForm.value.level,
        topic: editForm.value.topic,
        concept: editForm.value.concept,
        content: editForm.value.content,
        type: editForm.value.type,
        answer: editForm.value.answer,
        difficulty: editForm.value.difficulty
      })
    });

    const rawText = await res.text();
    
    if (rawText.startsWith('<!DOCTYPE') || rawText.startsWith('<html')) {
      throw new Error('伺服器回傳 HTML 而非 JSON，請確認後端服務已啟動');
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      throw new Error('伺服器回應格式錯誤');
    }
    
    if (!res.ok) {
      throw new Error(data.message || '更新失敗');
    }

    alert('更新成功！');
    cancelEdit();
    fetchQuestions();
  } catch (e) {
    console.error('完整錯誤:', e);
    alert('更新失敗：' + e.message);
  }
}

async function deleteQuestion(id) {
  if (!confirm('是否要刪除此題目？')) {
    return;
  }

  try {
    const res = await fetch(`/api/question/${id}`, {
      method: 'DELETE'
    });

    const rawText = await res.text();
    
    if (rawText.startsWith('<!DOCTYPE') || rawText.startsWith('<html')) {
      throw new Error('伺服器回傳 HTML 而非 JSON，請確認後端服務已啟動');
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      throw new Error('伺服器回應格式錯誤');
    }
    
    if (!res.ok) {
      throw new Error(data.message || '刪除失敗');
    }

    alert('刪除成功！');
    fetchQuestions();
  } catch (e) {
    console.error('完整錯誤:', e);
    alert('刪除失敗：' + e.message);
  }
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
.btn:hover {
  background-color: #c06565;
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
  width: 6%;
}
.question-table th:nth-child(2),
.question-table td:nth-child(2) {
  width: 12%;
}
.question-table th:nth-child(3),
.question-table td:nth-child(3) {
  width: 10%;
}
.question-table th:nth-child(4) {
  width: 25%;
  text-align: center;
}
.question-table td:nth-child(4) {
  width: 25%;
  max-width: 250px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  text-align: left;
}
.question-table th:nth-child(5),
.question-table td:nth-child(5) {
  width: 6%;
}
.question-table th:nth-child(6),
.question-table td:nth-child(6) {
  width: 7%;
}
.question-table th:nth-child(7),
.question-table td:nth-child(7) {
  width: 10%;
}
.question-table th:nth-child(8),
.question-table td:nth-child(8) {
  width: 6%;
}
.question-table th:nth-child(9),
.question-table td:nth-child(9) {
  width: 12%;
}
.question-table th:nth-child(10),
.question-table td:nth-child(10) {
  width: 6%;
  min-width: 70px;
}
.question-thumbnail {
  max-width: 100px;
  max-height: 100px;
  border-radius: 4px;
  margin-top: 8px;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: center;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 13px;
  width: 60px;
  transition: all 0.2s;
}

.edit-btn {
  background-color: #d67b7b;
  color: white;
}

.edit-btn:hover {
  background-color: #c06565;
}

.delete-btn {
  background-color: #d67b7b;
  color: white;
}

.delete-btn:hover {
  background-color: #c06565;
}

/* 模態框樣式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 10px;
  max-width: 600px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin-bottom: 20px;
  color: #333;
  border-bottom: 2px solid #d67b7b;
  padding-bottom: 10px;
}

.modal-content .form-group {
  margin-bottom: 15px;
}

.modal-content label {
  display: block;
  margin-bottom: 6px;
  font-weight: bold;
  color: #2d2d2d;
}

.modal-content input,
.modal-content textarea,
.modal-content select {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.cancel-btn {
  background-color: #95a5a6;
}

.cancel-btn:hover {
  background-color: #7f8c8d;
}

.required {
  color: #e74c3c;
  margin-left: 4px;
}
</style>