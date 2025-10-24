<template>
  <div class="container">
    <!-- 側邊資訊區 -->
    <div class="panel">
      <div class="top-info">
        <div><strong>主題：</strong>{{ quizInfo.topic }}</div>
        <div><strong>測驗時間：</strong>{{ formattedTime }}</div>
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
      <div class="question-title">
        <strong>第 {{ currentIndex + 1 }} 題</strong>
        {{ currentQuestion.content }}
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
          <button 
            v-if="currentIndex > 0" 
            class="prev-btn" 
            @click="prevQuestion"
          >
            上一題
          </button>
        </div>
        
        <!-- 右側按鈕 -->
        <div class="right-buttons">
          <button 
            v-if="currentIndex < questions.length - 1" 
            class="next-btn" 
            @click="nextQuestion"
          >
            下一題
          </button>
          <button 
            v-else 
            class="submit-btn" 
            @click="submitExam"
          >
            交卷
          </button>
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
  questionCount: 10,
  timingMode: 'unlimited'
});

// 題目列表
const questions = ref([]);

// 當前題號（0-based）
const currentIndex = ref(0);

// 使用者答案
const answers = ref([]);

// 計時器（秒）
const timer = ref(0);
let timerInterval = null;

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
  const m = String(Math.floor(timer.value / 60)).padStart(2, '0');
  const s = String(timer.value % 60).padStart(2, '0');
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

// 交卷
async function submitExam() {
  if (!confirm('確定要交卷嗎？')) {
    return;
  }

  try {
    const currentUser = JSON.parse(localStorage.getItem('currentUser') || '{}');
    
    const response = await fetch('/api/quiz/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: currentUser.id,
        quizId: route.query.id,
        answers: answers.value,
        timeSpent: timer.value
      })
    });

    if (response.ok) {
      alert('測驗已提交！');
      router.push('/quiz/records');
    } else {
      throw new Error('提交失敗');
    }
  } catch (error) {
    console.error('提交測驗失敗:', error);
    alert('提交失敗，請稍後再試');
  }
}

// 啟動計時器
function startTimer() {
  timerInterval = setInterval(() => {
    timer.value++;
  }, 1000);
}

// 載入測驗資料
async function loadQuizData() {
  try {
    const quizId = route.query.id;
    
    if (!quizId) {
      alert('缺少測驗 ID');
      router.push('/quiz/create');
      return;
    }

    const response = await fetch(`/api/quiz/${quizId}`);
    const data = await response.json();

    quizInfo.value = {
      topic: data.concept || '數學',
      level: data.level,
      concept: data.concept,
      difficulty: data.difficulty,
      questionCount: data.question_count,
      timingMode: data.timing_mode
    };

    questions.value = data.questions || [];
    
    // 初始化答案陣列
    answers.value = questions.value.map(q => {
      if (q.type === 'multiple') return [];
      return null;
    });

  } catch (error) {
    console.error('載入測驗資料失敗:', error);
    alert('載入測驗失敗');
    router.push('/quiz/create');
  }
}

onMounted(() => {
  loadQuizData();
  startTimer();
});

onUnmounted(() => {
  if (timerInterval) {
    clearInterval(timerInterval);
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
  background-color: #a8d5a8;
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
