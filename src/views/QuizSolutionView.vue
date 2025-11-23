<template>
  <div class="solution-page">

    <!-- 載入中 -->
    <div v-if="loading" style="text-align: center; padding: 40px;">
      <p>載入中...</p>
    </div>

    <!-- 測驗資訊 -->
    <div v-else-if="quizRecord" class="quiz-info-card">
      <h3>測驗資訊</h3>
      <table class="info-table">
        <tbody>
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
        </tbody>
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
                {{ getAnswerLetterOnly(question.user_answer, question.type) }}
              </span>
            </div>

            <div class="answer-row">
              <span class="label">正確答案：</span>
              <span class="correct-text">
                {{ getCorrectAnswerLetterOnly(question) }}
              </span>
            </div>
          </div>

          <!-- ========== 詳解相關結合AI功能按鈕 ========== -->
          <div class="question-actions">
            <button class="action-btn text-solution-btn" @click="viewTextSolution(question, index + 1)">
              查看文字詳解
            </button>
            <button
              class="action-btn video-solution-btn"
              @click="viewVideoSolution(question, index + 1)"
            >
              {{ getVideoButtonLabel(question.question_id) }}
            </button>
          </div>
        </div>
      </div>

      <div v-if="showSolutionModal" class="modal-overlay" @click.self="closeSolutionModal">
        <div class="modal-content solution-modal">
          <div class="solution-header">
            <h3>第 {{ solutionQuestionNumber }} 題詳解</h3>
          </div>

          <div class="solution-question-preview" :class="{ placeholder: !solutionQuestion }">
            <template v-if="solutionQuestion">
              <MathContent :content="solutionQuestion.content" />
            </template>
            <template v-else>
              正在載入題目內容...
            </template>
          </div>

          <div v-if="solutionLoading" class="solution-loading">
            <div class="spinner"></div>
            <p>載入詳解中...</p>
          </div>
          <div v-else-if="solutionError" class="solution-error">
            {{ solutionError }}
          </div>
          <div v-else-if="solutionQuestion" class="solution-sections">
            <section class="solution-section">
              <h4>文字詳解</h4>
              <div class="solution-box">
                <p class="solution-box-title">解題概念</p>
                <ol v-if="solutionQuestion.solution_concept && solutionQuestion.solution_concept.length" class="steps-list">
                  <li v-for="(step, idx) in solutionQuestion.solution_concept" :key="'concept-' + idx">
                    <MathContent :content="step" />
                  </li>
                </ol>
                <p v-else class="empty-text">尚未提供解題概念</p>
              </div>
              <div class="solution-box">
                <p class="solution-box-title">詳細計算步驟</p>
                <ol v-if="solutionQuestion.detailed_steps && solutionQuestion.detailed_steps.length" class="steps-list">
                  <li v-for="(step, idx) in solutionQuestion.detailed_steps" :key="'detail-' + idx">
                    <MathContent :content="step" />
                  </li>
                </ol>
                <p v-else class="empty-text">尚未提供計算步驟</p>
              </div>
            </section>
          </div>

          <div class="modal-actions">
            <button class="btn" @click="closeSolutionModal">關閉</button>
          </div>
        </div>
      </div>

        <div v-if="showVideoModal" class="modal-overlay" @click.self="closeVideoModal">
          <div class="modal-content solution-modal video-modal">
            <div class="solution-header">
              <h3>第 {{ videoQuestionNumber }} 題影音詳解</h3>
            </div>

            <div v-if="videoError" class="solution-error">
              {{ videoError }}
            </div>
            <div v-else-if="videoGenerating" class="solution-loading">
              <div class="spinner"></div>
              <p>{{ videoProgress }}</p>
            </div>
            <div v-else-if="videoLoading" class="solution-loading">
              <div class="spinner"></div>
              <p>正在檢查是否已有影片...</p>
            </div>
            <div v-else-if="videoUrl" class="video-player-wrapper">
              <video :src="videoUrl" controls class="video-player"></video>
            </div>
            <div v-else class="solution-error">
              無法取得影片資料
            </div>

            <div class="modal-actions">
              <button class="btn" @click="closeVideoModal">關閉</button>
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
const showSolutionModal = ref(false);
const solutionLoading = ref(false);
const solutionError = ref('');
const solutionQuestion = ref(null);
const solutionQuestionNumber = ref(null);
const solutionCache = new Map();
const videoCache = new Map();
const videoStatusMap = new Map();
const showVideoModal = ref(false);
const videoLoading = ref(false);
const videoGenerating = ref(false);
const videoProgress = ref('');
const videoError = ref('');
const videoUrl = ref('');
const videoMeta = ref(null);
const videoQuestionNumber = ref(null);
const videoModalQuestionId = ref(null);
const videoGenerationTasks = new Map();

