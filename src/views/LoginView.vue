<template>
  <div class="login-bg">
    <h1 v-if="!roleSelected" class="login-title">請選擇身分</h1>
    <div v-if="!roleSelected" class="role-select">
      <div class="role-option" :class="{active: tempRole==='學生'}" @click="selectRole('學生')">
        <img src="/student.png" alt="學生圖示" />
        <div>我是學生</div>
      </div>
      <div class="role-option" :class="{active: tempRole==='老師'}" @click="selectRole('老師')">
        <img src="/teacher.png" alt="老師圖示" />
        <div>我是老師</div>
      </div>
    </div>
    <div v-if="roleSelected">
      <div class="identity-display">
        <img :src="role==='學生'?'/student.png':'/teacher.png'" alt="身分圖示" />
        <span>目前身分：{{ role }}</span>
      </div>
      <div class="form-wrapper">
        <div class="login-container">
          <h2>使用者登入</h2>
          <form class="form-body" @submit.prevent="onLogin">
            <div class="form-group">
              <label for="login-role">選擇身分</label>
              <select id="login-role" v-model="role">
                <option value="學生">學生</option>
                <option value="老師">老師</option>
              </select>
            </div>
            <div class="form-group">
              <label for="login-username">帳號</label>
              <input type="text" id="login-username" v-model="account" placeholder="請輸入帳號" required />
            </div>
            <div class="form-group">
              <label for="login-password">密碼</label>
              <input type="password" id="login-password" v-model="password" placeholder="請輸入密碼" required />
            </div>
            <div style="display: flex; gap: 10px;">
              <button class="btn" style="width: 50%;" type="submit">登入</button>
              <button class="btn" style="width: 50%;" type="button" @click="onForgot">忘記密碼</button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const role = ref('學生');
const tempRole = ref('');
const roleSelected = ref(false);
const account = ref('');
const password = ref('');
function selectRole(r) {
  tempRole.value = r;
  setTimeout(() => {
    role.value = r;
    roleSelected.value = true;
  }, 120);
}
function onLogin() {
  alert(`身份：${role.value}\n帳號：${account.value}\n密碼：${password.value}\n（登入功能尚未串接 API）`);
}
function onForgot() {
  alert('請聯絡管理員重設密碼');
}
</script>

<style scoped>
.login-bg {
  background-color: #f9f9f9;
  min-height: 100vh;
  padding: 40px;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.login-title {
  color: #2d2d2d;
  margin-bottom: 30px;
}
.role-select {
  display: flex;
  justify-content: center;
  gap: 50px;
  margin-bottom: 40px;
}
.role-option {
  text-align: center;
  cursor: pointer;
}
.role-option img {
  width: 100px;
  height: 100px;
  border-radius: 10px;
  border: 3px solid transparent;
  transition: border-color 0.3s;
}
.role-option:hover img,
.role-option.active img {
  border-color: #d67b7b;
}
.identity-display {
  display: flex;
  align-items: center;
  gap: 15px;
  margin-bottom: 20px;
}
.identity-display img {
  width: 50px;
  height: 50px;
  border-radius: 8px;
}
.form-wrapper {
  display: flex;
  flex-direction: column;
  gap: 20px;
  width: 100%;
  max-width: 900px;
}
.login-container {
  border: 2px solid #d0d6dc;
  border-radius: 10px;
  padding: 30px 40px;
  background-color: white;
  width: 100%;
  max-width: 100%;
  box-shadow: 0 2px 10px rgba(0,0,0,0.05);
  margin: 10px auto;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}
h2 {
  text-align: center;
  margin-bottom: 20px;
  color: #2d2d2d;
}
.form-body {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
}
.form-group {
  margin-bottom: 20px;
}
label {
  display: block;
  font-weight: bold;
  margin-bottom: 8px;
  color: #333;
}
input[type="text"],
input[type="password"],
input[type="date"],
select {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
  max-width: 100%;
}
.btn {
  background-color: #d67b7b;
  color: white;
  padding: 10px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 16px;
  margin-top: 10px;
}
.btn:hover {
  background-color: #c06565;
}
@media (min-width: 768px) {
  .form-wrapper {
    flex-direction: row;
    justify-content: center;
    align-items: stretch;
  }
  .login-container {
    flex: 1;
  }
}
</style>
