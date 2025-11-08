<template>
  <div class="add-question-page">
    <h2>新增題目</h2>

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

      <!-- 題目內容 -->
      <div class="form-group">
        <label><h3>題目內容</h3></label>
        <textarea v-model="newQuestion.text" rows="6" placeholder="請輸入題目內容"></textarea>
      </div>

      <!-- 題目附圖 -->
      <div class="form-group">
        <label><h3>題目附圖（選填）</h3></label>
        <input type="file" @change="handleImageUpload" accept=".png,.jpg,.jpeg" ref="fileInput"/>
        <div v-if="newQuestion.imagePreview" class="image-preview">
          <img :src="newQuestion.imagePreview" alt="預覽圖" />
          <button class="btn remove-btn" @click="removeImage">移除圖片</button>
        </div>
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

      <!-- 選項與答案區域 -->
      <div class="form-group">
        <!-- 單選題選項 (4個) -->
        <div v-if="newQuestion.type === 'single'">
          <label><h3>選項（請填寫4個選項並勾選正確答案）</h3></label>
          <div v-for="(option, index) in singleOptions" :key="index" class="option-input-row">
            <input 
              type="radio" 
              name="correctAnswer" 
              :value="index" 
              v-model="selectedAnswerIndex"
              class="radio-input"
            />
            <span class="option-label">選項 {{ index + 1 }}：</span>
            <input 
              type="text" 
              v-model="singleOptions[index]" 
              :placeholder="'請輸入選項 ' + (index + 1) + ' 的內容'"
              class="option-text-input"
            />
          </div>
        </div>

        <!-- 多選題選項 (5個) -->
        <div v-else-if="newQuestion.type === 'multiple'">
          <label><h3>選項（請填寫5個選項並勾選所有正確答案）</h3></label>
          <div v-for="(option, index) in multipleOptions" :key="index" class="option-input-row">
            <input 
              type="checkbox" 
              :value="index" 
              v-model="selectedAnswerIndexes"
              class="checkbox-input"
            />
            <span class="option-label">選項 {{ index + 1 }}：</span>
            <input 
              type="text" 
              v-model="multipleOptions[index]" 
              :placeholder="'請輸入選項 ' + (index + 1) + ' 的內容'"
              class="option-text-input"
            />
          </div>
        </div>

        <!-- 選填題答案 -->
        <div v-else-if="newQuestion.type === 'fill'">
          <label><h3>答案</h3></label>
          <input 
            type="text" 
            v-model="fillAnswer" 
            placeholder="請輸入答案"
            class="fill-answer-input"
          />
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
import { useRouter } from 'vue-router';

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
  imageFile: null,
  imagePreview: null,
});

// 單選題選項 (4個)
const singleOptions = ref(['', '', '', '']);
// 單選題答案索引
const selectedAnswerIndex = ref(null);

// 多選題選項 (5個)
const multipleOptions = ref(['', '', '', '', '']);
// 多選題答案索引陣列
const selectedAnswerIndexes = ref([]);

// 選填題答案
const fillAnswer = ref('');

// 多選題答案陣列
const multipleAnswers = ref([]);

// 新增題目附圖預設值
const fileInput = ref(null);

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

function handleImageUpload(event) {
  const file = event.target.files[0];
  if (file) {
    if (file.size > 5 * 1024 * 1024) {
      alert('圖片大小不能超過 5MB');
      return;
    }
    newQuestion.value.imageFile = file;
    newQuestion.value.imagePreview = URL.createObjectURL(file);
  }
}

function removeImage() {
  // 清除圖片資料
  newQuestion.value.imageFile = null;
  newQuestion.value.imagePreview = null;

  // 移除檔名顯示
  if (fileInput.value) {
    fileInput.value.value = '';
  }
}

function toggleMultipleAnswer(option) {
  const index = multipleAnswers.value.indexOf(option);
  if (index > -1) {
    multipleAnswers.value.splice(index, 1);
  } else {
    multipleAnswers.value.push(option);
  }
  // 排序並組合為字串 (例如: "A,C,E")
  multipleAnswers.value.sort();
  newQuestion.value.answer = multipleAnswers.value.join(',');
}

// 監聽題型變化，重置選項和答案
watch(() => newQuestion.value.type, (newType) => {
  if (newType === 'single') {
    singleOptions.value = ['', '', '', ''];
    selectedAnswerIndex.value = null;
  } else if (newType === 'multiple') {
    multipleOptions.value = ['', '', '', '', ''];
    selectedAnswerIndexes.value = [];
  } else if (newType === 'fill') {
    fillAnswer.value = '';
  }
});

