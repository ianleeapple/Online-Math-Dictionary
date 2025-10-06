const fs = require('fs');
const path = require('path');
const { GoogleGenerativeAI } = require('@google/generative-ai');

/**
 * 音訊同步管理器
 * 使用 Gemini TTS 生成語音，並分析音訊時間軸以實現文音同步
 */
class AudioSyncManager {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.tempDir = path.join(__dirname, '../temp/audio');
    
    // 確保暫存目錄存在
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }
  }

  /**
   * 生成帶時間軸的音訊檔案
   * @param {Array} narrativeScenes - 旁白場景陣列
   * @returns {Promise<Object>} 音訊檔案資訊和時間軸
   */
  async generateSyncedAudio(narrativeScenes) {
    const audioSegments = [];
    let currentTime = 0;

    for (const scene of narrativeScenes) {
      const sceneAudio = await this.generateSceneAudio(scene, currentTime);
      audioSegments.push(sceneAudio);
      currentTime = sceneAudio.endTime;
    }

    // 合併所有音訊片段
    const mergedAudioPath = await this.mergeAudioSegments(audioSegments);
    
    // 計算實際總時長（所有場景的時長總和）
    const actualDuration = audioSegments.reduce((total, seg) => total + seg.duration, 0);
    
    console.log(`[音訊時長] 各場景時長:`, audioSegments.map(s => `${s.sceneType}: ${s.duration.toFixed(2)}s`).join(', '));
    console.log(`[音訊時長] 總時長: ${actualDuration.toFixed(2)} 秒`);

    // 清理 wavBuffer，避免傳遞給 Remotion 的 props 過大
    const cleanedSegments = audioSegments.map(seg => {
      const { wavBuffer, ...cleanSeg } = seg; // 移除 wavBuffer
      return cleanSeg;
    });

    return {
      audioPath: mergedAudioPath,
      totalDuration: actualDuration,
      scenes: cleanedSegments,  // 使用清理後的 segments
      timeline: cleanedSegments,
      segments: cleanedSegments.map(seg => ({
        sceneType: seg.sceneType,
        startTime: seg.startTime,
        endTime: seg.endTime,
        duration: seg.duration,
        narrative: seg.narrative
      }))
    };
  }

  /**
   * 為單一場景生成音訊
   * @param {Object} scene - 場景資料
   * @param {number} startTime - 起始時間
   * @returns {Promise<Object>} 音訊片段資訊
   */
  async generateSceneAudio(scene, startTime) {
    const { type, narrative, timing } = scene;
    
    console.log(`生成場景音訊: ${type}`);
    console.log(`旁白內容: ${narrative ? narrative.substring(0, 50) : '(空)'}...`);

    // 如果沒有旁白內容，跳過
    if (!narrative || narrative.trim().length === 0) {
      console.log('場景沒有旁白內容，跳過音訊生成');
      return {
        sceneType: type,
        narrative: narrative || '',
        audioPath: null,
        startTime: startTime,
        endTime: startTime + (scene.duration || 3),
        duration: scene.duration || 3,
        timing: timing || { segments: [] }
      };
    }

    // 選擇合適的音色（根據場景類型）
    const voice = this.selectVoiceForScene(type);
    
    try {
      // 生成音訊（Gemini 返回 PCM 格式）
      const pcmBuffer = await this.generateTTS(narrative, voice);
      
      // 將 PCM 轉換為 WAV 格式（加上 WAV header）
      const wavBuffer = this.convertPCMToWAV(pcmBuffer);
      
      // 儲存音訊檔案到 temp 目錄
      const filename = `scene_${type}_${Date.now()}.wav`;
      const audioFilePath = path.join(this.tempDir, filename);
      fs.writeFileSync(audioFilePath, wavBuffer);
      
      // 同時複製到 public/audio 目錄
      const publicDir = path.join(__dirname, '../../public/audio');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      const publicFilePath = path.join(publicDir, filename);
      fs.copyFileSync(audioFilePath, publicFilePath);
      
      console.log('音訊檔案已儲存:', audioFilePath);
      console.log('檔案大小:', (wavBuffer.length / 1024).toFixed(2), 'KB');

      // 分析音訊時長
      const duration = await this.analyzeAudioDuration(audioFilePath);

      return {
        sceneType: type,
        narrative: narrative,
        audioPath: `audio/${filename}`,  // 返回相對路徑（不含前綴 /）
        wavBuffer: wavBuffer,  // 保留 buffer 供合併使用
        startTime: startTime,
        endTime: startTime + duration,
        duration: duration,
        timing: timing || this.estimateTiming(narrative, duration)
      };
    } catch (error) {
      console.error('生成場景音訊失敗:', error);
      // 返回無音訊的場景資訊
      return {
        sceneType: type,
        narrative: narrative,
        audioPath: null,
        startTime: startTime,
        endTime: startTime + (scene.duration || 3),
        duration: scene.duration || 3,
        timing: timing || { segments: [] }
      };
    }
  }

  /**
   * 使用 Gemini TTS 生成語音
   * @param {string} text - 要轉換的文字
   * @param {string} voice - 音色選擇
   * @returns {Promise<Buffer>} 音訊資料
   */
  async generateTTS(text, voice = 'Puck') {
    try {
      // 使用 Gemini 2.5 Flash TTS 模型（正確格式）
      const model = this.genAI.getGenerativeModel({ 
        model: 'gemini-2.5-flash-preview-tts',
        generationConfig: {
          responseModalities: ['AUDIO']  // 關鍵：必須在這裡指定音訊模式
        }
      });

      // 清理 SSML 標記，轉換為自然的停頓
      const cleanText = this.convertSSMLToNaturalText(text);

      console.log(`[Gemini TTS] 生成語音 (${voice}): ${cleanText.substring(0, 50)}...`);

      // 生成語音（Gemini TTS 會回傳 PCM 格式）
      const result = await model.generateContent({
        contents: [{
          role: 'user',
          parts: [{ text: cleanText }]
        }]
      });

      const response = result.response;
      
      // Gemini TTS 回傳音訊內容
      if (!response.candidates || !response.candidates[0]) {
        throw new Error('Gemini TTS 回應格式錯誤');
      }

      const part = response.candidates[0].content?.parts?.[0];
      const audioContent = part?.inlineData?.data;
      const mimeType = part?.inlineData?.mimeType;
      
      if (!audioContent) {
        throw new Error('無法從 Gemini TTS 取得音訊資料');
      }

      console.log('[Gemini TTS] 音訊生成成功');
      console.log('[Gemini TTS] 格式:', mimeType);
      
      // Gemini 回傳 PCM 格式，直接返回 Buffer
      // 注意：這是 audio/L16 (PCM) 格式，需要加 WAV header
      return Buffer.from(audioContent, 'base64');

    } catch (error) {
      console.error('[Gemini TTS] 生成失敗:', error.message);
      
      // 自動回退到 OpenAI TTS
      if (process.env.OPENAI_API_KEY) {
        console.log('[Gemini TTS] 自動回退到 OpenAI TTS');
        const cleanText = this.convertSSMLToNaturalText(text);
        return await this.generateOpenAITTS(cleanText, voice);
      }
      
      console.error('錯誤詳情:', error);
      throw new Error(`Gemini TTS 失敗且沒有 OpenAI 備用: ${error.message}`);
    }
  }

  /**
   * [已棄用] OpenAI TTS 備用方案
   * @param {string} text - 文字
   * @param {string} voice - 音色
   * @returns {Promise<Buffer>} 音訊資料
   */
  async generateOpenAITTS(text, voice) {
    const axios = require('axios');
    
    // 將 Gemini 音色映射到 OpenAI 音色
    const voiceMap = {
      'Puck': 'nova',
      'Charon': 'alloy',
      'Kore': 'shimmer',
      'Fenrir': 'onyx',
      'Aoede': 'echo'
    };

    const openaiVoice = voiceMap[voice] || 'nova';
    const cleanText = this.convertSSMLToNaturalText(text);

    try {
      const response = await axios.post(
        'https://api.openai.com/v1/audio/speech',
        {
          model: 'tts-1',
          input: cleanText,
          voice: openaiVoice,
          speed: 0.95
        },
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`,
            'Content-Type': 'application/json'
          },
          responseType: 'arraybuffer'
        }
      );

      return Buffer.from(response.data);
    } catch (error) {
      console.error('OpenAI TTS 失敗:', error);
      throw error;
    }
  }

  /**
   * 將 PCM 資料轉換為 WAV 格式
   * Gemini TTS 返回 PCM (audio/L16) 格式，需要加上 WAV header
   * @param {Buffer} pcmBuffer - PCM 音訊資料
   * @returns {Buffer} WAV 格式音訊
   */
  convertPCMToWAV(pcmBuffer) {
    // Gemini TTS 規格: 24kHz, 16-bit, Mono
    const sampleRate = 24000;
    const numChannels = 1;
    const bitsPerSample = 16;
    const byteRate = sampleRate * numChannels * bitsPerSample / 8;
    const blockAlign = numChannels * bitsPerSample / 8;
    const dataSize = pcmBuffer.length;
    const fileSize = 36 + dataSize;
    
    // 建立 WAV Header (44 bytes)
    const wavHeader = Buffer.alloc(44);
    
    // RIFF chunk descriptor
    wavHeader.write('RIFF', 0);                           // ChunkID
    wavHeader.writeUInt32LE(fileSize, 4);                 // ChunkSize
    wavHeader.write('WAVE', 8);                           // Format
    
    // fmt sub-chunk
    wavHeader.write('fmt ', 12);                          // Subchunk1ID
    wavHeader.writeUInt32LE(16, 16);                      // Subchunk1Size (PCM = 16)
    wavHeader.writeUInt16LE(1, 20);                       // AudioFormat (PCM = 1)
    wavHeader.writeUInt16LE(numChannels, 22);             // NumChannels
    wavHeader.writeUInt32LE(sampleRate, 24);              // SampleRate
    wavHeader.writeUInt32LE(byteRate, 28);                // ByteRate
    wavHeader.writeUInt16LE(blockAlign, 32);              // BlockAlign
    wavHeader.writeUInt16LE(bitsPerSample, 34);           // BitsPerSample
    
    // data sub-chunk
    wavHeader.write('data', 36);                          // Subchunk2ID
    wavHeader.writeUInt32LE(dataSize, 40);                // Subchunk2Size
    
    // 合併 Header 和 PCM Data
    return Buffer.concat([wavHeader, pcmBuffer]);
  }

  /**
   * 將 SSML 標記轉換為自然的文字停頓
   * @param {string} text - 帶標記的文字
   * @returns {string} 自然文字
   */
  convertSSMLToNaturalText(text) {
    let natural = text;
    
    // <pause/> → 逗號或句號
    natural = natural.replace(/<pause\s*\/>/g, '，');
    natural = natural.replace(/<pause duration=['"]long['"]\s*\/>/g, '。');
    
    // <emphasis> → 保留文字，用符號強調
    natural = natural.replace(/<emphasis>(.*?)<\/emphasis>/g, '「$1」');
    
    // <slow> → 加句號增加停頓
    natural = natural.replace(/<slow>(.*?)<\/slow>/g, '$1。');
    
    return natural;
  }

  /**
   * 根據場景類型選擇音色
   * @param {string} sceneType - 場景類型
   * @returns {string} 音色名稱
   */
  selectVoiceForScene(sceneType) {
    const voiceMap = {
      'intro': 'Puck',      // 開朗活潑
      'analysis': 'Charon', // 沉穩分析
      'concept': 'Kore',    // 溫和解釋
      'steps': 'Charon',    // 條理清晰
      'answer': 'Puck'      // 積極總結
    };
    
    return voiceMap[sceneType] || 'Puck';
  }

  /**
   * 分析音訊時長
   * @param {string} audioPath - 音訊檔案路徑
   * @returns {Promise<number>} 時長（秒）
   */
  async analyzeAudioDuration(audioPath) {
    try {
      // 讀取 WAV 檔案標頭以獲取時長
      const buffer = fs.readFileSync(audioPath);
      
      // WAV 格式：
      // Byte 22-23: Number of channels
      // Byte 24-27: Sample rate
      // Byte 40-43: Data chunk size
      
      const numChannels = buffer.readUInt16LE(22);
      const sampleRate = buffer.readUInt32LE(24);
      const bitsPerSample = buffer.readUInt16LE(34);
      const dataSize = buffer.readUInt32LE(40);
      
      const duration = dataSize / (sampleRate * numChannels * (bitsPerSample / 8));
      
      console.log(`音訊時長: ${duration.toFixed(2)} 秒`);
      return duration;
    } catch (error) {
      console.error('分析音訊時長失敗:', error);
      // 回退到基於文字長度的估算
      return 5.0; // 預設 5 秒
    }
  }

  /**
   * 估算文字的時間分布
   * @param {string} narrative - 旁白文字
   * @param {number} totalDuration - 總時長
   * @returns {Object} 時間分布
   */
  estimateTiming(narrative, totalDuration) {
    // 將文字分割成句子
    const sentences = narrative.split(/[，。！？；]/g).filter(s => s.trim());
    
    const segments = [];
    const avgDuration = totalDuration / sentences.length;
    let currentTime = 0;

    for (const sentence of sentences) {
      if (!sentence.trim()) continue;
      
      // 根據句子長度調整時長
      const charCount = sentence.replace(/<[^>]+>/g, '').length;
      const duration = (charCount / 3.5); // 中文約 3.5 字/秒
      
      segments.push({
        text: sentence.trim(),
        startTime: currentTime,
        endTime: currentTime + duration,
        emphasis: sentence.includes('<emphasis>') ? 'strong' : 'normal',
        speed: sentence.includes('<slow>') ? 'slow' : 'normal'
      });
      
      currentTime += duration;
    }

    return { segments };
  }

  /**
   * 合併多個音訊片段為單一 WAV 檔案
   * @param {Array} audioSegments - 音訊片段陣列
   * @returns {Promise<string>} 合併後的音訊檔案路徑（Data URL）
   */
  async mergeAudioSegments(audioSegments) {
    console.log(`[音訊合併] 收到 ${audioSegments.length} 個音訊片段`);
    
    if (audioSegments.length === 0) {
      throw new Error('沒有音訊片段可合併');
    }

    if (audioSegments.length === 1) {
      console.log('[音訊合併] 只有一個場景，無需合併');
      return audioSegments[0].audioPath;
    }

    console.log(`[音訊合併] 開始合併 ${audioSegments.length} 個音訊片段...`);
    
    // 先檢查所有片段的格式
    for (let i = 0; i < audioSegments.length; i++) {
      const seg = audioSegments[i];
      console.log(`[音訊合併] 片段 ${i + 1}/${audioSegments.length}:`, {
        sceneType: seg.sceneType,
        duration: seg.duration?.toFixed(2) + 's',
        hasAudioPath: !!seg.audioPath,
        audioPathType: seg.audioPath ? (seg.audioPath.startsWith('data:') ? 'Data URL' : 'File Path') : 'None',
        audioPathLength: seg.audioPath ? seg.audioPath.length : 0
      });
    }
    
    try {
      // 收集所有 PCM 資料
      const pcmBuffers = [];
      let totalPCMLength = 0;
      
      for (const segment of audioSegments) {
        if (!segment.wavBuffer) {
          console.warn(`[音訊合併] 跳過無 wavBuffer 的片段: ${segment.sceneType}`);
          continue;
        }
        
        // WAV 檔案格式：44 bytes header + PCM data
        // 跳過 WAV header，只取 PCM 資料
        const pcmData = segment.wavBuffer.slice(44);
        pcmBuffers.push(pcmData);
        totalPCMLength += pcmData.length;
        
        console.log(`[音訊合併] 場景 ${segment.sceneType}: ${(pcmData.length / 1024).toFixed(2)} KB, ${segment.duration.toFixed(2)}s`);
      }
      
      if (pcmBuffers.length === 0) {
        throw new Error('沒有有效的音訊資料');
      }
      
      // 合併所有 PCM 資料
      const mergedPCM = Buffer.concat(pcmBuffers, totalPCMLength);
      console.log(`[音訊合併] 合併後 PCM 大小: ${(mergedPCM.length / 1024).toFixed(2)} KB`);
      
      // 加上新的 WAV header
      const mergedWAV = this.convertPCMToWAV(mergedPCM);
      
      // 儲存合併後的檔案到 temp 目錄
      const mergedFilename = `merged_audio_${Date.now()}.wav`;
      const mergedFilePath = path.join(this.tempDir, mergedFilename);
      fs.writeFileSync(mergedFilePath, mergedWAV);
      
      console.log(`[音訊合併] 完成！檔案: ${mergedFilePath}`);
      console.log(`[音訊合併] 總大小: ${(mergedWAV.length / 1024 / 1024).toFixed(2)} MB`);
      
      // 複製到 public/audio 目錄，讓 Remotion 可以透過相對路徑存取
      const publicDir = path.join(__dirname, '../../public/audio');
      if (!fs.existsSync(publicDir)) {
        fs.mkdirSync(publicDir, { recursive: true });
      }
      const publicFilePath = path.join(publicDir, mergedFilename);
      fs.copyFileSync(mergedFilePath, publicFilePath);
      console.log(`[音訊合併] 已複製到 public 目錄: audio/${mergedFilename}`);
      
      // 返回相對於 public 目錄的路徑（不含前綴 /，供 staticFile() 使用）
      return `audio/${mergedFilename}`;
      
    } catch (error) {
      console.error('[音訊合併] 失敗:', error.message);
      console.log('[音訊合併] 回退到使用第一個場景');
      return audioSegments[0].audioPath;
    }
  }
}

module.exports = AudioSyncManager;
