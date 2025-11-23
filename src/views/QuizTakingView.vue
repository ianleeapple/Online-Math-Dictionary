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
          <MathContent :content="currentQuestion.content" />
        </div>

        <!-- 題目附圖區域 -->
        <div v-if="currentQuestion.image_url" class="question-image">
          <img :src="currentQuestion.image_url" :alt="'第 ' + (currentIndex + 1) + ' 題附圖'" />
        </div>

        <div class="options">
          <!-- 單選題 -->
          <div v-if="currentQuestion.type === 'single'">
            <label v-for="(opt, idx) in currentQuestion.options" :key="idx" class="option-label">
              <input 
                type="radio" 
                :name="'q' + currentIndex" 
                :value="idx" 
                v-model="answers[currentIndex]"
              > 
              <MathContent :content="opt" />
            </label>
          </div>

          <!-- 多選題 -->
          <div v-else-if="currentQuestion.type === 'multiple'">
            <label v-for="(opt, idx) in currentQuestion.options" :key="idx" class="option-label">
              <input 
                type="checkbox" 
                :value="idx" 
                v-model="answers[currentIndex]"
              > 
              <MathContent :content="opt" />
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
import { useRouter, useRoute, onBeforeRouteLeave } from 'vue-router';
import MathContent from '../components/MathContent.vue';

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

// 題目列表（新增選項順序記錄）
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

