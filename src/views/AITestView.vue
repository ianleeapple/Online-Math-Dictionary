<template>
  <div class="ai-test-container">
    <h2>AI 類題生成測試</h2>
    <div class="card">
      <div class="form-group">
        <label>原始題目</label>
        <textarea v-model="sourceQuestion" rows="4" placeholder="請輸入原始題目"></textarea>
      </div>
      <div class="form-group">
        <label>題目類型</label>
        <select v-model="questionType">
          <option value="填充題">填充題</option>
          <option value="單選題">單選題</option>
          <option value="多選題">多選題</option>
          <option value="是非題">是非題</option>
          <option value="計算題">計算題</option>
        </select>
      </div>
      <div class="form-row">
        <div class="form-group half">
          <label>難度</label>
          <select v-model="difficulty">
            <option value="easy">簡單</option>
            <option value="medium">中等</option>
            <option value="hard">困難</option>
          </select>
        </div>
        <div class="form-group half">
          <label>生成數量</label>
          <select v-model="count">
            <option value="1">1</option>
            <option value="3">3</option>
            <option value="5">5</option>
            <option value="10">10</option>
          </select>
        </div>
      </div>
      <div class="form-group" v-if="questionType === '單選題' || questionType === '多選題'">
        <label>選項範例</label>
        <textarea v-model="optionsTemplate" rows="3" placeholder="請輸入選項範例，每行一個"></textarea>
      </div>
      <div class="form-group">
        <label>額外限制條件</label>
        <textarea v-model="constraints" rows="3" placeholder="請輸入額外限制條件"></textarea>
      </div>
      <div class="button-row">
        <button @click="generateQuestions" :disabled="isLoading" class="primary-button">
          {{ isLoading ? '生成中...' : '生成類似題目' }}
        </button>
        <button @click="resetForm" class="secondary-button">重置</button>
      </div>
      <div v-if="isLoading" class="loading-indicator">
        <div class="spinner"></div>
        <p>AI 正在思考中，請稍候...</p>
      </div>
    </div>
    <div v-if="generatedQuestions.length > 0" class="results-container">
      <h3>生成結果 ({{ generatedQuestions.length }})</h3>
      <div v-for="(question, index) in generatedQuestions" :key="index" class="question-card">
        <div class="question-header">
          <span class="question-number">題目 {{ index + 1 }}</span>
          <span class="question-difficulty">{{ getDifficultyText(question.difficulty) }}</span>
        </div>
        <div class="question-content">
          <p><strong>題目：</strong>{{ question.question }}</p>
          <div v-if="question.choices && question.choices.length > 0">
            <p><strong>選項：</strong></p>
            <ul class="choices-list">
              <li v-for="(choice, cIdx) in question.choices" :key="cIdx">{{ choice }}</li>
            </ul>
          </div>
          <div class="solution-container">
            <p class="solution-toggle" @click="toggleSolution(index)">
              {{ showSolutionMap[index] ? '隱藏解答' : '顯示解答' }}
            </p>
            <div v-if="showSolutionMap[index]" class="solution">
              <p><strong>答案：</strong>{{ question.answer }}</p>
              <div v-if="question.solution_concept && question.solution_concept.length > 0">
                <p><strong>解題概念：</strong></p>
                <ol class="steps-list">
                  <li v-for="(step, sIdx) in question.solution_concept" :key="sIdx">{{ step }}</li>
                </ol>
              </div>
              <div v-if="question.detailed_steps && question.detailed_steps.length > 0">
                <p><strong>詳細步驟：</strong></p>
                <ol class="steps-list">
                  <li v-for="(step, sIdx) in question.detailed_steps" :key="sIdx">{{ step }}</li>
                </ol>
              </div>
            </div>
          </div>
          <div v-if="question.analysis" class="analysis-container">
            <p><strong>核心概念解析：</strong>{{ question.analysis }}</p>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive } from 'vue';

const sourceQuestion = ref('');
const questionType = ref('填充題');
const difficulty = ref('medium');
const count = ref('3');
const optionsTemplate = ref('');
const constraints = ref('');
const isLoading = ref(false);
const generatedQuestions = ref([]);
const showSolutionMap = reactive({});

