<template>
  <div class="container">
    <!-- 標題區塊 -->
    <div class="panel header-panel">
      <h2>查看詳解</h2>
      <div v-if="!loading && questions.length > 0" class="solution-info">
        <span>共 {{ questions.length }} 題</span>
      </div>
    </div>

    <!-- 載入中提示 -->
    <div v-if="loading" class="panel">
      <div style="text-align: center; padding: 40px;">
        <p>載入中...</p>
      </div>
    </div>

    <!-- 沒有題目 -->
    <div v-else-if="questions.length === 0" class="panel">
      <div style="text-align: center; padding: 40px;">
        <p>找不到測驗題目</p>
      </div>
    </div>

    <!-- 題目列表 -->
    <div v-else>
      <div v-for="(question, index) in questions" :key="question.question_id" class="panel question-panel">
        <div class="question-header">
          <strong>第 {{ question.question_order }} 題 ({{ getQuestionTypeLabel(question.type) }})</strong>
        </div>

        <div class="question-content">
          <MathContent :content="question.content" />
        </div>

        <!-- 題目附圖 -->
        <div v-if="question.image_url" class="question-image">
          <img :src="question.image_url" :alt="'第 ' + question.question_order + ' 題附圖'" />
        </div>

        <!-- 顯示正確答案 -->
        <div class="answer-section">
          <div class="answer-label">正確答案：</div>
          <div class="answer-value">
            <MathContent :content="formatCorrectAnswer(question.correct_answer, question.type)" />
          </div>
        </div>

        <!-- 顯示使用者答案 -->
        <div class="answer-section">
          <div class="answer-label">您的答案：</div>
          <div class="answer-value" :class="getAnswerClass(question)">
            <MathContent :content="formatUserAnswer(question.user_answer, question.type)" />
          </div>
        </div>

        <!-- 功能按鈕 -->
        <div class="button-row">
          <button class="btn-solution" @click="viewTextSolution(question)">
            查看文字詳解
          </button>
          <button class="btn-solution" @click="viewVideoSolution(question)">
            查看影音詳解
          </button>
          <button class="btn-solution" @click="viewKnowledge(question)">
            查看解題知識點
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter, useRoute } from 'vue-router';
import MathContent from '../components/MathContent.vue';

const router = useRouter();
const route = useRoute();

const loading = ref(true);
const questions = ref([]);
const quizRecordId = ref(null);

onMounted(async () => {
  quizRecordId.value = route.params.id;
  await loadQuizDetail();
});

// 載入測驗詳情
async function loadQuizDetail() {
  loading.value = true;
  
  try {
    const response = await fetch(`/api/quiz-records/${quizRecordId.value}`);
    
    if (!response.ok) {
      throw new Error('載入測驗詳情失敗');
    }

    const data = await response.json();
    questions.value = data.questions;

  } catch (error) {
    console.error('載入測驗詳情失敗:', error);
    alert('載入測驗詳情失敗: ' + error.message);
  } finally {
    loading.value = false;
  }
}

// 查看文字詳解
function viewTextSolution(question) {
  console.log('查看文字詳解:', question);
  alert('還沒做!');
}

// 查看影音詳解
function viewVideoSolution(question) {
  console.log('查看影音詳解:', question);
  alert('還沒做!');
}

// 查看解題知識點
function viewKnowledge(question) {
  console.log('查看解題知識點:', question);
  alert('還沒做!');
}

// 格式化正確答案
function formatCorrectAnswer(answer, type) {
  if (!answer) return '無答案';
  
  if (type === 'multiple') {
    // 多選題：顯示所有選項
    return answer.split(',').map(a => `(${a.trim()})`).join(' ');
  } else if (type === 'single') {
    // 單選題：顯示選項
    return `(${answer.trim()})`;
  } else if (type === 'fill') {
    // 選填題：直接顯示答案
    return answer;
  }
  return answer;
}

// 格式化使用者答案
function formatUserAnswer(answer, type) {
  if (!answer || answer.trim() === '') return '未作答';
  
  if (type === 'multiple') {
    return answer.split(',').map(a => `(${a.trim()})`).join(' ');
  } else if (type === 'single') {
    return `(${answer.trim()})`;
  } else if (type === 'fill') {
    return answer;
  }
  return answer;
}

// 判斷答案是否正確並返回對應的 class
function getAnswerClass(question) {
  const { user_answer, correct_answer, type } = question;
  
  if (!user_answer || user_answer.trim() === '') {
    return 'answer-unanswered';
  }
  
  let isCorrect = false;
  
  if (type === 'single') {
    isCorrect = user_answer.trim() === correct_answer.trim();
  } else if (type === 'multiple') {
    const userAnswers = user_answer.split(',').map(a => a.trim()).sort();
    const correctAnswers = correct_answer.split(',').map(a => a.trim()).sort();
    isCorrect = JSON.stringify(userAnswers) === JSON.stringify(correctAnswers);
  } else if (type === 'fill') {
    isCorrect = user_answer.trim() === correct_answer.trim();
  }
  
  return isCorrect ? 'answer-correct' : 'answer-wrong';
}

// 取得題型標籤
function getQuestionTypeLabel(type) {
  const labels = {
    'single': '單選題',
    'multiple': '多選題',
    'fill': '選填題'
  };
  return labels[type] || '未知題型';
}
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

.header-panel {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
}

.header-panel h2 {
  margin: 0;
  font-size: 24px;
  color: #594237;
}

.solution-info {
  font-size: 18px;
  color: #594237;
  font-weight: bold;
}

.question-panel {
  padding: 25px;
}

.question-header {
  font-size: 18px;
  font-weight: bold;
  margin-bottom: 15px;
  color: #594237;
  padding-bottom: 10px;
  border-bottom: 2px solid #f0f0f0;
}

.question-content {
  font-size: 18px;
  margin-bottom: 15px;
  line-height: 1.5;
  color: #594237;
}

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

.answer-section {
  display: flex;
  align-items: center;
  margin: 15px 0;
  padding: 10px 15px;
  background-color: #f9f9f9;
  border-radius: 6px;
}

.answer-label {
  font-weight: bold;
  min-width: 100px;
  color: #594237;
}

.answer-value {
  flex: 1;
  font-size: 16px;
  padding: 5px 10px;
  border-radius: 4px;
}

.answer-correct {
  color: #27ae60;
  font-weight: bold;
}

.answer-wrong {
  color: #e74c3c;
  font-weight: bold;
}

.answer-unanswered {
  color: #999;
}

.button-row {
  display: flex;
  justify-content: center;
  gap: 10px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #f0f0f0;
  flex-wrap: wrap;
}

.btn-solution {
  background-color: #d78585;
  color: white;
  padding: 12px 20px;
  font-size: 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: normal;
}

.btn-solution:hover {
  background-color: #b66363;
}

</style>