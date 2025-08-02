<template>
  <div>
    <nav class="main-nav">
      <router-link to="/">首頁</router-link>
      
      <!-- 登入後才顯示的選單 -->
      <template v-if="isLoggedIn">
        <router-link to="/profile">個人資料</router-link>
        <router-link to="/quiz/create">建立測驗</router-link>
        <router-link to="/quiz/records">測驗紀錄</router-link>
        <router-link to="/class-group">班級群組</router-link>
        <button class="logout-btn" @click="logout">登出</button>
      </template>
      
      <!-- 未登入時顯示的選單 -->
      <template v-else>
        <router-link to="/login">登入</router-link>
        <router-link to="/register">註冊</router-link>
      </template>
    </nav>
    <router-view />
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';
import { useRouter } from 'vue-router';

const router = useRouter();
const isLoggedIn = ref(false);

// 檢查登入狀態
function checkLoginStatus() {
  const currentUser = localStorage.getItem('currentUser');
  isLoggedIn.value = !!currentUser;
}

// 登出功能
function logout() {
  if (confirm('確定要登出嗎？')) {
    // 清除 localStorage 中的使用者資料
    localStorage.removeItem('currentUser');
    // 更新登入狀態
    isLoggedIn.value = false;
    // 跳轉到首頁
    router.push('/');
    alert('已成功登出');
  }
}

// 頁面載入時檢查登入狀態
onMounted(() => {
  checkLoginStatus();
});

// 監聽 localStorage 變化（當在其他分頁登入/登出時）
window.addEventListener('storage', (e) => {
  if (e.key === 'currentUser') {
    checkLoginStatus();
  }
});
</script>

<style scoped>
.logout-btn {
  background: none;
  border: none;
  color: #333;
  font-weight: bold;
  cursor: pointer;
  transition: color 0.2s;
  font-size: inherit;
  padding: 0;
}
.logout-btn:hover {
  color: #d67b7b;
}
</style>
