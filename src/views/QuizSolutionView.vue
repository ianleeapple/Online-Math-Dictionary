<template>
  <div class="solution-page">
    <h2>測驗詳解</h2>

    <!-- 載入中 -->
    <div v-if="loading" style="text-align: center; padding: 40px;">
      <p>載入中...</p>
    </div>

    <!-- 測驗資訊 -->
    <div v-else-if="quizRecord" class="quiz-info-card">
      <h3>測驗資訊</h3>
      <table class="info-table">
        <tr>
          <td class="label">交卷時間</td>
          <td>{{ formatDateTime(quizRecord.submit_time) }}</td>
        </tr>
        <tr>
          <td class="label">主題</td>
          <td>{{ quizRecord.topic }}</td>
        </tr>
        <tr>
          <td class="label">觀念</td>
          <td>{{ quizRecord.concept }}</td>
        </tr>
        <tr>
          <td class="label">計時方式</td>
          <td>{{ getTimingModeLabel(quizRecord.timing_mode) }}</td>
        </tr>
        <tr>
          <td class="label">作答時間</td>
          <td>{{ formatDuration(quizRecord.answer_time) }}</td>
        </tr>
        <tr>
          <td class="label">難易度</td>
          <td>{{ quizRecord.difficulty }}</td>
        </tr>
        <tr>
          <td class="label">題數</td>
          <td>{{ quizRecord.question_count }} 題</td>
        </tr>
        <tr>
          <td class="label">測驗成績</td>
          <td>
            <span v-if="quizRecord.score !== null" :class="getScoreClass(quizRecord.score)">
              {{ quizRecord.score }} 分
            </span>
            <span v-else style="color: #999;">尚未批改</span>
          </td>
        </tr>
      </table>

      <!-- 題目列表 -->
      <div class="questions-list">
        <h3>題目詳解</h3>

        <div v-for="(question, index) in quizRecord.questions" :key="index" class="question-card">
          <div class="question-header">
            <div class="question-number">
              第 {{ index + 1 }} 題 ({{ getQuestionTypeLabel(question.type) }})
            </div>
            <div class="answer-status" :class="{ correct: isCorrect(question), wrong: !isCorrect(question) }">
              {{ isCorrect(question) ? '✓ 答對' : '✗ 答錯' }}
            </div>
          </div>

          <div class="question-content">
            <div class="label">題目內容：</div>
            <MathContent :content="question.content" />
          </div>

          <!-- 顯示題目附圖 -->
          <div v-if="question.image_url" class="question-image">
            <img :src="question.image_url" :alt="'第 ' + (index + 1) + ' 題附圖'" />
          </div>

          <!-- 顯示選項 -->
          <div v-if="question.formattedOptions && question.formattedOptions.length > 0" class="question-options">
            <div class="label">選項：</div>
            <div class="options-list">
              <div v-for="(option, optIndex) in question.formattedOptions" :key="optIndex" class="option-item">
                <MathContent :content="option" />
              </div>
            </div>
          </div>

          <div class="answer-section">
            <div class="answer-row">
              <span class="label">你的答案：</span>
              <span :class="{ 'correct-text': isCorrect(question), 'wrong-text': !isCorrect(question) }">
                <MathContent :content="getUserAnswerDisplay(question)" />
              </span>
            </div>

            <div class="answer-row">
              <span class="label">正確答案：</span>
              <span class="correct-text">
                <MathContent :content="getCorrectAnswerDisplay(question)" />
              </span>
            </div>
          </div>

          <!-- ========== 詳解相關結合AI功能按鈕 ========== -->
          <div class="question-actions">
            <button class="action-btn text-solution-btn" @click="viewTextSolution(question, index + 1)">
              查看文字詳解
            </button>
            <button class="action-btn video-solution-btn" @click="viewVideoSolution(question, index + 1)">
              查看影音詳解
            </button>
            <button class="action-btn knowledge-btn" @click="viewKnowledge(question, index + 1)">
              查看所需知識點
            </button>
          </div>
        </div>
      </div>

      <div class="back-button-container">
        <button class="back-button" @click="router.push('/quiz/records')">返回測驗記錄</button>
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

