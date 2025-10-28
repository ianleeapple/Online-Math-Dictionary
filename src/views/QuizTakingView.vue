<template>
  <div class="container">
    <!-- 側邊資訊區 -->
    <div class="panel">
      <div class="top-info">
        <div><strong>主題：</strong>{{ quizInfo.topic }}</div>
        <div>
          <strong>測驗時間：</strong>{{ formattedTime }}
        </div>
      </div>
      <div class="question-nav">
        <button
          v-for="(q, i) in questions"
          :key="i"
          class="question-btn"
          :class="{ active: currentIndex === i, answered: isAnswered(i) }"
          @click="currentIndex = i"
        >
          {{ i + 1 }}
        </button>
      </div>
    </div>

    <!-- 主要題目區域 -->
    <div class="panel">
      <!-- 載入中提示 -->
      <div v-if="loading" style="text-align: center; padding: 40px;">
        <p>載入題目中...</p>
      </div>

      <!-- 沒有題目提示 -->
      <div v-else-if="questions.length === 0" style="text-align: center; padding: 40px;">
        <p>找不到符合條件的題目，請返回重新選擇條件</p>
        <button class="prev-btn" @click="router.push('/quiz/create')" style="margin-top: 20px;">
          返回測驗建立
        </button>
      </div>

      <!-- 題目顯示 -->
      <div v-else>
        <div class="question-title">
          <strong>第 {{ currentIndex + 1 }} 題 ({{ getQuestionTypeLabel(currentQuestion.type) }})</strong>
          {{ currentQuestion.content }}
        </div>

        <!-- 題目附圖區域 -->
        <div v-if="currentQuestion.image_url" class="question-image">
          <img :src="currentQuestion.image_url" :alt="'第 ' + (currentIndex + 1) + ' 題附圖'" />
        </div>

        <div class="options">
          <!-- 單選題 -->
          <div v-if="currentQuestion.type === 'single'">
            <label v-for="(opt, idx) in currentQuestion.options" :key="idx">
              <input 
                type="radio" 
                :name="'q' + currentIndex" 
                :value="idx" 
                v-model="answers[currentIndex]"
              > 
              {{ opt }}
            </label>
          </div>

          <!-- 多選題 -->
          <div v-else-if="currentQuestion.type === 'multiple'">
            <label v-for="(opt, idx) in currentQuestion.options" :key="idx">
              <input 
                type="checkbox" 
                :value="idx" 
                v-model="answers[currentIndex]"
              > 
              {{ opt }}
            </label>
          </div>

          <!-- 選填題 -->
          <div v-else-if="currentQuestion.type === 'fill'">
            <input 
              class="input-answer" 
              v-model="answers[currentIndex]" 
              placeholder="請填入答案" 
            />
          </div>
        </div>

        <div class="button-row">
          <!-- 左側按鈕 -->
          <div>
            <button v-if="currentIndex > 0" class="prev-btn" @click="prevQuestion">上一題</button>
          </div>
          
          <!-- 右側按鈕 -->
          <div class="right-buttons">
            <button v-if="currentIndex < questions.length - 1" class="next-btn" @click="nextQuestion">下一題</button>
            <button v-else class="submit-btn" @click="submitExam(false)">交卷</button>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';

const router = useRouter();
const route = useRoute();

// 測驗資訊
const quizInfo = ref({
  topic: '載入中...',
  level: '',
  concept: '',
  difficulty: '',
  questionCount: 0,
  timingMode: 'unlimited'
});

// 題目列表
const questions = ref([]);

// 載入狀態
const loading = ref(true);

// 當前題號（0-based）
const currentIndex = ref(0);

// 使用者答案
const answers = ref([]);

// 計時器（秒）
const timer = ref(0);
let timerInterval = null;

// 倒數計時相關
const isCountdown = ref(false);  // 是否為倒數計時模式
const timeLimit = ref(0);        // 時間限制（秒）

// 當前題目
const currentQuestion = computed(() => {
  return questions.value[currentIndex.value] || {
    content: '',
    type: 'single',
    options: []
  };
});

// 格式化時間顯示
const formattedTime = computed(() => {
  const totalSeconds = isCountdown.value ? timeLimit.value - timer.value : timer.value;
  const m = String(Math.floor(Math.abs(totalSeconds) / 60)).padStart(2, '0');
  const s = String(Math.abs(totalSeconds) % 60).padStart(2, '0');
  
  // 倒數計時模式顯示剩餘時間
  if (isCountdown.value) {
    return totalSeconds >= 0 ? `${m}:${s}` : '00:00';
  }
  
  // 正向計時模式
  return `${m}:${s}`;
});

