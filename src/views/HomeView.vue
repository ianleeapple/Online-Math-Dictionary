<template>
  <div class="main-bg">
    <div class="main-card">
      <h2 class="main-title">歡迎使用數學題庫系統</h2>
      <p style="text-align:center; font-size:18px; margin-top:12px; margin-bottom:32px;">本系統提供線上數學測驗、班級管理、成績查詢等功能，請從下方選擇操作：</p>
      <div class="home-features">
        <router-link class="feature-card" to="/profile">
          <div class="feature-title">個人資料</div>
          <div class="feature-desc">查看與編輯個人基本資料與成就</div>
        </router-link>
        <router-link class="feature-card" to="/quiz/create">
          <div class="feature-title">建立測驗</div>
          <div class="feature-desc">老師可建立數學測驗，學生可參加</div>
        </router-link>
        <router-link class="feature-card" to="/quiz/records">
          <div class="feature-title">測驗紀錄</div>
          <div class="feature-desc">查詢歷次測驗成績與詳情</div>
        </router-link>
        <router-link class="feature-card" to="/class-group">
          <div class="feature-title">班級群組</div>
          <div class="feature-desc">管理班級、學生與群組資訊</div>
        </router-link>
        <router-link class="feature-card" to="/login">
          <div class="feature-title">登入</div>
          <div class="feature-desc">已有帳號？請登入系統</div>
        </router-link>
        <router-link class="feature-card" to="/register">
          <div class="feature-title">註冊</div>
          <div class="feature-desc">新用戶註冊帳號</div>
        </router-link>
      </div>
    </div>
  </div>
</template>

<script setup>
// 無需特別邏輯
</script>