// ========== 隨機打亂陣列的函數 ==========
function shuffleArray(array) {
  const shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

// ========== 打亂選項並記錄順序 ==========
function shuffleOptions(question) {
  if (question.type !== 'single' && question.type !== 'multiple') {
    return { ...question, optionOrder: null };
  }

  // 取得原始選項（移除字母前綴）
  const originalOptions = question.options.map(opt => {
    const match = opt.match(/^\([A-E]\)\s*(.*)$/);
    return match ? match[1] : opt;
  });

  // 建立索引陣列並打亂
  const indices = originalOptions.map((_, idx) => idx);
  const shuffledIndices = shuffleArray(indices);

  // 根據打亂後的索引重組選項
  const shuffledOptions = shuffledIndices.map((originalIdx, newIdx) => {
    const letter = String.fromCharCode(65 + newIdx); // 使用新位置的字母
    return `(${letter}) ${originalOptions[originalIdx]}`;
  });

  return {
    ...question,
    options: shuffledOptions,
    optionOrder: shuffledIndices // 記錄打亂後的原始索引順序
  };
}

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
    
    if (!currentUser.id) {
      alert('請先登入');
      return;
    }
 
    // 中途離開測驗提醒(標記測驗已完成不再需要離開提醒)
    isExamCompleted.value = true;

    // 準備測驗記錄資料
    const now = new Date();
    const submitTime = now.toISOString().slice(0, 19).replace('T', ' '); // YYYY-MM-DD HH:MM:SS
    
    // 準備題目明細資料
    const questionsData = questions.value.map((q, index) => ({
      questionId: q.id,
      questionOrder: index + 1,
      userAnswer: formatAnswer(answers.value[index], q.type),
      optionOrder: q.optionOrder || null // ========== 新增：儲存選項順序 ==========
    }));

    // 計算實際的時間限制(分鐘)
    let timeLimitMinutes = null;
    if (isCountdown.value && timeLimit.value > 0) {
      timeLimitMinutes = Math.round(timeLimit.value / 60); // 秒轉分鐘
    }

    // 提交測驗記錄到後端
    const response = await fetch('/api/quiz-records', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        userId: currentUser.id,
        submitTime: submitTime,
        topic: quizInfo.value.topic,
        concept: quizInfo.value.concept,
        timingMode: quizInfo.value.timingMode,
        answerTime: timer.value, // 作答時間（秒）
        timeLimit: timeLimitMinutes, // 倒數計時的時間限制（分鐘）
        difficulty: quizInfo.value.difficulty,
        questionCount: quizInfo.value.questionCount,
        questionTypes: questions.value.map(q => q.type).filter((v, i, a) => a.indexOf(v) === i).join(','),
        questions: questionsData
      })
    });

    if (!response.ok) {
      throw new Error('儲存測驗記錄失敗');
    }

    const result = await response.json();
    const quizRecordId = result.quizRecordId;
    console.log('測驗記錄已儲存，ID:', quizRecordId);

    // 自動批改考卷並計算成績
    try {
      console.log('開始批改考卷...');
      const gradeResponse = await fetch(`/api/quiz-records/${quizRecordId}/grade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (gradeResponse.ok) {
        const gradeResult = await gradeResponse.json();
        console.log('批改完成:', gradeResult);
        
        // 根據交卷類型顯示不同訊息
        if (autoSubmit === true) {
          alert(
            `測驗已自動提交\n\n` +
            `成績：${gradeResult.score} 分\n` +
            `完全答對：${gradeResult.correctCount} / ${gradeResult.totalQuestions} 題\n`
          );
        } else {
          alert(
            `交卷成功！\n\n` +
            `成績：${gradeResult.score} 分\n` +
            `完全答對：${gradeResult.correctCount} / ${gradeResult.totalQuestions} 題\n`
          );
        }
      } else {
        throw new Error('批改失敗');
      }
    } catch (gradeError) {
      console.error('批改失敗:', gradeError);
      // 即使批改失敗，仍然導向測驗記錄頁面
      alert('交卷成功，但批改時發生錯誤，請稍後手動批改');
    }
    
    router.push('/quiz/records');

  } catch (error) {
    console.error('提交測驗失敗:', error);
    alert('提交失敗，請稍後再試: ' + error.message);
  }
}

// 格式化答案（根據題型）
function formatAnswer(answer, type) {
  if (type === 'multiple') {
    // 多選題：陣列轉字串 [0, 2] -> "A,C"
    if (Array.isArray(answer)) {
      return answer.map(idx => String.fromCharCode(65 + idx)).join(',');
    }
    return '';
  } else if (type === 'single') {
    // 單選題：索引轉字母 0 -> "A"
    if (answer !== null && answer !== undefined) {
      return String.fromCharCode(65 + answer);
    }
    return '';
  } else if (type === 'fill') {
    // 選填題：直接返回文字
    return answer || '';
  }
  return '';
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
    'fill': '填充題'
  };
  return labels[type] || '未知題型';
}

// 載入測驗資料
async function loadQuizData() {
  loading.value = true;
  
  try {
    // 從 route.query 取得篩選條件
    const { 
      retake, 
      questionIds, 
      level, 
      topic, 
      concept, 
      difficulty, 
      count, 
      timing, 
      timeLimit: timeLimitParam, 
      types 
    } = route.query;
    
    console.log('篩選條件:', { retake, questionIds, level, topic, concept, difficulty, count, types, timing, timeLimit: timeLimitParam });
    
    // 設定計時模式
    isCountdown.value = timing === 'countdown';
    if (isCountdown.value && timeLimitParam) {
      // ========== 關鍵修正：timeLimit 是以分鐘儲存，需要轉換成秒 ==========
      timeLimit.value = parseInt(timeLimitParam) * 60; // 分鐘轉換成秒
      console.log('倒數計時模式,時間限制:', timeLimit.value, '秒 (', timeLimitParam, '分鐘)');
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

    // ========== 再做一次功能:載入指定題目（不打亂選項） ==========
    if (retake === 'true' && questionIds) {
      console.log('📝 再做一次功能:載入指定題目（保持原始選項順序）');

      const idArray = questionIds.split(',').map(id => parseInt(id));
      console.log('題目 ID 列表:', idArray);
      
      // 逐一取得每個題目並從測驗記錄中還原選項順序
      const fetchedQuestions = [];
      
      // 先取得測驗記錄以獲取選項順序
      const recordResponse = await fetch(`/api/quiz-records/${route.query.recordId || ''}`);
      let recordData = null;
      if (recordResponse.ok) {
        recordData = await recordResponse.json();
      }
      
      for (const id of idArray) {
        try {
          const response = await fetch(`/api/question/${id}`);
          
          if (!response.ok) {
            console.warn(`題目 #${id} 載入失敗`);
            continue;
          }
          
          const question = await response.json();
          
          // 從測驗記錄中找到對應題目的選項順序
          const recordDetail = recordData?.questions.find(q => q.question_id === id);
          
          let formattedOptions = null;
          let optionOrder = null;
          
          if (question.type === 'single' || question.type === 'multiple') {
            if (question.options && Array.isArray(question.options) && question.options.length > 0) {
              // 如果有儲存的選項順序，使用該順序
              if (recordDetail?.option_order) {
                try {
                  optionOrder = JSON.parse(recordDetail.option_order);
                  formattedOptions = optionOrder.map((originalIdx, newIdx) => {
                    const letter = String.fromCharCode(65 + newIdx);
                    return `(${letter}) ${question.options[originalIdx]}`;
                  });
                } catch (e) {
                  console.error('解析選項順序失敗:', e);
                  // 解析失敗，使用原始順序
                  formattedOptions = question.options.map((opt, idx) => {
                    const letter = String.fromCharCode(65 + idx);
                    return `(${letter}) ${opt}`;
                  });
                  optionOrder = question.options.map((_, idx) => idx);
                }
              } else {
                // 沒有選項順序記錄，使用原始順序
                formattedOptions = question.options.map((opt, idx) => {
                  const letter = String.fromCharCode(65 + idx);
                  return `(${letter}) ${opt}`;
                });
                optionOrder = question.options.map((_, idx) => idx);
              }
            }
          }
          
          fetchedQuestions.push({
            id: question.id,
            content: question.content,
            type: question.type,
            answer: question.answer,
            difficulty: question.difficulty,
            image_url: question.image_url,
            options: formattedOptions,
            optionOrder: optionOrder // 保存選項順序
          });
          
        } catch (error) {
          console.error(`載入題目 #${id} 失敗:`, error);
        }
      }
      
      console.log('重考模式:題目已載入,保持原始選項順序');
      questions.value = fetchedQuestions;
      
    } 
    // ========== 一般模式:從 API 隨機抓取題目（打亂選項）並確保每種題型至少一題 ==========
    else {
      console.log('📝 一般模式:隨機抓取題目（打亂選項順序）');
      
      // 建立 API 查詢參數
      const params = new URLSearchParams();
      if (level) params.append('level', level);
      if (topic) params.append('topic', topic);
      
      if (concept && concept !== '所有觀念') {
        params.append('concept', concept);
      }
      
      if (difficulty && difficulty !== '系統自動') {
        params.append('difficulty', difficulty);
      }

      console.log('API 查詢參數:', params.toString());

      // 從 API 抓取題目
      const response = await fetch(`/api/question?${params.toString()}`);
      
      if (!response.ok) {
        throw new Error('抓取題目失敗');
      }

      const data = await response.json();
      console.log('從 API 取得題目數量:', data.length);

      const requestedCount = parseInt(count) || 10;
      
      // ========== 新增：確保每個題型至少一題的分配邏輯 ==========
      let selectedQuestions = [];
      
      if (types) {
        const typeList = types.split(',');
        console.log('要求的題型:', typeList);
        
        // 按題型分類所有題目
        const questionsByType = {};
        typeList.forEach(type => {
          questionsByType[type] = data.filter(q => q.type === type);
          // 隨機打亂每個題型的題目
          questionsByType[type] = questionsByType[type].sort(() => Math.random() - 0.5);
        });
        
        // 第一階段：確保每個題型至少選一題
        typeList.forEach(type => {
          if (questionsByType[type].length > 0) {
            selectedQuestions.push(questionsByType[type].shift());
            console.log(`題型 ${type} 保證選入 1 題`);
          }
        });
        
        // 第二階段：用剩餘配額隨機填充
        const remaining = requestedCount - selectedQuestions.length;
        console.log(`已選 ${selectedQuestions.length} 題，還需要 ${remaining} 題`);
        
        if (remaining > 0) {
          // 將所有剩餘題目合併並隨機排序
          const remainingQuestions = [];
          typeList.forEach(type => {
            remainingQuestions.push(...questionsByType[type]);
          });
          remainingQuestions.sort(() => Math.random() - 0.5);
          
          // 填充到指定數量
          selectedQuestions.push(...remainingQuestions.slice(0, remaining));
        }
        
        console.log('最終選擇題目數量:', selectedQuestions.length);
        console.log('題型分布:', selectedQuestions.map(q => q.type));
        
      } else {
        // 沒有指定題型，隨機選取
        selectedQuestions = data.sort(() => Math.random() - 0.5).slice(0, requestedCount);
      }

      if (selectedQuestions.length === 0) {
        alert('找不到符合條件的題目');
        loading.value = false;
        router.push('/quiz/create');
        return;
      }

      // 格式化選項並隨機打亂
      questions.value = selectedQuestions.map(q => {
        let formattedOptions = null;
        let optionOrder = null;
        
        if (q.type === 'single' || q.type === 'multiple') {
          if (q.options && Array.isArray(q.options) && q.options.length > 0) {
            formattedOptions = q.options.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              return `(${letter}) ${opt}`;
            });
            optionOrder = q.options.map((_, idx) => idx);
          } else {
            formattedOptions = q.type === 'single' 
              ? ['(A)', '(B)', '(C)', '(D)'] 
              : ['(A)', '(B)', '(C)', '(D)', '(E)'];
            optionOrder = formattedOptions.map((_, idx) => idx);
          }
        }
        
        const question = {
          id: q.id,
          content: q.content,
          type: q.type,
          answer: q.answer,
          difficulty: q.difficulty,
          image_url: q.image_url,
          options: formattedOptions,
          optionOrder: optionOrder
        };
        
        // ========== 隨機打亂選項 ==========
        return shuffleOptions(question);
      });
      
      // 按照題型排序
      const typeOrder = { 'single': 1, 'multiple': 2, 'fill': 3 };
      questions.value.sort((a, b) => typeOrder[a.type] - typeOrder[b.type]);

      console.log('排序後題目順序:', questions.value.map(q => q.type));
      console.log('一般模式:選項已隨機打亂');
    }
    
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


.options {
  margin: 20px 0;
}

.option-label {
  display: flex;
  align-items: flex-start;
  margin-bottom: 12px;
  padding: 10px;
  border-radius: 6px;
  cursor: pointer;
  transition: background-color 0.2s;
  line-height: 1.6;
}

.option-label:hover {
  background-color: #f8f9fa;
}

.options input[type="radio"],
.options input[type="checkbox"] {
  margin-right: 10px;
  margin-top: 4px;
  flex-shrink: 0;
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