// 判斷題目是否已作答
function isAnswered(index) {
  const answer = answers.value[index];
  if (answer === null || answer === undefined) return false;
  if (Array.isArray(answer)) return answer.length > 0;
  if (typeof answer === 'string') return answer.trim() !== '';
  return true;
}

// 下一題
function nextQuestion() {
  if (currentIndex.value < questions.value.length - 1) {
    currentIndex.value++;
  }
}

// 上一題
function prevQuestion() {
  if (currentIndex.value > 0) {
    currentIndex.value--;
  }
}

// 是否已完成測驗(判斷中離測驗是否需要提醒)
const isExamCompleted = ref(false);

// 交卷提示
async function submitExam(autoSubmit = false) {
  // 如果是手動交卷，顯示確認對話框
  if (autoSubmit === false) {
    const confirmed = confirm('確定要交卷嗎？');
    
    if (!confirmed) {
      return;
    }
  }

  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
 
    // 中途離開測驗提醒(標記測驗已完成不再需要離開提醒)
    isExamCompleted.value = true;

    // 根據交卷類型顯示不同訊息
    if (autoSubmit === true) {
      alert('測驗已自動提交');
    } else {
      alert('交卷成功!');
    }
    
    router.push('/quiz/records');

  } catch (error) {
    alert('提交失敗，請稍後再試');
  }
}

// 啟動計時器
function startTimer() {
  timerInterval = setInterval(() => {
    timer.value++;
    
    // 倒數計時模式：檢查是否時間到
    if (isCountdown.value && timer.value >= timeLimit.value) {
      clearInterval(timerInterval);
      alert('作答時間到，系統將自動交卷');
      submitExam(true); // 明確傳入 true 表示自動交卷
    }
  }, 1000);
}

// 取得題型中文標籤
function getQuestionTypeLabel(type) {
  const labels = {
    'single': '單選題',
    'multiple': '多選題',
    'fill': '選填題'
  };
  return labels[type] || '未知題型';
}

