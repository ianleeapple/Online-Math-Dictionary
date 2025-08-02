<template>
  <div class="quiz-bg">
    <h2>測驗建立</h2>
    <div class="section">
      <div class="form-row">
        <div class="form-group">
          <label><h3>選擇主題</h3></label>
          <select v-model="selectedTopic">
            <option disabled value="">請選擇一個主題</option>
            <option v-for="topic in topics" :key="topic">{{ topic }}</option>
          </select>
        </div>
        <div class="form-group">
          <label><h3>選擇觀念</h3></label>
          <select v-model="selectedConcept">
            <option disabled value="">請選擇一個觀念</option>
            <option v-for="concept in concepts" :key="concept">{{ concept }}</option>
          </select>
        </div>
        <div class="form-group">
          <label><h3>難易度</h3></label>
          <select v-model="selectedDifficulty">
            <option v-for="level in difficulties" :key="level">{{ level }}</option>
          </select>
        </div>
        <div class="form-group">
          <label><h3>題數</h3></label>
          <select v-model="selectedCount">
            <option v-for="count in questionCounts" :key="count">{{ count }}</option>
          </select>
        </div>
      </div>
      <div class="form-group">
        <label><h3>計時方式</h3></label>
        <div class="form-options" style="align-items: center;height: 50px;">
          <label class="option-item" v-for="option in timingOptions" :key="option.value">
            <input type="radio" name="timing" :value="option.value" v-model="selectedTiming" />
            {{ option.label }}
          </label>
          <label class="option-item" v-if="selectedTiming === 'custom'">
            <input type="number" v-model="customTime" placeholder="例如：30(分鐘)" style="width: 150px;">
          </label>
        </div>
      </div>
      <div class="form-group">
        <label><h3>題型</h3></label>
        <div class="form-options">
          <label class="option-item" v-for="type in questionTypes" :key="type.value">
            <input type="checkbox" :value="type.value" v-model="selectedQuestionTypes" />
            {{ type.label }}
          </label>
        </div>
      </div>
      <div class="form-group">
        <button class="btn" @click="createQuiz">建立測驗</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';
const topics = ['主題01', '主題02', '主題03', '主題04', '主題05'];
const allConcepts = {
  '主題01': ['觀念01-A', '觀念01-B'],
  '主題02': ['觀念02-A', '觀念02-B', '觀念02-C'],
  '主題03': ['觀念03-A'],
  '主題04': ['觀念04-A', '觀念04-B'],
  '主題05': ['觀念05-A', '觀念05-B', '觀念05-C']
};
const difficulties = ['系統自動', '平均分配', '容易', '中等', '困難', '魔王'];
const questionCounts = ['5 題', '10 題', '20 題', '25 題'];
const timingOptions = [
  { label: '系統建議', value: 'auto' },
  { label: '正向計時', value: 'forward' },
  { label: '倒數計時', value: 'countdown' },
  { label: '自訂倒數計時', value: 'custom' }
];
const questionTypes = [
  { label: '單選題', value: 'single' },
  { label: '多選題', value: 'multiple' },
  { label: '選填題', value: 'fill-in' },
  { label: '非選題', value: 'essay' },
  { label: '平均分配', value: 'average' },
  { label: '系統自動', value: 'auto' }
];
const selectedTopic = ref('');
const selectedConcept = ref('');
const selectedDifficulty = ref('系統自動');
const selectedCount = ref('5 題');
const selectedTiming = ref('auto');
const customTime = ref('');
const selectedQuestionTypes = ref([]);
const concepts = computed(() => selectedTopic.value ? allConcepts[selectedTopic.value] : []);
watch(selectedTopic, () => { selectedConcept.value = ''; });
async function createQuiz() {
  // 驗證所有必要欄位
  const errors = [];
  
  if (!selectedTopic.value) {
    errors.push('請選擇主題');
  }
  
  if (!selectedConcept.value) {
    errors.push('請選擇觀念');
  }
  
  if (!selectedDifficulty.value) {
    errors.push('請選擇難易度');
  }
  
  if (!selectedCount.value) {
    errors.push('請選擇題數');
  }
  
  if (!selectedTiming.value) {
    errors.push('請選擇計時方式');
  }
  
  // 如果選擇自訂計時，檢查自訂時間是否有填寫
  if (selectedTiming.value === 'custom' && (!customTime.value || customTime.value <= 0)) {
    errors.push('請填寫有效的自訂時間（大於 0 分鐘）');
  }
  
  if (selectedQuestionTypes.value.length === 0) {
    errors.push('請至少選擇一種題型');
  }
  
  // 如果有錯誤，顯示錯誤訊息並停止執行
  if (errors.length > 0) {
    alert('請完成以下必填欄位：\n' + errors.join('\n'));
    return;
  }
  
  const payload = {
    topic: selectedTopic.value,
    concept: selectedConcept.value,
    difficulty: selectedDifficulty.value,
    count: selectedCount.value,
    timing: selectedTiming.value === 'custom' ? `custom-${customTime.value}` : selectedTiming.value,
    questionTypes: selectedQuestionTypes.value
  };
  
  try {
    const res = await fetch('/api/quizzes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    if (!res.ok) throw new Error('建立失敗');
    const data = await res.json();
    alert('建立成功！\n' + JSON.stringify(data, null, 2));
  } catch (e) {
    alert('建立失敗：' + e.message);
  }
}
</script>

<style scoped>
.quiz-bg {
  background-color: #f9f9f9;
  min-height: 100vh;
  padding: 20px;
}
h2 {
  margin-bottom: 20px;
}
.section {
  border: 2px solid #d0d6dc;
  border-radius: 10px;
  background-color: white;
  padding: 20px;
  margin-bottom: 30px;
}
.form-group {
  margin-bottom: 20px;
}
label {
  font-weight: bold;
  display: block;
  margin-bottom: 8px;
  color: #333;
}
select, input[type="number"], input[type="text"] {
  width: 100%;
  padding: 8px;
  font-size: 16px;
  margin-top: 5px;
  border: 1px solid #ccc;
  border-radius: 6px;
}
.form-options {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}
.option-item {
  min-width: 150px;
}
.btn {
  background-color: #d67b7b;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
}
.btn:hover {
  background-color: #c06565;
}
.form-row {
  display: flex;
  gap: 20px;
  flex-wrap: wrap;
}
.form-row .form-group {
  flex: 1;
  min-width: 200px;
}
</style>
