<template>
  <div class="add-question-page">
    <h2>新增題目</h2>

    <div class="form-container">

      <!-- 新增：範圍選單 -->
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

      <!-- 題目內容 -->
      <div class="form-group">
        <label><h3>題目內容</h3></label>
        <textarea v-model="newQuestion.text" rows="3" placeholder="請輸入題目"></textarea>
      </div>

      <!-- 題型選單 -->
      <div class="form-group">
        <label><h3>題型</h3></label>
        <select v-model="newQuestion.type">
          <option value="single">單選題</option>
          <option value="multiple">多選題</option>
          <option value="fill">選填題</option>
        </select>
      </div>

      <!-- 單選/多選題選項 -->
      <div class="form-group" v-if="newQuestion.type === 'single' || newQuestion.type === 'multiple'">
        <label>選項</label>
        <div v-for="(opt, idx) in newQuestion.options" :key="idx" class="options">
          <input v-model="newQuestion.options[idx]" placeholder="請輸入選項" />
          <button class="btn" @click="removeOption(idx)" style="padding:6px 10px; margin-left:6px;">刪除</button>
        </div>
        <div class="btn-row" style="margin-top:8px;">
          <button class="btn" @click="addOption">新增選項</button>
        </div>
      </div>

      <!-- 難易度選單 -->
      <div class="form-group">
        <label><h3>難易度</h3></label>
        <select v-model="selectedDifficulty">
          <option disabled value="">請選擇難易度</option>
          <option v-for="level in difficulties" :key="level" :value="level">{{ level }}</option>
        </select>
      </div>

      <!-- 題目加入方式 -->
      <div class="form-group radio-group">
        <div class="radio-row">
          <label class="radio-option">
            <input type="radio" value="only" v-model="newQuestion.mode" required />
            <span>僅加入此題</span>
          </label>
          <label class="radio-option">
            <input type="radio" value="withSimilar" v-model="newQuestion.mode" required />
            <span>加入此題並允許自動產生類題</span>
          </label>
        </div>
      </div>

      <!-- 底部按鈕 -->
      <div class="btn-row">
        <button class="btn" @click="addQuestion">新增題目</button>
        <button class="btn" @click="goToQuestionBank">查看目前題庫</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, watch } from 'vue';

const allConcepts = ref({
  國中: {
    '主題01': ['觀念01-A', '觀念01-B'],
    '主題02': ['觀念02-A', '觀念02-B', '觀念02-C'],
    '主題03': ['觀念03-A'],
    '主題04': ['觀念04-A', '觀念04-B'],
    '主題05': ['觀念05-A', '觀念05-B', '觀念05-C']
  },
  高中: {
    '主題H01': ['觀念H01-A', '觀念H01-B'],
    '主題H02': ['觀念H02-A', '觀念H02-B', '觀念H02-C'],
    '主題H03': ['觀念H03-A'],
    '主題H04': ['觀念H04-A', '觀念H04-B'],
    '主題H05': ['觀念H05-A', '觀念H05-B']
  }
});
const difficulties = ref(['容易', '中等', '困難', '魔王']);

// 新增：選擇範圍
const selectedLevel = ref(''); // 選擇國中或高中範圍
// 主題與觀念改為依範圍計算
const selectedTopic = ref('')
const selectedConcept = ref('')
const selectedDifficulty = ref('')

const newQuestion = ref({
  text: '',
  type: 'single',
  options: [],
  answer: '',
  mode: ''
});

// topics 由 selectedLevel 計算
const topics = computed(() => {
  if (!selectedLevel.value) return [];
  return Object.keys(allConcepts.value[selectedLevel.value] || {});
});

const filteredConcepts = computed(() => {
  if (!selectedLevel.value || !selectedTopic.value) return [];
  return allConcepts.value[selectedLevel.value][selectedTopic.value] || [];
});

// 當切換範圍或主題時清空下層選擇
watch(selectedLevel, () => {
  selectedTopic.value = '';
  selectedConcept.value = '';
});
watch(selectedTopic, () => {
  selectedConcept.value = '';
});

function addOption() {
  newQuestion.value.options.push('');
}
function removeOption(index) {
  newQuestion.value.options.splice(index, 1);
}
function addQuestion() {
  if (!selectedLevel.value) return alert('請選擇範圍');
  if (!newQuestion.value.text.trim()) return alert('請輸入題目內容');
  if (!newQuestion.value.mode) return alert('請選擇加入方式');
  if (!selectedTopic.value) return alert('請選擇主題');
  if (!selectedConcept.value) return alert('請選擇觀念');
  if (!selectedDifficulty.value) return alert('請選擇難易度');

  const payload = {
    ...newQuestion.value,
    level: selectedLevel.value,
    topic: selectedTopic.value,
    concept: selectedConcept.value,
    difficulty: selectedDifficulty.value
  };

  console.log('新增題目:', payload);
  alert('題目已新增！（示意）');

  // reset
  newQuestion.value = { text: '', type: 'single', options: [], answer: '', mode: '' };
  selectedLevel.value = '';
  selectedTopic.value = '';
  selectedConcept.value = '';
  selectedDifficulty.value = '';
}
function goToQuestionBank() {
  alert('跳轉至題庫頁（預留）');
}
</script>

<style scoped>
.add-question-page {
  font-family: 'Noto Sans TC', sans-serif;
  background-color: #f9f9f9;
  padding: 20px;
}
h2 { margin-bottom: 20px; }
.form-container {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  border: 2px solid #d0d6dc;
  margin-bottom: 30px;
  width: 100%;
  box-sizing: border-box;
}
.form-group { margin-bottom: 15px; }
.form-group > label {
  display: block;
  margin-bottom: 6px;
  font-weight: bold;
  color: #2d2d2d;
}
.form-group input,
.form-group textarea,
.form-group select {
  width: 100%;
  padding: 10px;
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
.btn:hover { background-color: #c06565; }
.options { margin-top: 5px; }
.radio-group { margin: 10px 0 0; }
.radio-row {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  align-items: center;
}
.radio-option {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  white-space: nowrap;
}
.btn-row {
  display: flex;
  gap: 10px;
  align-items: center;
  margin-top: 12px;
}
</style>
