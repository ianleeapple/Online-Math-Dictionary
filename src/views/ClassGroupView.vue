<template>
  <div class="group-bg">
    <h2>班級群組管理（老師）</h2>
    <div class="create-group">
      <input type="text" v-model="newGroup" placeholder="請輸入新群組名稱" />
      <button class="btn" @click="addGroup">建立班級群組</button>
    </div>
    <div v-for="group in groups" :key="group.name" class="group-container">
      <div class="group-header">
        <span class="group-title">{{ group.name }}</span>
        <button class="btn" @click="addStudent(group)">新增學生</button>
      </div>
      <table class="student-table">
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
          <tr v-for="student in group.students" :key="student.account">
            <td>{{ student.account }}</td>
            <td>{{ student.name }}</td>
            <td>{{ student.lastOnline }}</td>
            <td>{{ student.lastIP }}</td>
            <td>{{ student.lastScore }} 分</td>
            <td>{{ student.avgScore }} 分</td>
            <td><button class="btn" @click="viewStudent(student)">查看</button></td>
          </tr>
        </tbody>
      </table>
    </div>
  </div>
</template>

<script setup>
import { ref } from 'vue';
const newGroup = ref('');
const groups = ref([
  {
    name: '數學A班',
    students: [
      { account: 'student01', name: '陳小明', lastOnline: '2025/05/22 14:10', lastIP: '192.168.0.12', lastScore: 90, avgScore: 87 },
      { account: 'student02', name: '陳大名', lastOnline: '2025/05/21 10:30', lastIP: '192.168.0.33', lastScore: 75, avgScore: 79 }
    ]
  }
]);
function addGroup() {
  if (!newGroup.value.trim()) return;
  groups.value.push({ name: newGroup.value, students: [] });
  newGroup.value = '';
}
function addStudent(group) {
  alert(`新增學生到 ${group.name}（僅前端示意）`);
}
function viewStudent(student) {
  alert(`學生帳號：${student.account}\n姓名：${student.name}`);
}
</script>

<style scoped>
.group-bg {
  background-color: #f9f9f9;
  min-height: 100vh;
  padding: 20px;
}
h2 {
  margin-bottom: 20px;
}
.group-container {
  border: 2px solid #d0d6dc;
  border-radius: 10px;
  padding: 20px;
  margin-bottom: 20px;
  background-color: white;
}
.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 15px;
}
.group-title {
  font-size: 20px;
  font-weight: bold;
  color: #2d2d2d;
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
.student-table {
  width: 100%;
  border-collapse: collapse;
}
.student-table th,
.student-table td {
  border: 1px solid #ddd;
  padding: 8px;
  text-align: center;
  font-size: 14px;
}
.student-table th {
  background-color: #f2f2f2;
  font-weight: bold;
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
</style>