// 載入測驗詳情
async function loadQuizDetail() {
  loading.value = true;
  videoCache.clear();
  videoStatusMap.clear();
  videoGenerationTasks.clear();

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

    await initializeVideoStatuses(data.questions);

    console.log('測驗詳情:', quizRecord.value);

  } catch (error) {
    console.error('載入測驗詳情失敗:', error);
    alert('載入測驗詳情失敗: ' + error.message);
    router.push('/quiz/records');
  } finally {
    loading.value = false;
  }
}

function normalizeSteps(value) {
  if (Array.isArray(value)) {
    return value;
  }
  if (typeof value === 'string') {
    return value
      .split(/\r?\n/)
      .map(line => line.trim())
      .filter(Boolean);
  }
  return [];
}

async function fetchQuestionDetail(question) {
  const cached = solutionCache.get(question.question_id);
  if (cached) {
    return cached;
  }

  const response = await fetch(`/api/question/${question.question_id}`);
  if (!response.ok) {
    throw new Error('無法載入題目詳解');
  }

  const detail = await response.json();
  const normalized = {
    ...detail,
    content: question.content || detail.content || '',
    solution_concept: normalizeSteps(detail.solution_concept),
    detailed_steps: normalizeSteps(detail.detailed_steps),
    analysis: typeof detail.analysis === 'string' ? detail.analysis.trim() : '',
    answer: detail.answer || question.correct_answer || '',
    options: Array.isArray(detail.options) && detail.options.length ? detail.options : (question.options || []),
    type: detail.type || question.type
  };

  solutionCache.set(question.question_id, normalized);
  return normalized;
}

// 格式化日期時間(直接加 8 小時) 
function formatDateTime(datetime) {
  if (!datetime) return '';
  
  try {
    const date = new Date(datetime);
    
    // 檢查日期是否有效
    if (isNaN(date.getTime())) {
      console.error('Invalid date:', datetime);
      return '日期格式錯誤';
    }
    
    // 直接加上 8 小時 (UTC+8)
    date.setHours(date.getHours() + 8);
    
    // 格式化顯示
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hour = String(date.getHours()).padStart(2, '0');
    const minute = String(date.getMinutes()).padStart(2, '0');
    const second = String(date.getSeconds()).padStart(2, '0');
    
    return `${year}/${month}/${day} ${hour}:${minute}:${second}`;
  } catch (error) {
    console.error('formatDateTime error:', error);
    return '日期格式錯誤';
  }
}

