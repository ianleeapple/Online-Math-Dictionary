<template>
  <div class="group-bg">
    <h2>班級群組管理（老師）</h2>

    <div class="create-group">
      <input v-model="newGroupName" placeholder="請輸入新群組名稱" />
      <button class="btn" @click="createGroup">建立班級群組</button>
    </div>

    <div v-for="(group, index) in groups" :key="index" class="group-container">
      <div class="group-header" @click="toggleGroup(index)">
        <div class="group-header-left">
          <span class="group-title">{{ group.name }}</span>
          <span class="group-code">（加入代碼：{{ group.code }}）</span>
        </div>
        <div class="btn-group" @click.stop>
          <button class="btn">新增學生</button>
          <button class="btn">刪除班級</button>
        </div>
      </div>

      <table v-if="expandedIndex === index" class="student-table">
        <thead>
          <tr>
            <th>學生帳號</th>
            <th>學生姓名</th>
            <th>最後上線時間</th>
            <th>最後登入 IP</th>
            <th>最近測驗成績</th>
            <th>平均成績</th>
            <th>學生詳細資訊</th>
          </tr>
        </thead>
        <tbody>
          <tr v-for="(student, sIndex) in group.students" :key="sIndex">
            <td>{{ student.username }}</td>
            <td>{{ student.name }}</td>
            <td>{{ student.lastOnline }}</td>
            <td>{{ student.ip }}</td>
            <td>{{ student.latestScore }}</td>
            <td>{{ student.avgScore }}</td>
            <td><button class="btn">查看</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const newGroupName = ref('');
const expandedIndex = ref(null);

function generateCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('');
}

const groups = ref([]);
onMounted(async () => {
  try {
    const res = await fetch('/api/users');
    const users = await res.json();
    // 假設所有學生分為一班，實際應根據班級資料分組
    groups.value = [
      {
        name: '數學A班',
        code: generateCode(),
        students: users.map(u => ({
          username: u.email,
          name: u.name,
          lastOnline: '',
          ip: '',
          latestScore: '',
          avgScore: ''
        }))
      }
    ];
  } catch (e) {
    console.error('API 請求失敗', e);
  }
});


function createGroup() {
  if (newGroupName.value.trim()) {
    groups.value.push({
      name: newGroupName.value,
      code: generateCode(),
      students: []
    });
    newGroupName.value = '';
  }
}

function toggleGroup(index) {
  expandedIndex.value = expandedIndex.value === index ? null : index;
}
</script>

<style scoped>
.group-bg {
  background-color: #f9f9f9;
  min-height: 100vh;
  padding: 20px;
  font-family: 'Noto Sans TC', sans-serif;
}

h2 {
  margin-bottom: 20px;
}

.create-group {
  margin-bottom: 30px;
}

.create-group input {
  padding: 8px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-right: 10px;
}

.btn {
  background-color: #d67b7b;
  color: white;
  padding: 8px 16px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
}

.btn:hover {
  background-color: #c06565;
}

.group-container {
  border: 2px solid #d0d6dc;
  border-radius: 10px;
  margin-bottom: 20px;
  background-color: white;
  overflow: hidden;
  padding: 10px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 70px;
  padding: 0 20px;
  cursor: pointer;
}

.group-header-left {
  display: flex;
  align-items: center;
}

.group-title {
  font-size: 20px;
  font-weight: bold;
  color: #2d2d2d;
}

.group-code {
  font-size: 14px;
  color: #888;
  margin-left: 10px;
}

.btn-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.student-table {
  width: 100%;
  border-collapse: collapse;
  text-align: center;
  margin-top: 10px;
}

.student-table th,
.student-table td {
  border: 1px solid #ddd;
  padding: 12px;
  font-size: 14px;
}

.student-table th {
  background-color: #f2f2f2;
  font-weight: bold;
}
</style>
