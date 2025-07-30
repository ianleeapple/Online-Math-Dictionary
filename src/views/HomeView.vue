<template>
  <div>
    <h1 class="text-center">歡迎使用國高中數學題庫系統</h1>
    <p class="text-center">
      本系統提供線上數學測驗、班級管理、成績查詢等功能，請從下方選擇操作：
    </p>
    <div class="home-items">
      <div class="section" v-for="item in items" :key="item.title">
        <h2>{{ item.title }}</h2>
        <p>{{ item.description }}</p>
        <button class="btn" @click="navigate(item.action)">{{ item.button }}</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const items = ref([
  {
    title: '我的帳號',
    description: '查看或編輯個人基本資料及查看成就。',
    button: '管理帳號',
    action: 'account'
  },
  {
    title: '我的班級',
    description: '加入或管理您所屬的班級，查看班級測驗與成績。',
    button: '查看班級',
    action: 'class'
  },
  {
    title: '開始測驗',
    description: '選擇單元或觀念立即開始進行練習。',
    button: '建立測驗',
    action: 'exam'
  },
  {
    title: '我的測驗紀錄',
    description: '查詢過去的測驗成績與答題統計，並養成訂正的好習慣。',
    button: '查看紀錄',
    action: 'records'
  }
]);

onMounted(async () => {
  try {
    // 取得所有用戶
    const usersRes = await fetch('/api/users');
    const users = await usersRes.json();
    // 取得所有測驗
    const quizzesRes = await fetch('/api/quizzes');
    const quizzes = await quizzesRes.json();
    // 取得所有成就
    const achievementsRes = await fetch('/api/achievements');
    const achievements = await achievementsRes.json();
    // 動態顯示統計數量（可依需求調整顯示位置與內容）
    items.value[0].description += `（目前用戶數：${users.length}）`;
    items.value[2].description += `（目前題庫數：${quizzes.length}）`;
    items.value[0].description += `（成就種類：${achievements.length}）`;
  } catch (e) {
    console.error('API 請求失敗', e);
  }
});

function navigate(action) {
  console.log(`前往 ${action}`);
  // 可改為 router.push(`/path`) 做真正的導航
}
</script>

<style scoped>
body {
  font-family: 'Noto Sans TC', sans-serif;
  margin: 0;
  background-color: #f5f5f5;
  color: #594237;
}

.text-center {
  text-align: center;
}

.home-items {
  padding: 40px;
  max-width: 1200px;
  margin: auto;
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  gap: 30px;
}

.section {
  background-color: white;
  border-radius: 10px;
  padding: 30px;
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
  transition: transform 0.2s ease;
  flex: 1 1 calc(50% - 15px);
  min-width: 300px;
  box-sizing: border-box;
}

.section:hover {
  transform: translateY(-5px);
}

.section h2 {
  margin-top: 0;
  font-size: 20px;
  color: #594237;
}

.section p {
  color: #666;
}

.btn {
  display: inline-block;
  margin-top: 10px;
  background-color: #d78585;
  color: white;
  padding: 10px 20px;
  text-decoration: none;
  border: none;
  border-radius: 6px;
  font-size: 16px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

.btn:hover {
  background-color: #b66363;
}

@media (max-width: 768px) {
  .section {
    flex: 1 1 100%;
  }
}
</style>
