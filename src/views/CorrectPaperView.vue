<template>
  <div class="container">
    <!-- 標題區塊 -->
    <div class="panel header-panel">
      <h2>訂正考卷</h2>
      <div v-if="!loading && wrongQuestions.length > 0" class="correction-info">
        <span>共 {{ wrongQuestions.length }} 題需要訂正</span>
      </div>
    </div>

    <!-- 載入中提示 -->
    <div v-if="loading" class="panel">
      <div style="text-align: center; padding: 40px;">
        <p>載入中...</p>
      </div>
    </div>

    <!-- 沒有需要訂正的題目 -->
    <div v-else-if="wrongQuestions.length === 0" class="panel">
      <div style="text-align: center; padding: 40px;">
        <p style="font-size: 18px; color: #594237; margin-bottom: 20px;">本次測驗已無需要訂正的題目</p>
      </div>
    </div>

    <!-- 訂正題目列表 -->
    <div v-else>
      <div v-for="(question, index) in wrongQuestions" :key="question.question_id" class="panel question-panel">
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

        <!-- ========== 修正：使用 formattedOptions 顯示選項 ========== -->
        <div class="options">
          <!-- 單選題 -->
          <div v-if="question.type === 'single'">
            <label v-for="(opt, idx) in question.formattedOptions" :key="idx">
              <input 
                type="radio" 
                :name="'q' + question.question_id" 
                :value="idx" 
                v-model="answers[question.question_id]"
              > 
              <MathContent :content="opt" />
            </label>
          </div>

          <!-- 多選題 -->
          <div v-else-if="question.type === 'multiple'">
            <label v-for="(opt, idx) in question.formattedOptions" :key="idx">
              <input 
                type="checkbox" 
                :value="idx" 
                v-model="answers[question.question_id]"
              > 
              <MathContent :content="opt" />
            </label>
          </div>

          <!-- 選填題 -->
          <div v-else-if="question.type === 'fill'">
            <input 
              class="input-answer" 
              v-model="answers[question.question_id]" 
              placeholder="請填入答案" 
            />
          </div>
        </div>

        <div class="button-row">
          <button class="btn-correct" @click="correctQuestion(question)">
            訂正此題
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
const wrongQuestions = ref([]);
const answers = ref({});
const quizRecordId = ref(null);

onMounted(async () => {
  quizRecordId.value = route.params.id;
  await loadWrongQuestions();
});

// 載入需要訂正的題目
async function loadWrongQuestions() {
  loading.value = true;
  
  try {
    const response = await fetch(`/api/quiz-records/${quizRecordId.value}/corrections`);
    
    if (!response.ok) {
      throw new Error('載入訂正題目失敗');
    }

    const data = await response.json();
    
    // ========== 關鍵修正：為每個題目載入選項資料並使用測驗時的選項順序 ==========
    const questionsWithOptions = [];
    
    for (const question of data.wrongQuestions) {
      if (question.type === 'single' || question.type === 'multiple') {
        // 載入原始選項
        const optionResponse = await fetch(`/api/question/${question.question_id}`);
        
        if (optionResponse.ok) {
          const questionDetail = await optionResponse.json();
          const originalOptions = questionDetail.options || [];
          
          // ========== 使用測驗記錄中儲存的選項順序（與詳解頁面相同邏輯）==========
          if (question.option_order) {
            try {
              const optionOrderArray = JSON.parse(question.option_order);
              
              // 按照測驗時的順序重組選項
              const shuffledOptions = optionOrderArray.map(idx => originalOptions[idx]);
              
              // 加上 (A) (B) (C) 標號
              question.formattedOptions = shuffledOptions.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                return `(${letter}) ${opt}`;
              });
              
              console.log(`[訂正] 題目 #${question.question_id} 使用儲存的選項順序:`, optionOrderArray);
            } catch (e) {
              console.error('解析選項順序失敗:', e);
              // 解析失敗，使用原始順序
              question.formattedOptions = originalOptions.map((opt, idx) => {
                const letter = String.fromCharCode(65 + idx);
                return `(${letter}) ${opt}`;
              });
            }
          } else {
            // 舊資料沒有選項順序記錄，使用原始順序
            console.log(`[訂正] 題目 #${question.question_id} 沒有選項順序記錄，使用原始順序`);
            question.formattedOptions = originalOptions.map((opt, idx) => {
              const letter = String.fromCharCode(65 + idx);
              return `(${letter}) ${opt}`;
            });
          }
        } else {
          console.warn(`[訂正] 載入題目 #${question.question_id} 失敗`);
          question.formattedOptions = [];
        }
      } else {
        question.formattedOptions = null;
      }
      
      questionsWithOptions.push(question);
    }
    
    wrongQuestions.value = questionsWithOptions;

    // 初始化答案物件
    wrongQuestions.value.forEach(q => {
      if (q.type === 'multiple') {
        answers.value[q.question_id] = [];
      } else {
        answers.value[q.question_id] = null;
      }
    });

  } catch (error) {
    console.error('載入訂正題目失敗:', error);
    alert('載入訂正題目失敗: ' + error.message);
  } finally {
    loading.value = false;
  }
}

