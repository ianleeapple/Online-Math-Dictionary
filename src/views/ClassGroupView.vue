<template>
  <div class="group-bg">
    <!-- 老師介面 -->
    <template v-if="isTeacher">
      <h2>班級群組管理（老師）</h2>

      <div class="create-group">
        <input v-model="newGroupName" placeholder="請輸入新群組名稱" @keyup.enter="createGroup" />
        <button class="btn" @click="createGroup">建立班級群組</button>
      </div>

      <div v-for="(group, index) in groups" :key="group.id" class="group-container">
        <div class="group-header" @click="toggleGroup(index)">
          <div class="group-header-left">
            <span class="group-title">{{ group.name }}</span>
            <span class="group-code">（加入代碼：{{ group.code }}）</span>
          </div>
          <div class="btn-group" @click.stop>
            <button class="btn delete-btn" @click="deleteClass(group.id)">刪除班級</button>
          </div>
        </div>

        <table v-if="expandedIndex === index" class="student-table teacher-table">
          <thead>
            <tr>
              <th>學生帳號</th>
              <th>學生姓名</th>
              <th>最後上線時間</th>
              <th>最近測驗成績</th>
              <th>平均成績</th>
              <th>已進行測驗次數</th>
              <th>加入時間</th>
            </tr>
          </thead>
          <tbody>
            <tr v-if="group.students.length === 0">
              <td colspan="7" style="text-align: center; color: #999;">尚無學生加入</td>
            </tr>
            <tr v-for="student in group.students" :key="student.id">
              <td>{{ student.email }}</td>
              <td>{{ student.name }}</td>
              <td>{{ formatDate(student.last_login_time) || '尚未登入' }}</td>
              <td>{{ student.stats?.latestScore ?? '無紀錄' }}</td>
              <td>{{ student.stats?.averageScore ?? '無紀錄' }}</td>
              <td>{{ student.stats?.totalCount ?? 0 }}</td>
              <td>{{ formatDate(student.joined_at) }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="groups.length === 0" style="text-align: center; color: #999; margin-top: 40px;">
        尚未建立任何班級群組
      </div>
    </template>

    <!-- 學生介面 -->
    <template v-else>
      <h2>我的班級群組（學生）</h2>

      <div class="join-group">
        <input v-model="joinCode" placeholder="請輸入班級加入代碼" @keyup.enter="joinClass" maxlength="6" />
        <button class="btn" @click="joinClass">加入班級</button>
      </div>

      <div v-for="(group, index) in groups" :key="group.id" class="group-container">
        <div class="group-header" @click="toggleGroup(index)">
          <div class="group-header-left">
            <span class="group-title">{{ group.name }}</span>
            <span class="group-code">（加入代碼：{{ group.code }}）</span>
          </div>
          <div class="btn-group" @click.stop>
            <button class="btn leave-btn" @click="leaveClass(group.id)">退出班級</button>
          </div>
        </div>

        <table v-if="expandedIndex === index" class="student-table">
          <thead>
            <tr>
              <th>身分</th>
              <th>學校</th>
              <th>帳號</th>
              <th>姓名</th>
            </tr>
          </thead>
          <tbody>
            <!-- 老師資料 -->
            <tr v-if="group.teacher">
              <td>老師</td>
              <td>{{ group.teacher.school || '未設定' }}</td>
              <td>{{ group.teacher.email }}</td>
              <td>{{ group.teacher.name }}</td>
            </tr>
            <!-- 學生資料 -->
            <tr v-for="student in group.students" :key="student.id">
              <td>學生</td>
              <td>{{ student.school || '未設定' }}</td>
              <td>{{ student.email }}</td>
              <td>{{ student.name }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="groups.length === 0" style="text-align: center; color: #999; margin-top: 40px;">
        尚未加入任何班級群組
      </div>
    </template>
  </div>
</template>

<script setup>
import { ref, onMounted, computed } from 'vue';

const newGroupName = ref('');
const joinCode = ref('');
const expandedIndex = ref(null);
const groups = ref([]);
const currentUser = ref(null);

const isTeacher = computed(() => currentUser.value?.role === '老師');

onMounted(async () => {
  loadCurrentUser();
  await loadGroups();
});

function loadCurrentUser() {
  const userData = localStorage.getItem('currentUser');
  if (userData) {
    currentUser.value = JSON.parse(userData);
  } else {
    alert('請先登入');
  }
}

async function loadGroups() {
  if (!currentUser.value) return;
  
  try {
    const endpoint = isTeacher.value 
      ? `/api/classes/teacher/${currentUser.value.id}`
      : `/api/classes/student/${currentUser.value.id}`;
    
    const res = await fetch(endpoint);
    const data = await res.json();
    
    console.log('載入的班級資料:', data);
    
    // 如果是老師，先載入每位學生的測驗統計
    if (isTeacher.value) {
      for (const group of data) {
        for (const student of group.students) {
          try {
            const statsRes = await fetch(`/api/quiz/stats/student/${student.id}`);
            const stats = await statsRes.json();
            console.log(`學生 ${student.id} 的統計:`, stats);
            student.stats = stats;
          } catch (error) {
            console.error(`載入學生 ${student.id} 統計失敗:`, error);
            student.stats = { latestScore: null, averageScore: null, totalCount: 0 };
          }
        }
      }
    }
    
    console.log('最終的 groups 資料:', data);
    groups.value = data;
  } catch (error) {
    console.error('載入班級失敗:', error);
    alert('載入班級資料失敗');
  }
}

async function createGroup() {
  if (!newGroupName.value.trim()) {
    alert('請輸入班級名稱');
    return;
  }
  
  try {
    const res = await fetch('/api/classes', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: newGroupName.value.trim(),
        teacherId: currentUser.value.id
      })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || '建立班級失敗');
    }
    
    alert(`班級「${data.class.name}」建立成功！\n加入代碼：${data.class.code}`);
    newGroupName.value = '';
    await loadGroups();
  } catch (error) {
    console.error('建立班級失敗:', error);
    alert('建立班級失敗：' + error.message);
  }
}