// 格式化作答時間
function formatDuration(seconds) {
  const minutes = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${minutes} 分 ${secs} 秒`;
}

function formatVideoDuration(duration) {
  if (duration === undefined || duration === null) {
    return '';
  }
  const numeric = Number(duration);
  if (Number.isNaN(numeric) || numeric <= 0) {
    return '';
  }
  const minutes = Math.floor(numeric / 60);
  const seconds = Math.round(numeric % 60);
  return `${minutes} 分 ${seconds.toString().padStart(2, '0')} 秒`;
}

function stripHtmlTags(content) {
  if (!content || typeof content !== 'string') {
    return '';
  }
  return content.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function joinNarrationLines(lines) {
  if (!Array.isArray(lines)) {
    return '';
  }
  return lines
    .map(line => stripHtmlTags(line))
    .filter(Boolean)
    .join('；');
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
    'fill': '填充題'
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

function buildQuestionPayload(question, detail) {
  const baseOptions = Array.isArray(question.options) && question.options.length
    ? question.options
    : (Array.isArray(detail.options) ? detail.options : []);

  return {
    id: question.question_id,
    question: detail.content || question.content || '',
    type: detail.type || question.type || '',
    options: baseOptions,
    answer: detail.answer || question.correct_answer || '',
    analysis: detail.analysis || '',
    solution_concept: detail.solution_concept || [],
    detailed_steps: detail.detailed_steps || [],
    topic: detail.topic || quizRecord.value?.topic || '',
    concept: detail.concept || quizRecord.value?.concept || '',
    difficulty: detail.difficulty || quizRecord.value?.difficulty || ''
  };
}

function buildVideoScript(questionPayload, questionNumber) {
  const scenes = [];
  const narrationParts = [];
  const questionText = stripHtmlTags(questionPayload.question) || `第 ${questionNumber} 題`;

  scenes.push({
    type: 'question',
    duration: 6,
    content: questionPayload.question,
    title: '題目重點'
  });
  narrationParts.push(`第 ${questionNumber} 題要解決的問題是：${questionText}。`);

  if (questionPayload.analysis) {
    const analysisText = stripHtmlTags(questionPayload.analysis);
    scenes.push({
      type: 'analysis',
      duration: 6,
      content: questionPayload.analysis,
      title: '概念解析'
    });
    narrationParts.push(`我們先理解關鍵概念：${analysisText}。`);
  }

  if (questionPayload.solution_concept && questionPayload.solution_concept.length) {
    const conceptSummary = joinNarrationLines(questionPayload.solution_concept);
    scenes.push({
      type: 'concept',
      duration: 6,
      content: questionPayload.solution_concept.join('\n'),
      title: '解題概念'
    });
    narrationParts.push(`解題思路重點為：${conceptSummary}。`);
  }

  if (questionPayload.detailed_steps && questionPayload.detailed_steps.length) {
    const stepsSummary = joinNarrationLines(questionPayload.detailed_steps);
    scenes.push({
      type: 'steps',
      duration: Math.min(10, questionPayload.detailed_steps.length * 4),
      content: questionPayload.detailed_steps.join('\n'),
      title: '詳細步驟'
    });
    narrationParts.push(`依照以下步驟完成計算：${stepsSummary}。`);
  }

  if (questionPayload.answer) {
    scenes.push({
      type: 'answer',
      duration: 4,
      content: questionPayload.answer,
      title: '答案'
    });
    narrationParts.push(`因此答案為：${stripHtmlTags(questionPayload.answer)}。`);
  }

  if (!questionPayload.answer) {
    narrationParts.push('讓我們總結以上的步驟，就能完成這一題。');
  }

  return {
    title: `第 ${questionNumber} 題影音詳解`,
    scenes,
    voiceover: narrationParts.join(' ')
  };
}

async function fetchExistingVideoRecord(questionId) {
  const response = await fetch(`/api/question/${questionId}/video`);
  if (!response.ok) {
    throw new Error('查詢影片資料失敗');
  }
  const data = await response.json();
  if (data.exists && data.video) {
    markVideoStatus(questionId, data.video.status || 'ready');
    return data.video;
  }
  markVideoStatus(questionId, null);
  return null;
}

async function initializeVideoStatuses(questions) {
  if (!Array.isArray(questions) || questions.length === 0) {
    return;
  }
  const ids = [...new Set(questions.map(q => q.question_id).filter(Boolean))];
  if (ids.length === 0) {
    return;
  }
  try {
    const response = await fetch('/api/questions/videos/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids })
    });
    if (!response.ok) {
      throw new Error('初始化影片狀態失敗');
    }
    const data = await response.json();
    const records = Array.isArray(data.records) ? data.records : [];
    const existingIds = new Set();
    records.forEach(record => {
      if (!record || !record.question_id) return;
      existingIds.add(record.question_id);
      markVideoStatus(record.question_id, record.status || 'ready');
      if (record.status === 'ready' && (record.video_url || record.videoUrl)) {
        videoCache.set(record.question_id, record);
      }
    });
    ids.forEach(id => {
      if (!existingIds.has(id)) {
        videoStatusMap.delete(id);
        videoCache.delete(id);
      }
    });
  } catch (error) {
    console.warn('初始化題目影片狀態失敗:', error);
  }
}

function applyVideoRecord(record) {
  if (!record) {
    return;
  }
  const questionId = record.question_id || videoModalQuestionId.value;
  if (questionId) {
    videoCache.set(questionId, record);
    markVideoStatus(questionId, 'ready');
  }
  videoUrl.value = record.video_url || record.videoUrl || '';
  videoMeta.value = record;
  videoLoading.value = false;
  videoGenerating.value = false;
  videoProgress.value = '';
}

function resetVideoModalState() {
  videoLoading.value = false;
  videoGenerating.value = false;
  videoProgress.value = '';
  videoError.value = '';
  videoUrl.value = '';
  videoMeta.value = null;
}

function closeVideoModal() {
  showVideoModal.value = false;
  resetVideoModalState();
  videoQuestionNumber.value = null;
  videoModalQuestionId.value = null;
}

// ========== 新增：題目功能按鈕處理函數 ==========

function getVideoButtonLabel(questionId) {
  if (videoGenerationTasks.has(questionId)) {
    return '生成中...';
  }
  const status = videoStatusMap.get(questionId);
  if (status === 'processing') {
    return '生成中...';
  }
  if (status === 'failed') {
    return '重新生成';
  }
  if (videoCache.has(questionId) || status === 'ready') {
    return '查看影音詳解';
  }
  return '生成影音詳解';
}

function markVideoStatus(questionId, status) {
  if (!questionId) return;
  if (status) {
    videoStatusMap.set(questionId, status);
  } else {
    videoStatusMap.delete(questionId);
  }
}

function showProcessingState(questionId, message = '影片生成中，請稍候...') {
  markVideoStatus(questionId, 'processing');
  videoLoading.value = false;
  videoGenerating.value = true;
  videoProgress.value = message;
}

function updateVideoGenerationProgress(questionId, message, state) {
  if (state) {
    state.progressMessage = message;
  }
  const entry = videoGenerationTasks.get(questionId);
  if (entry && entry.state) {
    entry.state.progressMessage = message;
  }
  if (videoModalQuestionId.value === questionId) {
    videoProgress.value = message;
  }
}

async function viewTextSolution(question, questionNumber) {
  await openSolutionModal(question, questionNumber);
}

async function viewVideoSolution(question, questionNumber) {
  resetVideoModalState();
  const questionId = question.question_id;
  videoQuestionNumber.value = questionNumber;
  showVideoModal.value = true;
  videoModalQuestionId.value = questionId;
  videoError.value = '';

  try {
    const cachedStatus = videoStatusMap.get(questionId);
    const cachedVideo = videoCache.get(questionId);
    if (cachedStatus === 'ready' && cachedVideo) {
      applyVideoRecord(cachedVideo);
      return;
    }
    if (cachedStatus === 'processing') {
      showProcessingState(questionId);
      return;
    }

    videoLoading.value = true;
    let existingVideo = null;
    try {
      existingVideo = await fetchExistingVideoRecord(questionId);
    } catch (err) {
      console.warn('查詢題目影片失敗，即將重新生成:', err);
    }

    if (existingVideo) {
      const status = existingVideo.status || 'ready';
      markVideoStatus(questionId, status);
      if (status === 'ready' && (existingVideo.video_url || existingVideo.videoUrl)) {
        applyVideoRecord(existingVideo);
        return;
      }
      if (status === 'processing') {
        showProcessingState(questionId);
        return;
      }
      if (status === 'failed') {
        markVideoStatus(questionId, 'failed');
      }
    }

    videoLoading.value = false;
    videoGenerating.value = true;

    let generationEntry = videoGenerationTasks.get(questionId);
    if (!generationEntry) {
      generationEntry = startVideoGenerationTask(question, questionNumber);
    }

    videoProgress.value = generationEntry.state.progressMessage || '影音詳解生成中...';
    const record = await generationEntry.promise;
    if (record && (record.video_url || record.videoUrl)) {
      applyVideoRecord(record);
    }
  } catch (error) {
    console.error('影音詳解處理失敗:', error);
    if (error?.message?.includes('正在生成')) {
      showProcessingState(questionId, '影片生成中，請稍候...');
    } else {
      markVideoStatus(questionId, 'failed');
      videoError.value = error.message || '影音詳解處理失敗，請稍後再試';
    }
  } finally {
    if (!videoGenerationTasks.has(questionId)) {
      videoGenerating.value = false;
    }
    videoLoading.value = false;
  }
}

function startVideoGenerationTask(question, questionNumber) {
  const questionId = question.question_id;
  const entry = {
    state: { progressMessage: '正在準備題目內容...' },
    promise: null
  };

  videoGenerationTasks.set(questionId, entry);
  markVideoStatus(questionId, 'processing');

  entry.promise = (async () => {
    updateVideoGenerationProgress(questionId, '正在準備題目內容...', entry.state);
    const detail = await fetchQuestionDetail(question);
    const questionPayload = buildQuestionPayload(question, detail);

    updateVideoGenerationProgress(questionId, '正在建立影片腳本...', entry.state);
    const script = buildVideoScript(questionPayload, questionNumber);

    updateVideoGenerationProgress(questionId, '正在生成影音詳解，這可能需要一點時間...', entry.state);
    const response = await fetch('/api/video/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: questionPayload,
        script,
        style: 'simple',
        options: {
          includeAnalysis: Boolean(questionPayload.analysis),
          includeSteps: Boolean(
            (questionPayload.solution_concept && questionPayload.solution_concept.length) ||
            (questionPayload.detailed_steps && questionPayload.detailed_steps.length)
          ),
          includeVoiceover: true,
          enableNarrative: true,
          enableAudio: true
        },
        questionId
      })
    });

    if (response.status === 409) {
      updateVideoGenerationProgress(questionId, '影片生成中，請稍候...', entry.state);
      markVideoStatus(questionId, 'processing');
      throw new Error('影片正在生成中，請稍候再試');
    }

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(errorText || '影音詳解生成失敗');
    }

    const result = await response.json();
    updateVideoGenerationProgress(questionId, '影片生成完成，正在取得最新資料...', entry.state);

    let resolvedVideo = null;
    try {
      resolvedVideo = await fetchExistingVideoRecord(questionId);
    } catch (fetchError) {
      console.warn('重新查詢影片資料失敗，使用 API 回應結果:', fetchError);
    }

    if (!resolvedVideo) {
      resolvedVideo = {
        question_id: questionId,
        video_url: result.videoUrl,
        video_id: result.videoId,
        duration: result.duration,
        style: 'simple',
        status: 'ready',
        created_at: new Date().toISOString()
      };
    }

    return resolvedVideo;
  })();

  entry.promise = entry.promise.then(record => {
    if (record) {
      markVideoStatus(questionId, record.status || 'ready');
    }
    return record;
  });

  entry.promise = entry.promise.catch(error => {
    if (error?.message?.includes('正在生成')) {
      markVideoStatus(questionId, 'processing');
    } else {
      markVideoStatus(questionId, 'failed');
    }
    throw error;
  });

  entry.promise.finally(() => {
    const currentEntry = videoGenerationTasks.get(questionId);
    if (currentEntry === entry) {
      videoGenerationTasks.delete(questionId);
    }
  });

  return entry;
}

async function openSolutionModal(question, questionNumber) {
  solutionQuestionNumber.value = questionNumber;
  showSolutionModal.value = true;
  solutionError.value = '';

  solutionLoading.value = true;
  solutionQuestion.value = null;

  try {
    const detail = await fetchQuestionDetail(question);
    solutionQuestion.value = detail;
  } catch (err) {
    console.error('載入題目詳解失敗:', err);
    solutionError.value = err.message || '載入詳解時發生錯誤';
  } finally {
    solutionLoading.value = false;
  }
}

function closeSolutionModal() {
  showSolutionModal.value = false;
}

// 取得使用者答案代號（顯示括號）
function getAnswerLetterOnly(user_answer, type) {
  if (!user_answer || user_answer.trim() === '') {
    return '未作答';
  }

  if (type === 'single') {
    // 單選題：回傳 (A) 格式
    const letter = user_answer.trim();
    return `(${letter})`;
  } else if (type === 'multiple') {
    // 多選題：回傳 (A), (C) 格式
    const letters = user_answer.split(',').map(a => a.trim()).sort();
    return letters.map(letter => `(${letter})`).join(', ');
  } else if (type === 'fill') {
    // 選填題：顯示完整答案
    return user_answer;
  }

  return user_answer;
}

// 取得正確答案代號（顯示括號）
function getCorrectAnswerLetterOnly(question) {
  const { correct_answer, type, options } = question;

  if (!correct_answer || correct_answer.trim() === '') {
    return '無';
  }

  if (type === 'single') {
    // 單選題：回傳 (B) 格式
    const answerContent = correct_answer.trim();
    const answerIndex = options.findIndex(opt => opt.trim() === answerContent);
    if (answerIndex !== -1) {
      const letter = String.fromCharCode(65 + answerIndex);
      return `(${letter})`;
    }
    return answerContent;
  } else if (type === 'multiple') {
    // 多選題：回傳 (A), (C) 格式
    const correctAnswerContents = correct_answer.split(',').map(a => a.trim());
    const correctAnswerLetters = correctAnswerContents
      .map(content => {
        const answerIndex = options.findIndex(opt => opt.trim() === content);
        return answerIndex !== -1 ? String.fromCharCode(65 + answerIndex) : null;
      })
      .filter(letter => letter !== null)
      .sort();
    return correctAnswerLetters.map(letter => `(${letter})`).join(', ');
  } else if (type === 'fill') {
    // 選填題：顯示完整答案
    return correct_answer;
  }

  return correct_answer;
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

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 16px;
}

.modal-content {
  background: #fff;
  border-radius: 12px;
  max-width: 840px;
  width: min(840px, 96vw);
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 20px 45px rgba(0, 0, 0, 0.15);
}

.solution-modal {
  padding: 0;
}

.video-modal {
  max-width: 960px;
  width: min(960px, 96vw);
  max-height: 95vh;
}

.video-player-wrapper {
  padding: 1.25rem 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.video-player {
  width: 100%;
  max-height: 55vh;
  border-radius: 10px;
  background: #000;
}

.video-meta {
  font-size: 14px;
  color: #4a5568;
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.solution-header {
  padding: 1.25rem 1.5rem 1rem;
  border-bottom: 1px solid #e5e9f0;
}

.solution-header h3 {
  margin: 0;
}

.solution-question-preview {
  padding: 1.25rem 1.5rem;
  border-bottom: 1px solid #f0f2f8;
  background: #fff;
  max-height: 200px;
  overflow-y: auto;
}

.solution-question-preview.placeholder {
  color: #6b7280;
}

.solution-loading,
.solution-error {
  text-align: center;
  color: #4a5568;
  padding: 16px 0;
}

.solution-sections {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.solution-section {
  padding: 1.25rem 1.5rem;
  background: #fff;
}

.solution-section + .solution-section {
  border-top: 1px solid #f0f2f8;
}

.solution-box {
  margin-top: 12px;
  border-radius: 8px;
  border: 1px solid #e4e7ef;
  padding: 12px;
  background: #fafbff;
}

.solution-box + .solution-box {
  margin-top: 12px;
}

.solution-box-title {
  margin: 0 0 8px;
  font-weight: 600;
  color: #3f4a69;
}

.steps-list {
  padding-left: 20px;
  margin: 0;
}

.steps-list li {
  margin-bottom: 8px;
  color: #3b4365;
}

.empty-text {
  margin: 0;
  color: #8a94a7;
  font-size: 14px;
}

.modal-actions {
  display: flex;
  justify-content: flex-end;
  padding: 1rem 1.5rem 1.25rem;
  border-top: 1px solid #f0f2f8;
}

.spinner {
  width: 32px;
  height: 32px;
  margin: 0 auto 12px;
  border: 3px solid #dfe3ef;
  border-top-color: #d67b7b;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}
</style>