async function generateQuestions() {
  if (!sourceQuestion.value.trim()) {
    alert('請輸入原始題目');
    return;
  }
  isLoading.value = true;
  try {
    const response = await fetch('/api/ai/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        template: sourceQuestion.value,
        type: questionType.value,
        variations: parseInt(count.value),
        difficulty: difficulty.value,
        options_template: optionsTemplate.value,
        constraints: constraints.value,
      }),
    });
    if (!response.ok) throw new Error(`API 錯誤: ${response.status}`);
    const data = await response.json();
    generatedQuestions.value = data.generated || [];
    generatedQuestions.value.forEach((_, index) => { showSolutionMap[index] = false; });
  } catch (error) {
    alert(`生成失敗: ${error.message}`);
  } finally {
    isLoading.value = false;
  }
}
function resetForm() {
  sourceQuestion.value = '';
  questionType.value = '填充題';
  difficulty.value = 'medium';
  count.value = '3';
  optionsTemplate.value = '';
  constraints.value = '';
  generatedQuestions.value = [];
}
function toggleSolution(index) {
  showSolutionMap[index] = !showSolutionMap[index];
}
function getDifficultyText(diff) {
  const map = { easy: '簡單', medium: '中等', hard: '困難' };
  return map[diff] || diff;
}
</script>

<style scoped>
.ai-test-container { max-width: 900px; margin: 0 auto; padding: 20px; font-family: 'Noto Sans TC', sans-serif; }
h2 { margin-bottom: 20px; color: #333; }
.card { background: #fff; border-radius: 8px; padding: 20px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); margin-bottom: 20px; }
.form-group { margin-bottom: 15px; }
.form-group label { display: block; font-weight: 600; margin-bottom: 5px; color: #444; }
.form-row { display: flex; gap: 15px; margin-bottom: 15px; }
.half { flex: 1; }
textarea, select { width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 4px; font-size: 14px; font-family: inherit; }
textarea { resize: vertical; }
.button-row { display: flex; gap: 10px; margin-top: 20px; }
.primary-button, .secondary-button { padding: 10px 20px; border: none; border-radius: 4px; font-weight: 600; cursor: pointer; transition: background-color 0.2s; }
.primary-button { background-color: #d78585; color: white; }
.primary-button:hover { background-color: #c06565; }
.secondary-button { background-color: #e9e9e9; color: #333; }
.secondary-button:hover { background-color: #ddd; }
.loading-indicator { display: flex; flex-direction: column; align-items: center; margin-top: 20px; }
.spinner { width: 40px; height: 40px; border: 4px solid #f3f3f3; border-top: 4px solid #d78585; border-radius: 50%; animation: spin 1s linear infinite; }
@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
.results-container { margin-top: 30px; }
.question-card { background: #fff; border-radius: 8px; padding: 15px; margin-bottom: 15px; box-shadow: 0 1px 3px rgba(0,0,0,0.1); border-left: 4px solid #d78585; }
.question-header { display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 8px; border-bottom: 1px solid #eee; }
.question-number { font-weight: 600; color: #d78585; }
.question-difficulty { background-color: #f5f5f5; padding: 3px 8px; border-radius: 12px; font-size: 12px; }
.question-content { margin-bottom: 15px; }
.choices-list { list-style-type: none; padding-left: 10px; }
.choices-list li { margin-bottom: 5px; }
.solution-container { margin-top: 10px; }
.solution-toggle { color: #2a6ab3; cursor: pointer; display: inline-block; font-weight: 500; }
.solution-toggle:hover { text-decoration: underline; }
.solution { background-color: #f9f9f9; padding: 10px; margin-top: 10px; border-radius: 4px; border-left: 3px solid #2a6ab3; }
.steps-list { margin-top: 5px; padding-left: 20px; }
.analysis-container { margin-top: 10px; padding: 10px; background-color: #f0f8ff; border-left: 3px solid #2a6ab3; border-radius: 4px; }
</style>
