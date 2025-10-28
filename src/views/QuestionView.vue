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
              <td><MathContent :content="q.content" /></td>
              <td>
                <span v-if="q.image_url">有</span>
                <span v-else>無</span>
              </td>
              <td>{{ getTypeName(q.type) }}</td>
              <td><MathContent :content="q.answer" /></td>
              <td>{{ q.difficulty }}</td>
              <td>{{ formatDate(q.created_at) }}</td>
              <td>
                <div class="action-buttons">
                  <button class="action-btn edit-btn" @click="editQuestion(q)">編輯</button>
                  <button class="action-btn generate-btn" @click="openGenerateDialog(q)">產生類題</button>
                  <button class="action-btn delete-btn" @click="deleteQuestion(q.id)">刪除</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>

    <!-- 編輯題目區塊 -->
    <div v-if="editingQuestion" class="modal-overlay">
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
          <label>答案 <span class="required">*</span></label>
          
          <!-- 單選題：4個選項 -->
          <div v-if="editForm.type === 'single'" class="answer-options">
            <label v-for="option in ['A', 'B', 'C', 'D']" :key="option" class="radio-option">
              <input type="radio" :value="option" v-model="editForm.answer" />
              {{ option }}
            </label>
          </div>

          <!-- 多選題：5個選項 -->
          <div v-else-if="editForm.type === 'multiple'" class="answer-options">
            <label v-for="option in ['A', 'B', 'C', 'D', 'E']" :key="option" class="checkbox-option">
              <input type="checkbox" :value="option" :checked="editMultipleAnswers.includes(option)"@change="toggleEditMultipleAnswer(option)"/>
              {{ option }}
            </label>
          </div>

          <!-- 選填題：輸入框 -->
          <div v-else-if="editForm.type === 'fill'">
            <input type="text" v-model="editForm.answer" placeholder="請輸入答案"required/>
          </div>
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

    <!-- 產生類題對話框 -->
    <div v-if="showGenerateDialog" class="modal-overlay">
      <div class="modal-content">
        <h3>AI 產生類題</h3>
        
        <div class="form-group">
          <label>原始題目預覽</label>
          <div class="question-preview">{{ generateSourceQuestion?.content.substring(0, 100) }}...</div>
        </div>

        <div class="form-group">
          <label>生成數量 <span class="required">*</span></label>
          <select v-model="generateCount">
            <option value="1">1 題</option>
            <option value="2">2 題</option>
            <option value="3">3 題</option>
            <option value="5">5 題</option>
            <option value="10">10 題</option>
          </select>
        </div>

        <p class="help-text">
          AI 將根據此題目生成 {{ generateCount }} 道類似題目，題目將自動加上「(AI生成)」標記。
          生成任務會在背景處理，您可以關閉此視窗繼續其他操作。
        </p>

        <div class="modal-actions">
          <button class="btn" @click="submitGenerateTask" :disabled="isGenerating">
            {{ isGenerating ? '建立中...' : '開始生成' }}
          </button>
          <button class="btn cancel-btn" @click="closeGenerateDialog">取消</button>
        </div>
      </div>
    </div>

    <!-- 任務進度監控區塊 -->
    <div v-if="activeTasks.length > 0" class="form-container tasks-container">
      <div class="tasks-header">
        <h3>AI 生成任務進度</h3>
        <button class="close-tasks-btn" @click="clearCompletedTasks" title="清除已完成任務">
          清除已完成
        </button>
      </div>
      <div v-for="task in activeTasks" :key="task.taskId" class="task-card">
        <div class="task-header">
          <span class="task-id">任務 #{{ task.taskId }}</span>
          <span class="task-status" :class="'status-' + task.status">{{ getStatusText(task.status) }}</span>
          <button 
            v-if="task.status === 'completed' || task.status === 'failed'" 
            class="close-task-btn" 
            @click="removeTask(task.taskId)"
            title="移除此任務"
          >
            ✕
          </button>
        </div>
        <div class="task-info">
          <p>原始題目: {{ task.sourceContent }}</p>
          <p>進度: {{ task.completedCount }} / {{ task.totalCount }} 題</p>
        </div>
        <div class="progress-bar">
          <div class="progress-fill" :style="{ width: task.progress + '%' }"></div>
        </div>
        <div v-if="task.status === 'completed'" class="task-success">
          ✅ 生成完成！已新增 {{ task.completedCount }} 道題目到題庫
        </div>
        <div v-if="task.status === 'failed'" class="task-error">
          ❌ 生成失敗: {{ task.errorMessage }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue';
import MathContent from '../components/MathContent.vue';

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

// 編輯時的多選題答案陣列
const editMultipleAnswers = ref([]);

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

// 切換編輯時的多選題答案
function toggleEditMultipleAnswer(option) {
  const index = editMultipleAnswers.value.indexOf(option);
  if (index > -1) {
    editMultipleAnswers.value.splice(index, 1);
  } else {
    editMultipleAnswers.value.push(option);
  }
  // 排序並組合為字串
  editMultipleAnswers.value.sort();
  editForm.value.answer = editMultipleAnswers.value.join(',');
}

// 監聽編輯表單的題型變化
watch(() => editForm.value.type, (newType, oldType) => {
  // 只在非初始化時清空答案
  if (!isEditingInit.value && oldType) {
    editForm.value.answer = '';
    editMultipleAnswers.value = [];
  }
});

function editQuestion(question) {
  editingQuestion.value = question;
  
  // 設定初始化標記
  isEditingInit.value = true;
  
  // 填入表單資料
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
  
  // 如果是多選題，解析答案為陣列
  if (question.type === 'multiple' && question.answer) {
    editMultipleAnswers.value = question.answer.split(',').map(a => a.trim());
  } else {
    editMultipleAnswers.value = [];
  }
  
  setTimeout(() => {
    isEditingInit.value = false;
  }, 100);
  
  console.log('編輯題目資料:', editForm.value);
}

function cancelEdit() {
  editingQuestion.value = null;
  isEditingInit.value = false;
  editMultipleAnswers.value = [];
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

  // 檢查答案欄位是否已填寫
  if (!editForm.value.answer || editForm.value.answer.trim() === '') {
    alert('請選擇或填寫答案');
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

// ==================== AI 產生類題功能 ====================
const showGenerateDialog = ref(false);
const generateSourceQuestion = ref(null);
const generateCount = ref('3');
const isGenerating = ref(false);
const activeTasks = ref([]);
const dismissedTaskIds = ref([]); // 記錄使用者已關閉的任務 ID
let taskPollingInterval = null;

// 取得當前使用者
function getCurrentUser() {
  const userData = localStorage.getItem('currentUser');
  return userData ? JSON.parse(userData) : null;
}

// 打開產生對話框
function openGenerateDialog(question) {
  generateSourceQuestion.value = question;
  generateCount.value = '3';
  showGenerateDialog.value = true;
}

// 關閉產生對話框
function closeGenerateDialog() {
  showGenerateDialog.value = false;
  generateSourceQuestion.value = null;
}

// 提交生成任務
async function submitGenerateTask() {
  const currentUser = getCurrentUser();
  if (!currentUser) {
    alert('請先登入');
    return;
  }

  isGenerating.value = true;

  try {
    const response = await fetch('/api/generation-tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId: currentUser.id,
        sourceQuestionId: generateSourceQuestion.value.id,
        count: parseInt(generateCount.value)
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || '建立任務失敗');
    }

    const data = await response.json();
    
    alert(`✅ 已建立生成任務 #${data.taskId}\n將生成 ${generateCount.value} 道類似題目\n\n任務將在背景處理，您可以繼續其他操作。`);
    
    // 加入監控列表
    loadUserTasks();
    
    closeGenerateDialog();

  } catch (error) {
    console.error('建立任務失敗:', error);
    alert('建立任務失敗: ' + error.message);
  } finally {
    isGenerating.value = false;
  }
}

// 載入使用者的任務列表
async function loadUserTasks() {
  const currentUser = getCurrentUser();
  if (!currentUser) return;

  try {
    const response = await fetch(`/api/generation-tasks/user/${currentUser.id}`);
    if (!response.ok) throw new Error('載入任務失敗');
    
    const tasks = await response.json();
    
    // 只保留進行中的任務 + 當前畫面上已顯示的已完成任務
    const currentTaskIds = activeTasks.value.map(t => t.taskId);
    
    activeTasks.value = tasks.filter(task => {
      // 如果使用者已關閉此任務，不顯示
      if (dismissedTaskIds.value.includes(task.taskId)) {
        return false;
      }
      
      // 保留進行中的任務
      if (task.status === 'pending' || task.status === 'processing') {
        return true;
      }
      
      // 如果是已完成/失敗的任務，只保留當前已在畫面上的
      if (task.status === 'completed' || task.status === 'failed') {
        return currentTaskIds.includes(task.taskId);
      }
      
      return false;
    });

  } catch (error) {
    console.error('載入任務失敗:', error);
  }
}

// 判斷任務是否為最近 5 分鐘內（已廢棄，保留以防需要）
function isRecent(updatedAt) {
  const taskTime = new Date(updatedAt).getTime();
  const now = Date.now();
  return (now - taskTime) < 5 * 60 * 1000; // 5 分鐘
}

// 取得任務狀態文字
function getStatusText(status) {
  const map = {
    pending: '等待中',
    processing: '生成中',
    completed: '已完成',
    failed: '失敗'
  };
  return map[status] || status;
}

// 開始輪詢任務狀態
function startTaskPolling() {
  if (taskPollingInterval) return;
  
  // 初始載入
  loadUserTasks();
  
  // 每 3 秒輪詢一次
  taskPollingInterval = setInterval(async () => {
    // 記錄輪詢前的任務狀態
    const previousTasks = [...activeTasks.value];
    
    // 重新載入任務
    await loadUserTasks();
    
    // 檢查是否有任務剛完成（狀態從 pending/processing 變成 completed/failed）
    const newlyCompleted = activeTasks.value.filter(t => 
      (t.status === 'completed' || t.status === 'failed') &&
      !previousTasks.some(prev => prev.taskId === t.taskId && (prev.status === 'completed' || prev.status === 'failed'))
    );
    
    // 如果有任務剛完成，且有題目列表，自動刷新題目
    if (newlyCompleted.length > 0) {
      console.log(`[任務] 檢測到 ${newlyCompleted.length} 個任務完成`);
      
      // 如果有題目列表，刷新顯示新生成的題目
      if (questions.value.length > 0) {
        console.log('[任務] 刷新題目列表');
        fetchQuestions();
      }
    }
  }, 3000);
}

// 停止輪詢
function stopTaskPolling() {
  if (taskPollingInterval) {
    clearInterval(taskPollingInterval);
    taskPollingInterval = null;
  }
}

// 移除單一任務
function removeTask(taskId) {
  // 記錄此任務 ID 為已關閉
  if (!dismissedTaskIds.value.includes(taskId)) {
    dismissedTaskIds.value.push(taskId);
  }
  
  // 從顯示列表中移除
  activeTasks.value = activeTasks.value.filter(t => t.taskId !== taskId);
}

// 清除所有已完成的任務
function clearCompletedTasks() {
  // 記錄所有已完成/失敗的任務為已關閉
  activeTasks.value.forEach(task => {
    if ((task.status === 'completed' || task.status === 'failed') && 
        !dismissedTaskIds.value.includes(task.taskId)) {
      dismissedTaskIds.value.push(task.taskId);
    }
  });
  
  // 只保留進行中的任務
  activeTasks.value = activeTasks.value.filter(t => 
    t.status === 'pending' || t.status === 'processing'
  );
}

// 產生類題功能（舊版，保留但不使用）
function generateSimilarQuestion(question) {
  openGenerateDialog(question);
}

// 元件掛載時啟動輪詢
onMounted(() => {
  startTaskPolling();
});

// 元件卸載時停止輪詢
onUnmounted(() => {
  stopTaskPolling();
});
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
  width: 5%;
}
.question-table th:nth-child(2),
.question-table td:nth-child(2) {
  width: 11%;
}
.question-table th:nth-child(3),
.question-table td:nth-child(3) {
  width: 9%;
}
.question-table th:nth-child(4) {
  width: 24%;
  text-align: center;
}
.question-table td:nth-child(4) {
  width: 24%;
  max-width: 240px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: normal;
  text-align: left;
}
.question-table th:nth-child(5),
.question-table td:nth-child(5) {
  width: 5%;
}
.question-table th:nth-child(6),
.question-table td:nth-child(6) {
  width: 6%;
}
.question-table th:nth-child(7),
.question-table td:nth-child(7) {
  width: 7%;
}
.question-table th:nth-child(8),
.question-table td:nth-child(8) {
  width: 5%;
}
.question-table th:nth-child(9),
.question-table td:nth-child(9) {
  width: 12%;
}
.question-table th:nth-child(10),
.question-table td:nth-child(10) {
  width: 8%;
  min-width: 80px;
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
  justify-content: center;
}

.action-btn {
  padding: 6px 12px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 12px;
  width: 80px;
  transition: all 0.2s;
  white-space: nowrap;
}

.edit-btn {
  background-color: #d67b7b;
  color: white;
}

.edit-btn:hover {
  background-color: #c06565;
}

.generate-btn {
  background-color: #d67b7b;
  color: white;
}

.generate-btn:hover {
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

.answer-options {
  display: flex;
  gap: 15px;
  flex-wrap: wrap;
  margin-top: 10px;
}

.radio-option,
.checkbox-option {
  display: flex;
  align-items: center;
  gap: 6px;
  cursor: pointer;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  transition: all 0.2s;
}

.radio-option:hover,
.checkbox-option:hover {
  background-color: #f0f0f0;
  border-color: #d67b7b;
}

.radio-option input,
.checkbox-option input {
  cursor: pointer;
  width: auto;
  padding: 0;
  margin: 0;
}
/* 類題生成相關樣式 */
.question-preview {
  background-color: #f5f5f5;
  padding: 12px;
  border-radius: 6px;
  font-size: 13px;
  color: #555;
  border: 1px solid #ddd;
  max-height: 100px;
  overflow-y: auto;
}

.help-text {
  font-size: 12px;
  color: #666;
  margin-top: 8px;
  line-height: 1.5;
}

/* 任務進度區塊 */
.tasks-container {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  color: white;
}

.tasks-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
}

.tasks-container h3 {
  color: white;
  margin: 0;
}

.close-tasks-btn {
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 6px 12px;
  border-radius: 6px;
  cursor: pointer;
  font-size: 12px;
  transition: all 0.3s;
}

.close-tasks-btn:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.task-card {
  background: white;
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 12px;
  color: #333;
}

.task-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
  position: relative;
}

