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

    <!-- ======================================================== -->
    <!-- TTS 語音生成測試區塊 -->
    <!-- ======================================================== -->
    <div class="card tts-card">
      <h3>語音生成測試 (TTS)</h3>
      <div class="form-group">
        <label>要轉換的文字</label>
        <textarea v-model="ttsText" rows="3" placeholder="輸入文字來生成語音，例如：將上方生成的題目轉為語音"></textarea>
      </div>
      <div class="form-group">
        <label>選擇聲音</label>
        <select v-model="ttsVoice">
          <option value="alloy">Alloy (中性，適合中文)</option>
          <option value="nova">Nova (女性，推薦用於中文)</option>
          <option value="shimmer">Shimmer (溫和，適合教學)</option>
          <option value="echo">Echo (男性)</option>
          <option value="fable">Fable (英式)</option>
          <option value="onyx">Onyx (深沉)</option>
        </select>
      </div>
      <div class="button-row">
        <button @click="generateSpeech" :disabled="isTtsLoading" class="primary-button">
          {{ isTtsLoading ? '生成中...' : '生成並播放語音' }}
        </button>
        <button @click="copyQuestionToTts" class="secondary-button" v-if="generatedQuestions.length > 0">
          複製第一題到語音區
        </button>
      </div>
      <div v-if="isTtsLoading" class="loading-indicator">
        <div class="spinner"></div>
        <p>正在生成語音，請稍候...</p>
      </div>
      <div v-if="hasAudio" class="audio-section">
        <audio ref="audioPlayer" controls class="audio-player"></audio>
        <div class="audio-controls">
          <button @click="playAudio" class="secondary-button">▶️ 播放</button>
          <button @click="pauseAudio" class="secondary-button">⏸️ 暫停</button>
          <button @click="downloadAudio" class="secondary-button">💾 下載</button>
        </div>
      </div>
    </div>

    <!-- ======================================================== -->
    <!-- 影片生成區塊 -->
    <!-- ======================================================== -->
    <div class="card video-card" v-if="generatedQuestions.length > 0">
      <h3>🎬 AI 影片生成 (實驗功能)</h3>
      <div class="form-group">
        <label>選擇要製作影片的題目</label>
        <select v-model="selectedQuestionIndex">
          <option v-for="(question, index) in generatedQuestions" :key="index" :value="index">
            題目 {{ index + 1 }}: {{ question.question.substring(0, 50) }}...
          </option>
        </select>
      </div>
      <div class="form-group">
        <label>影片樣式</label>
        <select v-model="videoStyle">
          <option value="simple">簡潔風格 (純文字)</option>
          <option value="animated">動畫風格 (逐步顯示)</option>
          <option value="whiteboard">白板風格 (手寫效果)</option>
        </select>
      </div>
      <div class="form-group">
        <label>影片長度控制</label>
        <div class="checkbox-group">
          <label><input type="checkbox" v-model="includeAnalysis"> 包含概念解析</label>
          <label><input type="checkbox" v-model="includeSteps"> 包含詳細步驟</label>
          <label><input type="checkbox" v-model="includeVoiceover"> 包含語音旁白</label>
        </div>
      </div>
      <div class="button-row">
        <button @click="generateVideo" :disabled="isVideoLoading" class="primary-button">
          {{ isVideoLoading ? '生成中...' : '🎬 生成解題影片' }}
        </button>
        <button @click="previewScript" class="secondary-button">
          📝 預覽影片腳本
        </button>
      </div>
      <div v-if="isVideoLoading" class="loading-indicator">
        <div class="spinner"></div>
        <p>{{ videoProgress }}</p>
      </div>
      <div v-if="generatedVideoUrl" class="video-result">
        <h4>✅ 影片生成完成！</h4>
        <div class="test-notice">
          <p>📝 <strong>測試版本說明：</strong></p>
          <p>• 目前顯示的是示例影片，實際影片生成功能開發中</p>
          <p>• 未來將整合 Remotion 生成真實的數學解題影片</p>
          <p>• 將包含數學公式渲染、動畫效果、語音同步等功能</p>
        </div>
        <video :src="generatedVideoUrl" controls class="generated-video"></video>
        <div class="video-controls">
          <button @click="downloadVideo" class="secondary-button">💾 下載影片</button>
          <button @click="shareVideo" class="secondary-button">🔗 分享連結</button>
          <button @click="resetVideo" class="secondary-button">🔄 重新生成</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, reactive, nextTick } from 'vue';

