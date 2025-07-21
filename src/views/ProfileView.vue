<template>
  <div class="profile-bg">
    <div class="profile-header">
      <h2>個人基本資料</h2>
      <button class="btn" @click="onEdit">編輯個人檔案</button>
    </div>
    <div class="section user-info">
      <p><strong>帳號：</strong>{{ profile.account }}</p>
      <p><strong>姓名：</strong>{{ profile.name }}</p>
      <p><strong>學校：</strong>{{ profile.school }}</p>
      <p><strong>身分：</strong>{{ profile.role }}</p>
      <p><strong>生日：</strong>{{ profile.birthday }}</p>
    </div>
    <div class="section">
      <div class="section-title">成就紀錄</div>
      <div class="achievement-grid">
        <div v-for="ach in achievements" :key="ach.title" :class="['achievement-card', { achieved: ach.achieved }]" :style="!ach.achieved ? 'background-color:#eeeeee;' : ''">
          <div class="achievement-title">{{ ach.title }}</div>
          <div class="achievement-status" :style="!ach.achieved ? 'color:rgb(155,80,80);' : ''">
            <span v-if="ach.achieved">✔ 已達成</span>
            <span v-else>✖ 尚未達成</span>
          </div>
          <div class="achievement-description">{{ ach.desc }}</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const profile = ref({
  account: 'student01',
  name: '陳小明',
  school: '臺北市立建國高級中學',
  role: '學生',
  birthday: '2000年01月01日'
});
const achievements = ref([
  { title: '完成 10 次測驗', achieved: true, desc: '你已完成 10 次以上的測驗' },
  { title: '訂正 30 題', achieved: true, desc: '你已完成 30 題以上的訂正' },
  { title: '連續登入 7 天', achieved: false, desc: '連續一週每天登入系統' },
  { title: '建立 5 張錯題筆記', achieved: false, desc: '養成整理錯題習慣' }
]);
function onEdit() {
  alert('編輯個人檔案功能尚未開放');
}
</script>

<style scoped>
.profile-bg {
  background-color: #f9f9f9;
  min-height: 100vh;
  padding: 20px;
}
.profile-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}
h2 {
  margin: 0;
}
.section {
  border: 2px solid #d0d6dc;
  border-radius: 10px;
  background-color: white;
  padding: 20px;
  margin-bottom: 30px;
}
.user-info p {
  font-size: 16px;
  margin: 8px 0;
}
.section-title {
  font-size: 20px;
  font-weight: bold;
  color: #2d2d2d;
  margin-bottom: 15px;
}
.achievement-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 15px;
}
.achievement-card {
  border: 1px solid #ccc;
  border-radius: 10px;
  padding: 15px;
  background-color: #f0f8f0;
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 5px;
}
.achievement-card.achieved {
  border-color: #8bc34a;
  background-color: #e6f4e6;
}
.achievement-title {
  font-size: 16px;
  font-weight: bold;
  color: #2d2d2d;
}
.achievement-status {
  color: green;
  font-size: 14px;
}
.achievement-description {
  font-size: 14px;
  color: #555;
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
</style>