const quizRecordId = ref(route.params.id);
const quizRecord = ref(null);
const loading = ref(true);

// 載入測驗詳情
async function loadQuizDetail() {
  loading.value = true;

  try {
    const response = await fetch(`/api/quiz-records/${quizRecordId.value}`);

    if (!response.ok) {
      throw new Error('載入測驗詳情失敗');
    }

    const data = await response.json();
    quizRecord.value = data;

    // ========== 為每個題目載入選項資料（使用儲存的選項順序） ==========
    for (const question of data.questions) {
      if (question.type === 'single' || question.type === 'multiple') {
        const optionResponse = await fetch(`/api/question/${question.question_id}`);
        
        if (optionResponse.ok) {
          const questionDetail = await optionResponse.json();
          const originalOptions = questionDetail.options || [];
          
          // ========== 使用測驗記錄中儲存的選項順序 ==========
          if (question.option_order) {
            try {
              const optionOrderArray = JSON.parse(question.option_order);
              
              // 按照測驗時的順序重組選項
              question.options = optionOrderArray.map(idx => originalOptions[idx]);
              
              // 將選項轉換為 "(A) 內容" 格式
              question.formattedOptions = question.options.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                return `(${letter}) ${opt}`;
              });
              
              console.log(`[詳解] 題目 #${question.question_id} 使用儲存的選項順序:`, optionOrderArray);
            } catch (e) {
              console.error('解析選項順序失敗:', e);
              // 解析失敗，使用原始順序
              question.options = originalOptions;
              question.formattedOptions = originalOptions.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                return `(${letter}) ${opt}`;
              });
            }
          } else {
            // 舊資料沒有選項順序記錄，使用原始順序
            console.log(`[詳解] 題目 #${question.question_id} 沒有選項順序記錄，使用原始順序`);
            question.options = originalOptions;
            question.formattedOptions = originalOptions.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              return `(${letter}) ${opt}`;
            });
          }
        } else {
          console.warn(`[詳解] 載入題目 #${question.question_id} 失敗`);
          question.options = [];
          question.formattedOptions = [];
        }
      } else {
        question.options = null;
        question.formattedOptions = null;
      }
    }

    console.log('測驗詳情:', quizRecord.value);

  } catch (error) {
    console.error('載入測驗詳情失敗:', error);
    alert('載入測驗詳情失敗: ' + error.message);
    router.push('/quiz/records');
  } finally {
    loading.value = false;
  }
}

