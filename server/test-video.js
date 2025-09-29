// 測試 VideoGenerator 的簡單腳本
const VideoGenerator = require('./video/VideoGenerator');

async function testVideoGeneration() {
  console.log('開始測試影片生成...');
  
  const videoGenerator = new VideoGenerator();
  
  const testQuestion = {
    question: '計算 2 + 2 = ?',
    answer: '4',
    analysis: '這是一個簡單的加法題目',
    solution_concept: ['基本加法運算'],
    detailed_steps: ['將兩個數字相加', '2 + 2 = 4']
  };
  
  const testScript = {
    title: '測試影片',
    scenes: [
      {
        type: 'question',
        title: '題目',
        content: '計算 2 + 2 = ?',
        duration: 3
      },
      {
        type: 'answer',
        title: '答案',
        content: '2 + 2 = 4',
        duration: 2
      }
    ]
  };
  
  try {
    const result = await videoGenerator.generateMathVideo(
      testQuestion, 
      testScript, 
      'simple', 
      {}
    );
    
    console.log('測試成功！');
    console.log('影片 ID:', result.videoId);
    console.log('影片 URL:', result.videoUrl);
    console.log('檔案大小:', result.size, 'bytes');
    console.log('檔案路徑:', result.outputPath);
    
  } catch (error) {
    console.error('測試失敗:', error);
  }
}

testVideoGeneration();