const sourceQuestion = ref('');
const questionType = ref('填充題');
const difficulty = ref('medium');
const count = ref('3');
const optionsTemplate = ref('');
const constraints = ref('');
const isLoading = ref(false);
const generatedQuestions = ref([]);
const showSolutionMap = reactive({});

// TTS 相關變數  
const ttsText = ref('歡迎使用線上數學辭典！今天我們要學習二次方程式的解法。首先，來看一個簡單例子：x 的平方，加上 2x，減去 3，等於 0。我們可以使用因式分解法來求解。');
const ttsVoice = ref('nova');
const isTtsLoading = ref(false);
const audioPlayer = ref(null);
const hasAudio = ref(false);

// 影片生成相關變數
const selectedQuestionIndex = ref(0);
const videoStyle = ref('simple');
const includeAnalysis = ref(true);
const includeSteps = ref(true);
const includeVoiceover = ref(true);
const isVideoLoading = ref(false);
const videoProgress = ref('準備開始...');
const generatedVideoUrl = ref('');

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

// TTS 相關方法
const generateSpeech = async () => {
  if (!ttsText.value.trim()) {
    alert('請輸入要轉換的文字');
    return;
  }
  
  console.log('開始生成語音，文字:', ttsText.value.substring(0, 50) + '...', '語音:', ttsVoice.value);
  isTtsLoading.value = true;
  
  try {
    const response = await fetch('/api/tts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: ttsText.value,
        voice: ttsVoice.value,
      }),
    });

    console.log('API 回應狀態:', response.status);

    if (!response.ok) {
      // 嘗試解析錯誤訊息
      let errorMessage = `HTTP ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.error || errorMessage;
        if (errorData.details) {
          errorMessage += `: ${errorData.details}`;
        }
      } catch (e) {
        // 如果無法解析 JSON，使用預設訊息
        console.error('無法解析錯誤回應:', e);
      }
      throw new Error(`語音生成失敗: ${errorMessage}`);
    }

    console.log('開始處理音訊資料');
    const blob = await response.blob();
    
    if (blob.size === 0) {
      throw new Error('收到空的音訊檔案');
    }
    
    console.log('音訊檔案大小:', blob.size, 'bytes');
    console.log('音訊檔案類型:', blob.type);
    
    // 確保 blob 類型正確
    const audioBlob = new Blob([blob], { type: 'audio/mpeg' });
    const audioUrl = URL.createObjectURL(audioBlob);
    console.log('生成的音訊 URL:', audioUrl);

    // 先顯示播放器
    hasAudio.value = true;
    
    // 等待 DOM 更新後再設定音訊
    await nextTick();
    
    if (audioPlayer.value) {
      // 設定音訊來源
      audioPlayer.value.src = audioUrl;
      console.log('音訊來源已設定:', audioUrl);
      
      // 添加詳細的事件監聽
      audioPlayer.value.onloadstart = () => {
        console.log('開始載入音訊');
      };
      
      audioPlayer.value.onloadeddata = () => {
        console.log('音訊資料已載入');
      };
      
      audioPlayer.value.oncanplay = () => {
        console.log('音訊已準備好播放');
      };
      
      audioPlayer.value.oncanplaythrough = () => {
        console.log('音訊可以完整播放');
      };
      
      audioPlayer.value.onerror = (e) => {
        console.error('音訊播放錯誤:', e);
        console.error('錯誤詳情:', audioPlayer.value.error);
        alert(`音訊播放失敗: ${audioPlayer.value.error ? audioPlayer.value.error.message : '未知錯誤'}`);
      };
      
      audioPlayer.value.onplay = () => {
        console.log('音訊開始播放');
      };
      
      audioPlayer.value.onpause = () => {
        console.log('音訊暫停');
      };
      
      // 載入音訊
      audioPlayer.value.load();
      
      // 使用 Promise 等待音訊載入完成
      const playAudio = () => {
        return new Promise((resolve, reject) => {
          const attemptPlay = () => {
            if (audioPlayer.value.readyState >= 3) { // HAVE_FUTURE_DATA
              audioPlayer.value.play()
                .then(() => {
                  console.log('音訊播放成功');
                  resolve();
                })
                .catch(e => {
                  console.error('播放失敗:', e);
                  // 如果自動播放失敗，顯示提示訊息
                  alert('音訊已載入完成！由於瀏覽器安全政策，請手動點擊播放按鈕開始播放。');
                  reject(e);
                });
            } else {
              // 如果還沒準備好，等待一下再試
              setTimeout(attemptPlay, 100);
            }
          };
          attemptPlay();
        });
      };
      
      // 嘗試播放
      playAudio().catch(() => {
        // 播放失敗時的處理已在上面完成
      });
    } else {
      console.error('audioPlayer.value 是 null');
    }
  } catch (error) {
    console.error('語音生成錯誤:', error);
    alert(`錯誤: ${error.message}`);
  } finally {
    isTtsLoading.value = false;
  }
};

const copyQuestionToTts = () => {
  if (generatedQuestions.value.length > 0) {
    const firstQuestion = generatedQuestions.value[0];
    let content = `題目：${firstQuestion.question}。`;
    if (firstQuestion.answer) {
      content += ` 答案：${firstQuestion.answer}。`;
    }
    if (firstQuestion.analysis) {
      content += ` 解析：${firstQuestion.analysis}`;
    }
    ttsText.value = content;
  }
};

// 音訊控制功能
const playAudio = () => {
  if (audioPlayer.value) {
    audioPlayer.value.play().then(() => {
      console.log('手動播放成功');
    }).catch(e => {
      console.error('手動播放失敗:', e);
      alert('播放失敗，請檢查音訊檔案');
    });
  }
};

const pauseAudio = () => {
  if (audioPlayer.value) {
    audioPlayer.value.pause();
    console.log('音訊已暫停');
  }
};

const downloadAudio = () => {
  if (audioPlayer.value && audioPlayer.value.src) {
    const a = document.createElement('a');
    a.href = audioPlayer.value.src;
    a.download = 'generated_speech.mp3';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    console.log('開始下載音訊檔案');
  }
};

// 影片生成相關方法
const generateVideo = async () => {
  if (generatedQuestions.value.length === 0) {
    alert('請先生成題目');
    return;
  }
  
  const selectedQuestion = generatedQuestions.value[selectedQuestionIndex.value];
  isVideoLoading.value = true;
  videoProgress.value = '正在生成影片腳本...';
  
  try {
    // 1. 生成影片腳本
    const script = await generateVideoScript(selectedQuestion);
    console.log('影片腳本生成完成:', script);
    
    videoProgress.value = '正在生成語音旁白...';
    
    // 2. 生成語音 (如果需要)
    let audioUrl = null;
    if (includeVoiceover.value) {
      audioUrl = await generateVideoAudio(script.voiceover);
      console.log('語音生成完成');
    }
    
    videoProgress.value = '正在渲染影片...';
    
    // 3. 呼叫後端影片生成 API
    const response = await fetch('/api/video/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        question: selectedQuestion,
        script: script,
        audioUrl: audioUrl,
        style: videoStyle.value,
        options: {
          includeAnalysis: includeAnalysis.value,
          includeSteps: includeSteps.value,
          includeVoiceover: includeVoiceover.value
        }
      })
    });
    
    if (!response.ok) {
      throw new Error(`影片生成失敗: ${response.status}`);
    }
    
    const result = await response.json();
    generatedVideoUrl.value = result.videoUrl;
    videoProgress.value = '影片生成完成！';
    
    console.log('影片生成成功:', result.videoUrl);
    
  } catch (error) {
    console.error('影片生成錯誤:', error);
    alert(`影片生成失敗: ${error.message}`);
  } finally {
    isVideoLoading.value = false;
  }
};

const generateVideoScript = async (question) => {
  // 將題目資料轉換為影片腳本
  const script = {
    title: `解題教學：${question.question.substring(0, 30)}...`,
    scenes: [],
    voiceover: ''
  };
  
  // 場景 1: 題目介紹
  script.scenes.push({
    type: 'question',
    duration: 3,
    content: question.question,
    title: '題目'
  });
  
  // 場景 2: 概念解析 (如果包含)
  if (includeAnalysis.value && question.analysis) {
    script.scenes.push({
      type: 'analysis',
      duration: 4,
      content: question.analysis,
      title: '概念解析'
    });
  }
  
  // 場景 3: 解題步驟 (如果包含)
  if (includeSteps.value && question.solution_concept) {
    script.scenes.push({
      type: 'concept',
      duration: 5,
      content: question.solution_concept.join('\n'),
      title: '解題概念'
    });
  }
  
  if (includeSteps.value && question.detailed_steps) {
    script.scenes.push({
      type: 'steps',
      duration: 8,
      content: question.detailed_steps.join('\n'),
      title: '詳細步驟'
    });
  }
  
  // 場景 4: 答案
  script.scenes.push({
    type: 'answer',
    duration: 2,
    content: question.answer,
    title: '答案'
  });
  
  // 生成旁白文字
  if (includeVoiceover.value) {
    let voiceoverText = `現在來解這道題目：${question.question}。`;
    
    if (includeAnalysis.value && question.analysis) {
      voiceoverText += `首先我們來分析一下，${question.analysis}。`;
    }
    
    if (includeSteps.value && question.solution_concept) {
      voiceoverText += `解題的關鍵概念是：${question.solution_concept.join('，')}。`;
    }
    
    if (includeSteps.value && question.detailed_steps) {
      voiceoverText += `讓我們逐步來解：${question.detailed_steps.join('。接下來，')}。`;
    }
    
    voiceoverText += `因此，答案是 ${question.answer}。`;
    
    script.voiceover = voiceoverText;
  }
  
  return script;
};

const generateVideoAudio = async (text) => {
  try {
    const response = await fetch('/api/tts/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text,
        voice: ttsVoice.value,
      }),
    });
    
    if (!response.ok) {
      throw new Error('語音生成失敗');
    }
    
    const blob = await response.blob();
    return URL.createObjectURL(blob);
  } catch (error) {
    console.error('語音生成錯誤:', error);
    throw error;
  }
};

const previewScript = async () => {
  if (generatedQuestions.value.length === 0) {
    alert('請先生成題目');
    return;
  }
  
  const selectedQuestion = generatedQuestions.value[selectedQuestionIndex.value];
  const script = await generateVideoScript(selectedQuestion);
  
  let preview = `=== 影片腳本預覽 ===\n\n`;
  preview += `標題: ${script.title}\n\n`;
  
  script.scenes.forEach((scene, index) => {
    preview += `場景 ${index + 1}: ${scene.title} (${scene.duration}秒)\n`;
    preview += `${scene.content}\n\n`;
  });
  
  if (script.voiceover) {
    preview += `=== 旁白內容 ===\n${script.voiceover}`;
  }
  
  alert(preview);
};

const downloadVideo = () => {
  if (generatedVideoUrl.value) {
    const a = document.createElement('a');
    a.href = generatedVideoUrl.value;
    a.download = `math_solution_${Date.now()}.mp4`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }
};

const shareVideo = () => {
  if (generatedVideoUrl.value) {
    navigator.clipboard.writeText(generatedVideoUrl.value).then(() => {
      alert('影片連結已複製到剪貼簿！');
    }).catch(() => {
      alert(`影片連結：${generatedVideoUrl.value}`);
    });
  }
};

const resetVideo = () => {
  generatedVideoUrl.value = '';
  videoProgress.value = '準備開始...';
};
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

/* TTS 相關樣式 */
.tts-card { margin-top: 30px; border-top: 3px solid #2a6ab3; }
.tts-card h3 { color: #2a6ab3; margin-bottom: 20px; }
.audio-section { margin-top: 15px; padding: 15px; background-color: #f8f9fa; border-radius: 8px; border: 1px solid #e9ecef; }
.audio-player { width: 100%; margin-bottom: 10px; border-radius: 4px; }
.audio-controls { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; }
.audio-controls button { padding: 8px 16px; font-size: 14px; }

/* 影片生成相關樣式 */
.video-card { margin-top: 30px; border-top: 3px solid #8B5CF6; }
.video-card h3 { color: #8B5CF6; margin-bottom: 20px; }
.checkbox-group { display: flex; gap: 15px; flex-wrap: wrap; }
.checkbox-group label { display: flex; align-items: center; gap: 5px; font-size: 14px; }
.video-result { margin-top: 20px; padding: 20px; background-color: #f0f8ff; border-radius: 8px; border: 1px solid #8B5CF6; }
.generated-video { width: 100%; max-width: 600px; border-radius: 8px; margin: 15px 0; }
.video-controls { display: flex; gap: 10px; justify-content: center; flex-wrap: wrap; margin-top: 15px; }
.test-notice { background-color: #fff3cd; border: 1px solid #ffeaa7; border-radius: 8px; padding: 15px; margin-bottom: 15px; }
.test-notice p { margin: 5px 0; font-size: 14px; color: #856404; }
</style>