async function deleteClass(classId) {
  if (!confirm('確定要刪除此班級嗎？所有學生將被移除。')) {
    return;
  }
  
  try {
    const res = await fetch(`/api/classes/${classId}`, {
      method: 'DELETE'
    });
    
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || '刪除班級失敗');
    }
    
    alert('班級已刪除');
    await loadGroups();
  } catch (error) {
    console.error('刪除班級失敗:', error);
    alert('刪除班級失敗：' + error.message);
  }
}

async function joinClass() {
  if (!joinCode.value.trim()) {
    alert('請輸入加入代碼');
    return;
  }
  
  try {
    const res = await fetch('/api/classes/join', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: joinCode.value.trim().toUpperCase(),
        studentId: currentUser.value.id
      })
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || '加入班級失敗');
    }
    
    alert(data.message);
    joinCode.value = '';
    await loadGroups();
  } catch (error) {
    console.error('加入班級失敗:', error);
    alert(error.message);
  }
}

async function leaveClass(classId) {
  if (!confirm('確定要退出此班級嗎？')) {
    return;
  }
  
  try {
    const res = await fetch(`/api/classes/${classId}/leave/${currentUser.value.id}`, {
      method: 'DELETE'
    });
    
    const data = await res.json();
    
    if (!res.ok) {
      throw new Error(data.message || '退出班級失敗');
    }
    
    alert('已退出班級');
    await loadGroups();
  } catch (error) {
    console.error('退出班級失敗:', error);
    alert('退出班級失敗：' + error.message);
  }
}

function toggleGroup(index) {
  expandedIndex.value = expandedIndex.value === index ? null : index;
}

function formatDate(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  return date.toLocaleString('zh-TW');
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

.create-group, .join-group {
  margin-bottom: 30px;
  display: flex;
  gap: 10px;
  align-items: center;
}

.create-group input, .join-group input {
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  flex: 1;
  max-width: 400px;
}

.btn {
  background-color: #d67b7b;
  color: white;
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  cursor: pointer;
  font-size: 14px;
  transition: background-color 0.2s;
}

.btn:hover {
  background-color: #c06565;
}

.delete-btn {
  background-color: #d67b7b;
}

.delete-btn:hover {
  background-color: #c06565;
}

.leave-btn {
  background-color: #95a5a6;
}

.leave-btn:hover {
  background-color: #7f8c8d;
}

.group-container {
  border: 2px solid #d0d6dc;
  border-radius: 10px;
  margin-bottom: 20px;
  background-color: white;
  overflow: hidden;
  padding: 25px 10px 10px 10px;
}

.group-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  min-height: 70px;
  padding: 0 20px;
  cursor: pointer;
  transition: background-color 0.2s;
}

.group-header-left {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: 10px;
}

.group-title {
  font-size: 20px;
  font-weight: bold;
  color: #2d2d2d;
}

.group-code {
  font-size: 14px;
  color: #888;
}

.btn-group {
  display: flex;
  gap: 10px;
  align-items: center;
}

.student-table {
  width: calc(100% - 20px);
  border-collapse: collapse;
  text-align: center;
  margin: 15px 10px 10px 10px;
  table-layout: fixed;
}

.student-table th,
.student-table td {
  border: 1px solid #ddd;
  padding: 12px;
  font-size: 14px;
}

/* 學生介面（4 欄位）*/
.student-table:not(.teacher-table) th,
.student-table:not(.teacher-table) td {
  width: 25%;
}

/* 老師介面（8 欄位）*/
.teacher-table th,
.teacher-table td {
  width: auto;
}

.teacher-table th:nth-child(1),
.teacher-table td:nth-child(1) {
  width: 18%;
}

.teacher-table th:nth-child(2),
.teacher-table td:nth-child(2) {
  width: 10%;
}

.teacher-table th:nth-child(3),
.teacher-table td:nth-child(3) {
  width: 13%;
}

.teacher-table th:nth-child(4),
.teacher-table td:nth-child(4) {
  width: 11%;
}

.teacher-table th:nth-child(5),
.teacher-table td:nth-child(5) {
  width: 11%;
}

.teacher-table th:nth-child(6),
.teacher-table td:nth-child(6) {
  width: 9%;
}

.teacher-table th:nth-child(7),
.teacher-table td:nth-child(7) {
  width: 12%;
}

.teacher-table th:nth-child(8),
.teacher-table td:nth-child(8) {
  width: 13%;
}

.student-table th {
  background-color: #f2f2f2;
  font-weight: bold;
}

@media (max-width: 768px) {
  .group-header {
    flex-direction: column;
    align-items: flex-start;
    gap: 10px;
    padding: 15px;
  }
  
  .btn-group {
    width: 100%;
    justify-content: flex-start;
  }
}
</style>