// 格式化日期時間
function formatDateTime(datetime) {
  const date = new Date(datetime);
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

// 格式化作答時間
function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes} 分 ${secs} 秒`;
}

// 取得計時方式標籤
function getTimingModeLabel(timingMode) {
  return timingMode === 'forward' ? '正向計時' : '倒數計時';
}

// 取得題型標籤
function getQuestionTypeLabel(type) {
  const labels = {
    'single': '單選題',
    'multiple': '多選題',
    'fill': '選填題'
  };
  return labels[type] || type;
}

// 取得成績的 CSS class
function getScoreClass(score) {
  if (score >= 60) return 'score-pass';
  if (score > 0) return 'score-warning';
  return 'score-fail';
}

// 取得使用者答案的顯示文字
function getUserAnswerDisplay(question) {
  const { user_answer, type, options } = question;

  if (!user_answer || user_answer.trim() === '') {
    return '未作答';
  }

  if (type === 'single') {
    // 單選題：使用打亂後的選項列表
    const answerLetter = user_answer.trim();
    const answerIndex = answerLetter.charCodeAt(0) - 65;
    
    if (answerIndex >= 0 && answerIndex < options.length) {
      return `(${answerLetter}) ${options[answerIndex]}`;
    }
    return user_answer;
    
  } else if (type === 'multiple') {
    // ========== 多選題按照字母順序排列顯示 ==========
    const userAnswerLetters = user_answer.split(',').map(a => a.trim()).sort(); // 加上 .sort() 排序
    const userAnswerDisplays = userAnswerLetters.map(letter => {
      const index = letter.charCodeAt(0) - 65;
      if (index >= 0 && index < options.length) {
        return `(${letter}) ${options[index]}`;
      }
      return letter;
    });
    return userAnswerDisplays.join('、');
    
  } else if (type === 'fill') {
    // 選填題：直接顯示答案
    return user_answer;
  }

  return user_answer;
}

// 取得正確答案的顯示文字
function getCorrectAnswerDisplay(question) {
  const { correct_answer, type, options } = question;

  if (!correct_answer || correct_answer.trim() === '') {
    return '無';
  }

  if (type === 'single') {
    // 單選題：在打亂後的選項中找正確答案
    const answerContent = correct_answer.trim();
    
    // 找出對應的選項索引（在打亂後的選項中）
    const answerIndex = options.findIndex(opt => opt.trim() === answerContent);
    if (answerIndex !== -1) {
      const answerLetter = String.fromCharCode(65 + answerIndex);
      return `(${answerLetter}) ${answerContent}`;
    }
    return answerContent;
    
  } else if (type === 'multiple') {
    // ========== 多選題按照字母順序排列顯示 ==========
    const correctAnswerContents = correct_answer.split(',').map(a => a.trim());
    
    // 找出所有正確答案的字母，並按字母順序排序
    const correctAnswerLetters = correctAnswerContents.map(content => {
      const answerIndex = options.findIndex(opt => opt.trim() === content);
      if (answerIndex !== -1) {
        return String.fromCharCode(65 + answerIndex);
      }
      return null;
    }).filter(letter => letter !== null).sort(); // 加上 .sort() 排序
    
    // 根據排序後的字母生成顯示文字
    const correctAnswerDisplays = correctAnswerLetters.map(letter => {
      const index = letter.charCodeAt(0) - 65;
      return `(${letter}) ${options[index]}`;
    });
    
    return correctAnswerDisplays.join('、');
    
  } else if (type === 'fill') {
    // 選填題：直接顯示答案
    return correct_answer;
  }

  return correct_answer;
}

// 判斷是否答對
function isCorrect(question) {
  const { user_answer, correct_answer, type, options } = question;

  if (!user_answer || user_answer.trim() === '') {
    return false;
  }

  if (type === 'single') {
    // ========== 單選題：使用打亂後的選項列表判斷 ==========
    const answerLetter = user_answer.trim();
    const answerIndex = answerLetter.charCodeAt(0) - 65;
    
    if (answerIndex >= 0 && answerIndex < options.length) {
      const userAnswerContent = options[answerIndex].trim();
      const correctAnswerContent = correct_answer.trim();
      return userAnswerContent === correctAnswerContent;
    }
    return false;
    
  } else if (type === 'multiple') {
    // ========== 多選題：使用打亂後的選項列表判斷 ==========
    const userAnswerLetters = user_answer.split(',').map(a => a.trim());
    const userAnswerContents = userAnswerLetters
      .map(letter => {
        const index = letter.charCodeAt(0) - 65;
        return (index >= 0 && index < options.length) ? options[index].trim() : null;
      })
      .filter(content => content !== null)
      .sort();
    
    const correctAnswerContents = correct_answer.split(',').map(a => a.trim()).sort();
    return JSON.stringify(userAnswerContents) === JSON.stringify(correctAnswerContents);
    
  } else if (type === 'fill') {
    // 選填題：直接比對答案內容
    return user_answer.trim() === correct_answer.trim();
  }

  return false;
}

// ========== 新增：題目功能按鈕處理函數 ==========

// 查看文字詳解
function viewTextSolution(question, questionNumber) {
  alert('還沒做');
}

// 查看影音詳解
function viewVideoSolution(question, questionNumber) {
  alert('還沒做');
}

// 查看所需知識點
function viewKnowledge(question, questionNumber) {
  alert('還沒做');
}

onMounted(() => {
  loadQuizDetail();
});
</script>

<style scoped>
.solution-page {
  font-family: 'Noto Sans TC', sans-serif;
  background-color: #f9f9f9;
  padding: 20px;
  max-width: 1000px;
  margin: 0 auto;
}

h2 {
  margin-bottom: 20px;
  color: #594237;
}

.quiz-info-card {
  background: white;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h3 {
  color: #594237;
  margin-bottom: 15px;
  border-bottom: 2px solid #d67b7b;
  padding-bottom: 10px;
}

.info-table {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 30px;
}

.info-table td {
  padding: 12px;
  border: 1px solid #e0e6ea;
}

.info-table .label {
  background-color: #f8f9fa;
  font-weight: bold;
  width: 25%;
  color: #594237;
}

.score-pass {
  color: #27ae60;
  font-weight: bold;
}

.score-warning {
  color: #f39c12;
  font-weight: bold;
}

.score-fail {
  color: #e74c3c;
  font-weight: bold;
}

.questions-list {
  margin-top: 30px;
}

.question-card {
  background: #f8f9fa;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 20px;
}

.question-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}

.question-number {
  font-weight: bold;
  font-size: 18px;
  color: #594237;
}

.answer-status {
  padding: 6px 12px;
  border-radius: 6px;
  font-weight: bold;
  font-size: 14px;
}

.answer-status.correct {
  background-color: #d4edda;
  color: #155724;
}

.answer-status.wrong {
  background-color: #f8d7da;
  color: #721c24;
}

.question-content {
  margin: 15px 0;
  line-height: 1.8;
}

.question-content .label {
  font-weight: bold;
  color: #594237;
  margin-bottom: 8px;
  display: block;
}

.question-image {
  margin: 20px 0;
  text-align: center;
}

.question-image img {
  max-width: 100%;
  max-height: 400px;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

/* 選項顯示樣式 */
.question-options {
  margin: 15px 0;
  padding: 15px;
  background-color: white;
  border-radius: 8px;
  border: 1px solid #e0e6ea;
}

.question-options .label {
  font-weight: bold;
  color: #594237;
  margin-bottom: 10px;
  display: block;
}

.options-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.option-item {
  padding: 10px;
  background-color: #f8f9fa;
  border-radius: 6px;
  border: 1px solid #dee2e6;
  line-height: 1.6;
}

.answer-section {
  margin-top: 20px;
  padding: 15px;
  background-color: white;
  border-radius: 8px;
}

.answer-row {
  margin-bottom: 10px;
  line-height: 1.8;
}

.answer-row:last-child {
  margin-bottom: 0;
}

.answer-row .label {
  font-weight: bold;
  color: #594237;
  margin-right: 10px;
}

.correct-text {
  color: #27ae60;
  font-weight: bold;
}

.wrong-text {
  color: #e74c3c;
  font-weight: bold;
}

.back-button-container {
  text-align: center;
  margin-top: 30px;
}

.back-button {
  background-color: #d67b7b;
  color: white;
  padding: 12px 30px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  transition: background-color 0.3s;
}

.back-button:hover {
  background-color: #c06565;
}

/* 題目功能按鈕區域 */
.question-actions {
  margin-top: 20px;
  padding-top: 15px;
  border-top: 1px solid #e0e6ea;
  display: flex;
  gap: 10px;
  justify-content: center;
  flex-wrap: wrap;
}

.action-btn {
  background-color: #d67b7b;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  font-weight: 500;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 5px;
}

.action-btn:hover {
  background-color: #c06565;
  transform: translateY(-2px);
  box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15);
}
</style>