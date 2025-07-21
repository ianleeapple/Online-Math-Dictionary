<template>
  <div>
    <nav class="main-nav">
      <router-link to="/">首頁</router-link>
      <router-link to="/profile">個人資料</router-link>
      <router-link to="/quiz/create">建立測驗</router-link>
      <router-link to="/quiz/records">測驗紀錄</router-link>
      <router-link to="/class-group">班級群組</router-link>
      <router-link to="/login">登入</router-link>
      <router-link to="/register">註冊</router-link>
    </nav>
    <router-view />
  </div>
</template>

<script setup>
// 無需特別邏輯
</script>
