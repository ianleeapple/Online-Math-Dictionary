const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');
const NarrativeScriptGenerator = require('./NarrativeScriptGenerator');
const AudioSyncManager = require('./AudioSyncManager');

/**
 * 數學解題影片生成器
 * 使用 Remotion 生成包含數學公式、動畫和語音的教學影片
 * 支援智能教學旁白和文音同步
 */
class VideoGenerator {
  constructor() {
    this.outputDir = path.join(__dirname, '../output/videos');
    this.tempDir = path.join(__dirname, '../temp');
    
    // 確保輸出目錄存在
    if (!fs.existsSync(this.outputDir)) {
      fs.mkdirSync(this.outputDir, { recursive: true });
    }
    if (!fs.existsSync(this.tempDir)) {
      fs.mkdirSync(this.tempDir, { recursive: true });
    }

    // 初始化 AI 旁白生成器和音訊同步管理器
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      this.narrativeGenerator = new NarrativeScriptGenerator(apiKey);
      this.audioSyncManager = new AudioSyncManager(apiKey);
    } else {
      console.warn('未設定 GEMINI_API_KEY，將使用基本模式');
    }
  }

  /**
   * 生成數學解題影片（帶智能教學旁白）
   * @param {Object} question - 題目資料
   * @param {Object} script - 影片腳本
   * @param {string} audioUrl - 語音檔案 URL (可選)
   * @param {string} style - 影片樣式
   * @param {Object} options - 其他選項
   * @returns {Promise<string>} 生成的影片檔案路徑
   */
  async generateMathVideo(question, script, style = 'simple', options = {}) {
    try {
      console.log('開始生成數學解題影片（智能教學模式）...');
      console.log('題目:', question.question);
      console.log('樣式:', style);
      
      // ===== 步驟 1: AI 生成教學旁白腳本 =====
      let narrativeScript = script;
      let audioTimeline = null;

      if (this.narrativeGenerator && options.enableNarrative !== false) {
        console.log('[AI] 生成智能教學旁白腳本...');
        try {
          narrativeScript = await this.narrativeGenerator.generateNarrative(script);
          console.log('[完成] 旁白腳本生成完成');
          console.log('場景數量:', narrativeScript.scenes.length);
          console.log('預估總時長:', narrativeScript.totalDuration, '秒');
        } catch (error) {
          console.warn('[警告] 旁白腳本生成失敗，使用原始腳本:', error.message);
          
          // 回退策略：使用 script.voiceover 作為完整旁白
          // 將其平均分配到各場景，或使用場景自帶的內容
          const totalScenes = script.scenes.length;
          const voiceoverText = script.voiceover || '';
          
          narrativeScript = {
            ...script,
            scenes: script.scenes.map((scene, index) => {
              // 優先順序：scene.narrative > scene.content > scene.visualContent > 分配 voiceover 的一部分
              let sceneNarrative = scene.narrative || 
                                   scene.content || 
                                   scene.visualContent;
              
              // 如果場景沒有任何內容，嘗試從 voiceover 中提取對應部分
              if (!sceneNarrative && voiceoverText) {
                // 簡單策略：將 voiceover 按場景數量分段
                const avgLength = Math.floor(voiceoverText.length / totalScenes);
                const start = index * avgLength;
                const end = index === totalScenes - 1 ? voiceoverText.length : (index + 1) * avgLength;
                sceneNarrative = voiceoverText.substring(start, end).trim();
              }
              
              return {
                ...scene,
                narrative: sceneNarrative || `場景 ${scene.type}`,
                duration: scene.duration || 5
              };
            })
          };
          
          console.log('[回退] 已為', narrativeScript.scenes.length, '個場景添加旁白內容');
          console.log('[回退] 第一個場景旁白前 100 字:', narrativeScript.scenes[0].narrative?.substring(0, 100));
        }
      }

      // ===== 步驟 2: 生成語音並分析時間軸 =====
      console.log('[除錯] audioSyncManager 存在:', !!this.audioSyncManager);
      console.log('[除錯] narrativeScript.scenes 存在:', !!narrativeScript.scenes);
      console.log('[除錯] options.enableAudio:', options.enableAudio);
      
      if (this.audioSyncManager && narrativeScript.scenes && options.enableAudio !== false) {
        console.log('[TTS] 生成同步語音...');
        try {
          audioTimeline = await this.audioSyncManager.generateSyncedAudio(narrativeScript.scenes);
          console.log('[完成] 語音生成完成');
          console.log('音訊時長:', audioTimeline.totalDuration.toFixed(2), '秒');
          console.log('音訊檔案:', audioTimeline.audioPath ? '已生成' : '無');
          
          // ===== 重要：使用音訊的實際時長更新場景時長 =====
          if (audioTimeline.scenes && audioTimeline.scenes.length > 0) {
            console.log('[同步] 更新場景時長為音訊實際時長...');
            narrativeScript.scenes = narrativeScript.scenes.map((scene, index) => {
              const audioScene = audioTimeline.scenes[index];
              if (audioScene) {
                console.log(`  - ${scene.type}: ${scene.duration || 'N/A'}s → ${audioScene.duration.toFixed(2)}s`);
                return {
                  ...scene,
                  duration: audioScene.duration,      // 使用音訊實際時長
                  startTime: audioScene.startTime,    // 音訊開始時間
                  endTime: audioScene.endTime         // 音訊結束時間
                };
              }
              return scene;
            });
            console.log('[同步] 場景時長已同步至音訊時長');
          }
        } catch (error) {
          console.error('[錯誤] 語音生成失敗:', error.message);
          console.error('[錯誤] 堆疊:', error.stack);
        }
      } else {
        console.warn('[警告] 跳過音訊生成');
        console.warn('  - audioSyncManager:', !!this.audioSyncManager);
        console.warn('  - scenes:', !!narrativeScript.scenes);
        console.warn('  - enableAudio:', options.enableAudio);
      }

      // ===== 步驟 3: 創建影片輸入資料 =====
      const totalDuration = audioTimeline 
        ? audioTimeline.totalDuration 
        : this.calculateDuration(narrativeScript);

      const videoInputProps = {
        question,
        script: narrativeScript,
        audioTimeline: audioTimeline,
        style,
        options,
        // 影片配置
        width: options.width || 1920,
        height: options.height || 1080,
        fps: options.fps || 30,
        durationInFrames: Math.ceil(totalDuration * (options.fps || 30)) // 總時長(秒) * FPS
      };

      console.log('影片配置:', {
        寬度: videoInputProps.width,
        高度: videoInputProps.height,
        FPS: videoInputProps.fps,
        總幀數: videoInputProps.durationInFrames,
        時長: (videoInputProps.durationInFrames / videoInputProps.fps).toFixed(2) + '秒'
      });


      // 2. 打包 Remotion 專案
      console.log('[打包] 正在打包影片組件...');
      const bundleLocation = await bundle({
        entryPoint: path.join(__dirname, 'components/index.js'),
        // 指定 public 目錄位置（專案根目錄的 public）
        publicDir: path.join(__dirname, '../../public'),
        // 簡化 webpack 配置，避免 CSS 加載問題
        webpackOverride: (config) => {
          // 移除可能衝突的 CSS 規則
          config.module.rules = config.module.rules.filter(rule => {
            if (rule.test && rule.test.toString().includes('css')) {
              return false;
            }
            return true;
          });
          
          // 添加簡單的 CSS 處理規則
          config.module.rules.push({
            test: /\.css$/,
            use: [
              'style-loader',
              {
                loader: 'css-loader',
                options: {
                  importLoaders: 0,
                  sourceMap: false,
                  modules: false,
                  url: false,
                  import: false,
                },
              },
            ],
          });
          
          return config;
        },
      });
      console.log('[完成] 打包完成');

      // 3. 選擇組合 (Composition)
      console.log('[組合] 選擇影片組合...');
      console.log('[組合] inputProps 大小:', JSON.stringify(videoInputProps).length, '字元');
      
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: 'MathVideoComposition',
        inputProps: videoInputProps,
        // 為 selectComposition 也添加 Chrome 設定
        chromiumOptions: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--max-old-space-size=4096',
          ],
        },
        timeoutInMilliseconds: 120000, // 2 分鐘超時
      });
      console.log('[完成] 組合選擇完成');
      console.log('[組合] 影片時長:', composition.durationInFrames / composition.fps, '秒');

      // 4. 生成影片檔案名稱和 ID
      const timestamp = Date.now();
      const videoId = `math_video_${timestamp}`;
      const outputPath = path.join(this.outputDir, `${videoId}.mp4`);

      // 5. 渲染影片
      console.log('[渲染] 正在渲染影片...');
      console.log('輸出路徑:', outputPath);
      await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps: videoInputProps,
        // 並行渲染以提升速度（降低以減少記憶體壓力）
        concurrency: 2,
        // 品質設定（降低以減少記憶體使用）
        crf: 23,
        // Chrome 設定：增加記憶體和超時限制
        chromiumOptions: {
          headless: true,
          args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-dev-shm-usage',
            '--disable-accelerated-2d-canvas',
            '--disable-gpu',
            '--max-old-space-size=4096',
          ],
        },
        // 超時設定：10 分鐘（359秒影片需要更長時間）
        timeoutInMilliseconds: 600000,
        // 進度回調 - 每秒更新一次（節流）+ 顯示計時器
        onProgress: (() => {
          let lastUpdate = 0;
          let isFirstRender = true;
          const startTime = Date.now();  // 記錄開始時間
          
          return ({ progress, renderedFrames, encodedFrames }) => {
            const now = Date.now();
            
            // 每秒最多更新一次（或進度達到 100% 時強制更新）
            if (now - lastUpdate >= 1000 || progress === 1) {
              lastUpdate = now;
              
              // 計算已經過的時間
              const elapsedSeconds = Math.floor((now - startTime) / 1000);
              const minutes = Math.floor(elapsedSeconds / 60);
              const seconds = elapsedSeconds % 60;
              const timeStr = `${minutes}:${seconds.toString().padStart(2, '0')}`;
              
              const percentage = (progress * 100).toFixed(1);
              const progressBar = '█'.repeat(Math.floor(progress * 30)) + '░'.repeat(30 - Math.floor(progress * 30));
              
              // 如果不是第一次渲染，清除前 5 行並向上移動（增加一行顯示時間）
              if (!isFirstRender) {
                process.stdout.write('\x1b[5A\x1b[0J');  // 向上移動 5 行並清除到末尾
              } else {
                isFirstRender = false;
              }
              
              // 輸出新的進度資訊（多行格式）
              console.log(`🎬 渲染進度: [${progressBar}] ${percentage}%`);
              console.log(`已渲染: ${renderedFrames || 0} 幀`);
              console.log(`已編碼: ${encodedFrames || 0} 幀`);
              console.log(`⏱️  已耗時: ${timeStr}`);
              console.log('');  // 空行分隔
            }
          };
        })(),
      });

      console.log('影片渲染完成:', outputPath);
      
      // 6. 獲取檔案資訊並返回結果
      const stats = fs.existsSync(outputPath) ? fs.statSync(outputPath) : null;
      const videoUrl = this.getPublicVideoUrl(videoId);
      
      return {
        videoId,
        videoUrl,
        outputPath,
        duration: this.calculateDuration(script),
        size: stats ? stats.size : 0,
        status: 'completed'
      };

    } catch (error) {
      console.error('影片生成失敗:', error);
      throw new Error(`影片生成失敗: ${error.message}`);
    }
  }

  /**
   * 計算影片總時長
   * @param {Object} script - 影片腳本
   * @returns {number} 總時長(秒)
   */
  calculateDuration(script) {
    if (!script.scenes || script.scenes.length === 0) {
      return 10; // 預設 10 秒
    }
    
    return script.scenes.reduce((total, scene) => {
      return total + (scene.duration || 3);
    }, 0);
  }

  /**
   * 清理暫存檔案
   * @param {string} videoPath - 影片檔案路徑
   */
  async cleanupTempFiles(videoPath) {
    try {
      // 可以在這裡清理打包後的暫存檔案
      console.log('清理暫存檔案完成');
    } catch (error) {
      console.warn('清理暫存檔案失敗:', error);
    }
  }

  /**
   * 獲取影片檔案的公開 URL
   * @param {string} videoId - 影片 ID (不含副檔名)
   * @returns {string} 公開 URL
   */
  getPublicVideoUrl(videoId) {
    // 返回可以通過 API 訪問的 URL
    return `/api/video/file/${videoId}`;
  }
}

module.exports = VideoGenerator;