async function addQuestion() {
  if (!selectedLevel.value) return alert('請選擇範圍');
  if (!newQuestion.value.text.trim()) return alert('請輸入題目內容');
  if (!selectedTopic.value) return alert('請選擇主題');
  if (!selectedConcept.value) return alert('請選擇觀念');
  if (!selectedDifficulty.value) return alert('請選擇難易度');

  const formData = new FormData();
  formData.append('level', selectedLevel.value);
  formData.append('topic', selectedTopic.value);
  formData.append('concept', selectedConcept.value);
  formData.append('content', newQuestion.value.text);
  formData.append('type', newQuestion.value.type);
  formData.append('difficulty', selectedDifficulty.value);

  if (newQuestion.value.imageFile) {
    formData.append('image', newQuestion.value.imageFile);
  }

  // 根據題型處理答案和選項
  if (newQuestion.value.type === 'single') {
    // 驗證選項和答案
    const hasEmptyOption = singleOptions.value.some(opt => !opt.trim());
    if (hasEmptyOption) {
      return alert('請填寫所有選項內容');
    }
    if (selectedAnswerIndex.value === null) {
      return alert('請選擇正確答案');
    }

    // 答案儲存為選項內容（而非索引）
    formData.append('answer', singleOptions.value[selectedAnswerIndex.value]);
    // 選項陣列
    formData.append('options', JSON.stringify(singleOptions.value));

  } else if (newQuestion.value.type === 'multiple') {
    // 驗證選項和答案
    const hasEmptyOption = multipleOptions.value.some(opt => !opt.trim());
    if (hasEmptyOption) {
      return alert('請填寫所有選項內容');
    }
    if (selectedAnswerIndexes.value.length === 0) {
      return alert('請至少選擇一個正確答案');
    }

    // 答案儲存為選項內容（而非索引），用逗號分隔
    const correctAnswers = selectedAnswerIndexes.value
      .map(index => multipleOptions.value[index])
      .join(',');
    formData.append('answer', correctAnswers);
    // 選項陣列
    formData.append('options', JSON.stringify(multipleOptions.value));

  } else if (newQuestion.value.type === 'fill') {
    // 驗證答案
    if (!fillAnswer.value.trim()) {
      return alert('請填寫答案');
    }
    formData.append('answer', fillAnswer.value);
  }

  try {
    const res = await fetch('/api/question', {
      method: 'POST',
      body: formData
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.message || '新增題目失敗');
    }

    alert('題目新增成功！');

    // 重置表單
    newQuestion.value = {
      text: '',
      type: 'single',
      imageFile: null,
      imagePreview: null
    };
    singleOptions.value = ['', '', '', ''];
    selectedAnswerIndex.value = null;
    multipleOptions.value = ['', '', '', '', ''];
    selectedAnswerIndexes.value = [];
    fillAnswer.value = '';

    if (fileInput.value) {
      fileInput.value.value = '';
    }

    selectedLevel.value = '';
    selectedTopic.value = '';
    selectedConcept.value = '';
    selectedDifficulty.value = '';
  } catch (e) {
    alert('新增失敗：' + e.message);
  }
}
const router = useRouter();
function goToQuestionBank() {
  // 嘗試使用 router（若路由已註冊 /question），否則 fallback 到直接導向
  try {
    if (router && router.push) {
      router.push('/question');
      return;
    }
  } catch (_) {}
  window.location.href = '/questions';
}
</script>

<style scoped>
.add-question-page {
  font-family: 'Noto Sans TC', sans-serif;
  background-color: #f9f9f9;
  padding: 20px;
}

h2 { 
  margin-bottom: 20px; 
}

.form-container {
  background: #fff;
  padding: 20px;
  border-radius: 10px;
  border: 2px solid #d0d6dc;
  margin-bottom: 30px;
  width: 100%;
  box-sizing: border-box;
}

.form-group { 
  margin-bottom: 15px; 
}

.form-group > label {
  display: block;
  margin-bottom: 6px;
  font-weight: bold;
  color: #2d2d2d;
}

/* 只針對直接子元素的 input、textarea、select 套用樣式 */
.form-group > input,
.form-group > textarea,
.form-group > select {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
}

/* 讓 textarea 的 placeholder 可以換行顯示 */
.form-group textarea::placeholder {
  white-space: pre-line;
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
  gap: 10px;
  align-items: center;
  margin-top: 12px;
}

.image-preview {
  margin-top: 10px;
  position: relative;
}

.image-preview img {
  max-width: 100%;
  max-height: 300px;
  border-radius: 6px;
}

.remove-btn {
  position: absolute;
  top: 10px;
  right: 10px;
  background: #d67b7b;
}

/* 選項輸入區域 */
.option-input-row {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.radio-input,
.checkbox-input {
  width: 20px;
  height: 20px;
  cursor: pointer;
  flex-shrink: 0;
  margin: 0;
}

.option-label {
  font-weight: bold;
  min-width: 70px;
  flex-shrink: 0;
  color: #594237;
  font-size: 14px;
}

.option-text-input {
  flex: 1;
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
}

.option-text-input:focus {
  outline: none;
  border-color: #d67b7b;
}

.fill-answer-input {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
}

.fill-answer-input:focus {
  outline: none;
  border-color: #d67b7b;
}
</style>
