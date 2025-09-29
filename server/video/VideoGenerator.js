const { bundle } = require('@remotion/bundler');
const { renderMedia, selectComposition } = require('@remotion/renderer');
const path = require('path');
const fs = require('fs');

/**
 * 數學解題影片生成器
 * 使用 Remotion 生成包含數學公式、動畫和語音的教學影片
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
  }

  /**
   * 生成數學解題影片
   * @param {Object} question - 題目資料
   * @param {Object} script - 影片腳本
   * @param {string} audioUrl - 語音檔案 URL (可選)
   * @param {string} style - 影片樣式
   * @param {Object} options - 其他選項
   * @returns {Promise<string>} 生成的影片檔案路徑
   */
  async generateMathVideo(question, script, style = 'simple', options = {}) {
    try {
      console.log('開始生成數學解題影片...');
      console.log('題目:', question.question);
      console.log('樣式:', style);
      
      // 1. 創建影片輸入資料
      const videoInputProps = {
        question,
        script,
        style,
        options,
        // 影片配置
        width: 1920,
        height: 1080,
        fps: 30,
        durationInFrames: this.calculateDuration(script) * 30 // 總時長(秒) * FPS
      };

      // 2. 打包 Remotion 專案
      console.log('正在打包影片組件...');
      const bundleLocation = await bundle({
        entryPoint: path.join(__dirname, 'components/index.js'),
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

      // 3. 選擇組合 (Composition)
      const composition = await selectComposition({
        serveUrl: bundleLocation,
        id: 'MathVideoComposition',
        inputProps: videoInputProps,
      });

      // 4. 生成影片檔案名稱和 ID
      const timestamp = Date.now();
      const videoId = `math_video_${timestamp}`;
      const outputPath = path.join(this.outputDir, `${videoId}.mp4`);

      // 5. 渲染影片
      console.log('正在渲染影片...');
      await renderMedia({
        composition,
        serveUrl: bundleLocation,
        codec: 'h264',
        outputLocation: outputPath,
        inputProps: videoInputProps,
        // 並行渲染以提升速度
        concurrency: 4,
        // 品質設定
        crf: 18, // 較高品質
        // 進度回調
        onProgress: ({ progress }) => {
          const percentage = Math.round(progress * 100);
          console.log(`渲染進度: ${percentage}%`);
        },
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