// 載入測驗資料
async function loadQuizData() {
  loading.value = true;
  
  try {
    // 從 route.query 取得篩選條件
    const { level, topic, concept, difficulty, count, timing, timeLimit: timeLimitParam, types } = route.query;
    
    console.log('篩選條件:', { level, topic, concept, difficulty, count, types, timing, timeLimit: timeLimitParam });
    
    // 設定計時模式
    isCountdown.value = timing === 'countdown';
    if (isCountdown.value && timeLimitParam) {
      // 將分鐘轉換為秒
      timeLimit.value = parseInt(timeLimitParam) * 60;
      console.log('倒數計時模式，時間限制:', timeLimit.value, '秒 (', timeLimitParam, '分鐘)');
    }
    
    // 更新測驗資訊
    quizInfo.value = {
      topic: topic || '數學',
      level: level || '',
      concept: concept || '',
      difficulty: difficulty || '',
      questionCount: parseInt(count) || 10,
      timingMode: timing || 'forward'
    };

    // 建立 API 查詢參數
    const params = new URLSearchParams();
    if (level) params.append('level', level);
    if (topic) params.append('topic', topic);
    if (concept && concept !== '所有觀念') params.append('concept', concept);
    if (difficulty) params.append('difficulty', difficulty);

    console.log('API 查詢參數:', params.toString());

    // 從 API 抓取題目
    const response = await fetch(`/api/question?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error('抓取題目失敗');
    }

    const data = await response.json();
    console.log('從 API 取得題目數量:', data.length);

    // 篩選題型（如果有指定）
    let filteredQuestions = data;
    if (types) {
      const typeList = types.split(',');
      filteredQuestions = data.filter(q => typeList.includes(q.type));
      console.log('題型篩選後題目數量:', filteredQuestions.length);
    }

    const requestedCount = parseInt(count) || 10;
    
    // 簡化檢查（理論上已在建立頁面檢查過）
    if (filteredQuestions.length === 0) {
      alert('找不到符合條件的題目');
      loading.value = false;
      router.push('/quiz/create');
      return;
    }

    // 隨機打亂陣列並取指定數量
    filteredQuestions = filteredQuestions.sort(() => Math.random() - 0.5);
    filteredQuestions = filteredQuestions.slice(0, requestedCount);

    console.log('最終題目數量:', filteredQuestions.length);

    // 將題目轉換為測驗格式
    questions.value = filteredQuestions.map(q => ({
      id: q.id,
      content: q.content,
      type: q.type,
      answer: q.answer,
      difficulty: q.difficulty,
      image_url: q.image_url,
      // 根據題型生成固定數量的選項
      // 單選題：4 個選項 (A-D)
      // 多選題：5 個選項 (A-E)
      // 選填題：無選項
      options: q.type === 'single' 
        ? ['(A)', '(B)', '(C)', '(D)'] 
        : q.type === 'multiple'
        ? ['(A)', '(B)', '(C)', '(D)', '(E)']
        : null
    }));
    
    // 按照題型排序：單選題 -> 多選題 -> 選填題
    const typeOrder = { 'single': 1, 'multiple': 2, 'fill': 3 };
    questions.value.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);

    console.log('排序後題目順序:', questions.value.map(q => q.type));
    
    // 初始化答案陣列
    answers.value = questions.value.map(q => {
      if (q.type === 'multiple') return [];
      return null;
    });

    loading.value = false;

  } catch (error) {
    console.error('載入測驗資料失敗:', error);
    alert('載入測驗失敗: ' + error.message);
    loading.value = false;
    router.push('/quiz/create');
  }
}

// 中途離開測驗提醒(瀏覽器重新整理/關閉頁面前的提醒)
function handleBeforeUnload(event) {
  if (!isExamCompleted.value) {
    event.preventDefault();
    event.returnValue = '是否要離開測驗？若離開則本次測驗不會保留紀錄。';
    return '是否要離開測驗？若離開則本次測驗不會保留紀錄。';
  }
}

onMounted(() => {
  loadQuizData();
  startTimer();
  
  // 監聽瀏覽器重新整理/關閉事件
  window.addEventListener('beforeunload', handleBeforeUnload);
});

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
  }
  
  // 移除事件監聽器
  window.removeEventListener('beforeunload', handleBeforeUnload);
});

// 中途離開測驗提醒(處理點擊其他頁面)
import { onBeforeRouteLeave } from 'vue-router';

onBeforeRouteLeave((to, from, next) => {
  if (!isExamCompleted.value) {
    const confirmed = confirm('是否要離開測驗？\n若確定要離開，則本次測驗將不會保留紀錄。');
    if (confirmed) {
      next(); // 允許離開
    } else {
      next(false); // 取消離開
    }
  } else {
    next(); // 測驗已完成，直接離開
  }
});
</script>

<style scoped>
.container {
  max-width: 800px;
  margin: 0 auto;
  padding: 20px;
  font-family: 'Noto Sans TC', sans-serif;
  color: #594237;
}

.panel {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
  box-shadow: 0 8px 16px rgba(0,0,0,0.1);
}

.top-info {
  display: flex;
  justify-content: space-between;
  font-size: 18px;
  margin-bottom: 20px;
}

.question-nav {
  display: flex;
  flex-wrap: wrap;
  gap: 5px;
}

.question-btn {
  width: 40px;
  height: 40px;
  background-color: #e3ddd8;
  color: #594237;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s;
}

.question-btn:hover {
  background-color: #d0c9c4;
}

.question-btn.active {
  background-color: #d78585;
  color: white;
}

.question-btn.answered {
  background-color: #594237;
  color: white;
}

.question-btn.active.answered {
  background-color: #d78585;
}

.question-title {
  font-size: 18px;
  margin-bottom: 15px;
  line-height: 1.5;
}

.question-title strong {
  display: block;
  font-size: 18px;
  margin-bottom: 5px;
}

/* 題目附圖樣式 */
.question-image {
  margin: 20px 0;
  text-align: center;
  padding: 15px;
}

.question-image img {
  max-width: 100%;
  max-height: 500px;
  height: auto;
  cursor: pointer;
}

.options label {
  display: block;
  margin-bottom: 10px;
  padding-left: 5px;
  cursor: pointer;
}

.options input[type="radio"],
.options input[type="checkbox"] {
  margin-right: 8px;
  cursor: pointer;
}

.input-answer {
  width: 100%;
  padding: 10px;
  border-radius: 6px;
  border: 1px solid #ccc;
  font-size: 16px;
  box-sizing: border-box;
  margin: 5px 0;
  font-family: 'Noto Sans TC', sans-serif;
}

.button-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 20px;
}

.prev-btn, .next-btn, .submit-btn {
  background-color: #d78585;
  color: white;
  padding: 12px 24px;
  font-size: 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
}

.prev-btn:hover, .next-btn:hover, .submit-btn:hover {
  background-color: #b66363;
}

.right-buttons {
  text-align: right;
}
</style>
