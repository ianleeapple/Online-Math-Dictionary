// 成本監控和控制設定
const COST_LIMITS = {
  // 每日使用限制
  DAILY_REQUESTS: 50,
  DAILY_TTS_CHARS: 25000, // 約 $0.375/天
  DAILY_GPT_TOKENS: 50000, // 約 $0.075/天
  
  // 單次請求限制
  MAX_TTS_LENGTH: 1000, // 字符
  MAX_SCRIPT_TOKENS: 2000,
  
  // 用戶等級限制
  FREE_TIER: {
    daily_videos: 5,
    daily_tts_chars: 2000
  },
  PREMIUM_TIER: {
    daily_videos: 50,
    daily_tts_chars: 25000
  }
};

// 成本估算函數
const estimateCost = (ttsChars, gptTokens) => {
  const ttsCost = (ttsChars / 1000) * 0.015; // $0.015/1k chars
  const gptCost = (gptTokens / 1000) * 0.0015; // $0.0015/1k tokens
  return {
    tts: ttsCost,
    gpt: gptCost,
    total: ttsCost + gptCost,
    totalTWD: (ttsCost + gptCost) * 31 // 假設匯率 31
  };
};

module.exports = { COST_LIMITS, estimateCost };