.task-id {
  font-weight: bold;
  font-size: 14px;
  color: #667eea;
}

.close-task-btn {
  position: absolute;
  right: 0;
  top: 0;
  background: none;
  border: none;
  color: #999;
  font-size: 18px;
  cursor: pointer;
  padding: 0;
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: all 0.2s;
}

.close-task-btn:hover {
  background-color: #f0f0f0;
  color: #333;
}

.task-status {
  padding: 4px 12px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.status-pending {
  background-color: #f39c12;
  color: white;
}

.status-processing {
  background-color: #3498db;
  color: white;
  animation: pulse 1.5s ease-in-out infinite;
}

.status-completed {
  background-color: #27ae60;
  color: white;
}

.status-failed {
  background-color: #e74c3c;
  color: white;
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}

.task-info {
  margin-bottom: 12px;
  font-size: 13px;
}

.task-info p {
  margin: 4px 0;
  color: #555;
}

.progress-bar {
  width: 100%;
  height: 20px;
  background-color: #ecf0f1;
  border-radius: 10px;
  overflow: hidden;
  margin-bottom: 12px;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 11px;
  font-weight: bold;
}

.task-success {
  padding: 10px;
  background-color: #d5f4e6;
  color: #27ae60;
  border-radius: 6px;
  font-size: 13px;
  font-weight: bold;
}

.task-error {
  padding: 10px;
  background-color: #f8d7da;
  color: #e74c3c;
  border-radius: 6px;
  font-size: 13px;
}
</style>