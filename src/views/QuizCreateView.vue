<template>
  <div class="quiz-bg">
    <h2>測驗建立</h2>
    <div class="section">
      <div class="form-row">
        <!-- 新增範圍選單 -->
        <div class="form-group">
          <label><h3>選擇範圍</h3></label>
          <select v-model="selectedLevel">
            <option disabled value="">請選擇範圍</option>
            <option value="國中">國中</option>
            <option value="高中">高中</option>
          </select>
        </div>
        <div class="form-group">
          <label><h3>選擇主題</h3></label>
          <select v-model="selectedTopic">
            <option disabled value="">請選擇一個主題</option>
            <option v-for="topic in topics" :key="topic" :value="topic">{{ topic }}</option>
          </select>
        </div>
        <div class="form-group">
          <label><h3>選擇觀念</h3></label>
          <select v-model="selectedConcept">
            <option disabled value="">請選擇一個觀念</option>
            <option v-for="concept in filteredConcepts" :key="concept" :value="concept">{{ concept }}</option>
          </select>
        </div>
        <div class="form-group">
          <label><h3>難易度</h3></label>
          <select v-model="selectedDifficulty">
            <option disabled value="">請選擇難易度</option>
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
import { useRouter } from 'vue-router';
const router = useRouter();

// 使用與 QuestionView 和 AddQuestionView 一致的資料結構
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

const difficulties = ['系統自動', '容易', '中等', '困難', '魔王'];
const questionCounts = ['5 題', '10 題', '20 題', '25 題'];
const timingOptions = [
  { label: '正向計時', value: 'forward' },
  { label: '系統建議倒數計時', value: 'countdown' },
  { label: '自訂倒數計時', value: 'custom' }
];
const questionTypes = [
  { label: '單選題', value: 'single' },
  { label: '多選題', value: 'multiple' },
  { label: '選填題', value: 'fill' }
];
const selectedLevel = ref('');
const selectedTopic = ref('');
const selectedConcept = ref('');
const selectedDifficulty = ref('系統自動');
const selectedCount = ref('5 題');
const selectedTiming = ref('forward');
const customTime = ref('');
const selectedQuestionTypes = ref([]);
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
async function createQuiz() {
  
  // 驗證所有必要欄位
  const errors = [];
  
  if (!selectedLevel.value) {
    errors.push('請選擇範圍');
  }
  
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
  
  // ========== 新增：檢查題目數量是否足夠 ==========
  try {
    // 建立 API 查詢參數
    const params = new URLSearchParams();
    if (selectedLevel.value) params.append('level', selectedLevel.value);
    if (selectedTopic.value) params.append('topic', selectedTopic.value);
    if (selectedConcept.value && selectedConcept.value !== '所有觀念') {
      params.append('concept', selectedConcept.value);
    }
    if (selectedDifficulty.value) params.append('difficulty', selectedDifficulty.value);

    console.log('檢查題目數量，API 查詢參數:', params.toString());

    // 從 API 抓取符合條件的題目
    const response = await fetch(`/api/question?${params.toString()}`);
    
    if (!response.ok) {
      throw new Error('無法檢查題目數量');
    }

    const data = await response.json();
    console.log('符合條件的題目總數:', data.length);

    // 篩選題型
    let filteredQuestions = data;
    if (selectedQuestionTypes.value.length > 0) {
      filteredQuestions = data.filter(q => selectedQuestionTypes.value.includes(q.type));
      console.log('題型篩選後題目數量:', filteredQuestions.length);
    }

    // 檢查數量
    const requestedCount = parseInt(selectedCount.value.split(' ')[0]);
    
    if (filteredQuestions.length === 0) {
      alert('找不到符合條件的題目！\n\n請調整篩選條件後重試。');
      return;
    }
    
    if (filteredQuestions.length < requestedCount) {
      alert(
        `題目數量不足！\n\n` +
        `欲作答題目數量：${requestedCount} 題\n` +
        `目前符合條件的題目：${filteredQuestions.length} 題\n\n` +
        `請調整篩選條件後重試。`
      );
      return;
    }

    console.log('題目數量檢查通過，準備建立測驗');

  } catch (error) {
    console.error('檢查題目數量失敗:', error);
    alert('無法檢查題目數量，請稍後再試');
    return;
  }
  
  // ========== 題目數量檢查通過，開始建立測驗 ==========
  
  // 解析題數
  const count = parseInt(selectedCount.value.split(' ')[0]);
  
  // 解析計時設定
  let timingMode = selectedTiming.value;
  let timeLimit = null;
  
  if (selectedTiming.value === 'custom') {
    timingMode = 'countdown';
    timeLimit = parseInt(customTime.value);
  } else if (selectedTiming.value === 'countdown') {
    // 系統建議倒數計時：每題 5 分鐘
    timeLimit = count * 5;
  }
  
  console.log('準備導向測驗頁面，參數:', {
    level: selectedLevel.value,
    topic: selectedTopic.value,
    concept: selectedConcept.value,
    difficulty: selectedDifficulty.value,
    count: count,
    timing: timingMode,
    timeLimit: timeLimit,
    types: selectedQuestionTypes.value.join(',')
  });
  
  try {
    // 導向測驗頁面，將篩選條件作為 query 參數傳遞
    await router.push({
      name: 'QuizTaking',
      query: {
        level: selectedLevel.value,
        topic: selectedTopic.value,
        concept: selectedConcept.value,
        difficulty: selectedDifficulty.value,
        count: count,
        timing: timingMode,
        timeLimit: timeLimit || undefined, // 沒有時間限制就不傳
        types: selectedQuestionTypes.value.join(',')
      }
    });
    console.log('路由跳轉成功');
  } catch (error) {
    console.error('路由跳轉失敗:', error);
    alert('頁面跳轉失敗: ' + error.message);
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