// 訂正單題
async function correctQuestion(question) {
  const userAnswer = formatAnswer(answers.value[question.question_id], question.type);

  if (!userAnswer || userAnswer.trim() === '') {
    alert('請先作答');
    return;
  }

  try {
    const response = await fetch(
      `/api/quiz-records/${quizRecordId.value}/corrections/${question.question_id}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ userAnswer })
      }
    );

    if (!response.ok) {
      throw new Error('訂正失敗');
    }

    // 將變數名稱從 result 改為 data，避免與 response 變數衝突
    const data = await response.json();

    if (data.correct) {
      alert(data.message);
      
      // 從列表中移除已訂正的題目
      wrongQuestions.value = wrongQuestions.value.filter(
        q => q.question_id !== question.question_id
      );

      // 如果所有題目都訂正完成
      if (data.allCorrected) {
        alert('恭喜！本次測驗所有錯題已訂正完成！');
      }
    } else {
      alert(data.message);
    }

  } catch (error) {
    console.error('訂正失敗:', error);
    alert('訂正失敗: ' + error.message);
  }
}

// 格式化答案
function formatAnswer(answer, type) {
  if (type === 'multiple') {
    if (Array.isArray(answer)) {
      return answer.map(idx => String.fromCharCode(65 + idx)).join(',');
    }
    return '';
  } else if (type === 'single') {
    if (answer !== null && answer !== undefined) {
      return String.fromCharCode(65 + answer);
    }
    return '';
  } else if (type === 'fill') {
    return answer || '';
  }
  return '';
}

// 取得題型標籤
function getQuestionTypeLabel(type) {
  const labels = {
    'single': '單選題',
    'multiple': '多選題',
    'fill': '填充題'
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

.correction-info {
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

.options {
  margin: 20px 0;
}

.options label {
  display: block;
  margin-bottom: 10px;
  padding-left: 5px;
  cursor: pointer;
  font-size: 16px;
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
  font-family: 'Noto Sans TC', sans-serif;
}

.button-row {
  display: flex;
  justify-content: center;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 2px solid #f0f0f0;
}

.btn-correct {
  background-color: #d78585;
  color: white;
  padding: 12px 30px;
  font-size: 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.2s;
  font-weight: normal;
}

.btn-correct:hover {
  background-color: #b66363;
}

/* 響應式設計 */
@media (max-width: 768px) {
  .container {
    padding: 10px;
  }

  .panel {
    padding: 15px;
  }

  .header-panel {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
  }

  .question-header {
    font-size: 16px;
  }

  .question-content {
    font-size: 16px;
  }

  .options label {
    padding-left: 5px;
    font-size: 14px;
  }
}
</style>
