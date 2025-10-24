<template>
  <div class="profile-bg">
    <div class="profile-header">
      <h2>個人基本資料</h2>
      <div>
        <button class="btn" @click="onEdit">編輯個人檔案</button>
      </div>
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

    <!-- 編輯個人檔案模態框 -->
    <div v-if="isEditing" class="modal-overlay">
      <div class="modal-content">
        <h3>編輯個人檔案</h3>
        
        <div class="form-group">
          <label>姓名 <span class="required">*</span></label>
          <input type="text" v-model="editForm.name" required placeholder="請輸入姓名" />
        </div>

        <div class="form-group">
          <label>學校 <span class="required">*</span></label>
          <input type="text" v-model="editForm.school" required placeholder="請輸入學校名稱" />
        </div>

        <div class="form-group">
          <label>生日 <span class="required">*</span></label>
          <input type="date" v-model="editForm.birthday" required />
        </div>

        <div class="modal-actions">
          <button class="btn" @click="saveEdit">儲存變更</button>
          <button class="btn cancel-btn" @click="cancelEdit">取消</button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted } from 'vue';

const profile = ref({
  id: null,
  account: '',
  name: '',
  school: '',
  role: '',
  birthday: ''
});
const achievements = ref([]);

// 編輯狀態
const isEditing = ref(false);
const editForm = ref({
  name: '',
  school: '',
  birthday: ''
});

onMounted(async () => {
  try {
    // 從 localStorage 取得目前登入的使用者資訊
    const currentUserData = localStorage.getItem('currentUser');
    
    if (currentUserData) {
      const currentUser = JSON.parse(currentUserData);
      
      profile.value = {
        id: currentUser.id,
        account: currentUser.email,
        name: currentUser.name,
        school: currentUser.school || '未填寫',
        role: currentUser.role,
        birthday: currentUser.birthday ? new Date(currentUser.birthday).toLocaleDateString('zh-TW') : '未填寫'
      };
    } else {
      // 如果沒有登入資訊，顯示提示
      alert('請先登入');
      return;
    }
    
    // 取得該使用者的成就（實際應根據 user_id 過濾）
    const achievementsRes = await fetch('/api/achievements');
    const achs = await achievementsRes.json();
    achievements.value = achs.map(a => ({
      title: a.type,
      achieved: !!a.achieved,
      desc: a.description
    }));
  } catch (e) {
    console.error('載入個人資料失敗', e);
  }
});

function onEdit() {
  // 打開編輯模態框並填入當前資料
  isEditing.value = true;
  
  // 將當前個人資料填入編輯表單
  editForm.value = {
    name: profile.value.name,
    school: profile.value.school === '未填寫' ? '' : profile.value.school,
    birthday: profile.value.birthday === '未填寫' ? '' : formatDateForInput(profile.value.birthday)
  };
}

function cancelEdit() {
  isEditing.value = false;
  editForm.value = {
    name: '',
    school: '',
    birthday: ''
  };
}

async function saveEdit() {
  // 驗證必填欄位
  if (!editForm.value.name || editForm.value.name.trim() === '') {
    alert('請輸入姓名');
    return;
  }
  
  if (!editForm.value.school || editForm.value.school.trim() === '') {
    alert('請輸入學校');
    return;
  }
  
  if (!editForm.value.birthday) {
    alert('請選擇生日');
    return;
  }

  try {
    const currentUserData = localStorage.getItem('currentUser');
    if (!currentUserData) {
      alert('請先登入');
      return;
    }

    const currentUser = JSON.parse(currentUserData);
    
    // 呼叫後端 API 更新使用者資料
    const res = await fetch(`/api/users/${currentUser.id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: editForm.value.name.trim(),
        school: editForm.value.school.trim(),
        birthday: editForm.value.birthday
      })
    });

    const rawText = await res.text();
    
    if (rawText.startsWith('<!DOCTYPE') || rawText.startsWith('<html')) {
      throw new Error('伺服器回傳 HTML 而非 JSON，請確認後端服務已啟動');
    }

    let data;
    try {
      data = JSON.parse(rawText);
    } catch (parseError) {
      throw new Error('伺服器回應格式錯誤');
    }
    
    if (!res.ok) {
      throw new Error(data.message || '更新失敗');
    }

    // 更新成功，更新 localStorage 和頁面顯示
    currentUser.name = editForm.value.name.trim();
    currentUser.school = editForm.value.school.trim();
    currentUser.birthday = editForm.value.birthday;
    
    localStorage.setItem('currentUser', JSON.stringify(currentUser));
    
    // 更新頁面顯示
    profile.value = {
      id: currentUser.id,
      account: currentUser.email,
      name: currentUser.name,
      school: currentUser.school || '未填寫',
      role: currentUser.role,
      birthday: currentUser.birthday ? new Date(currentUser.birthday).toLocaleDateString('zh-TW') : '未填寫'
    };

    alert('更新成功！');
    cancelEdit();
  } catch (e) {
    console.error('更新個人檔案失敗:', e);
    alert('更新失敗：' + e.message);
  }
}

// 將顯示用的日期格式轉換為 input[type="date"] 的格式 (YYYY-MM-DD)
function formatDateForInput(dateStr) {
  if (!dateStr || dateStr === '未填寫') return '';
  
  try {
    // 如果是 "2024/1/1" 格式
    const parts = dateStr.split('/');
    if (parts.length === 3) {
      const year = parts[0];
      const month = parts[1].padStart(2, '0');
      const day = parts[2].padStart(2, '0');
      return `${year}-${month}-${day}`;
    }
    
    // 如果已經是 ISO 格式
    const date = new Date(dateStr);
    if (!isNaN(date.getTime())) {
      return date.toISOString().split('T')[0];
    }
  } catch (e) {
    console.error('日期格式轉換失敗:', e);
  }
  
  return '';
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

/* 模態框樣式 */
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  padding: 30px;
  border-radius: 10px;
  max-width: 500px;
  width: 90%;
  max-height: 80vh;
  overflow-y: auto;
}

.modal-content h3 {
  margin-bottom: 20px;
  color: #333;
  border-bottom: 2px solid #d67b7b;
  padding-bottom: 10px;
}

.form-group {
  margin-bottom: 20px;
}

.form-group label {
  display: block;
  margin-bottom: 8px;
  font-weight: bold;
  color: #2d2d2d;
}

.form-group input {
  width: 100%;
  padding: 10px;
  font-size: 14px;
  border: 1px solid #ccc;
  border-radius: 6px;
  box-sizing: border-box;
}

.form-group input:focus {
  outline: none;
  border-color: #d67b7b;
}

.modal-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  margin-top: 20px;
}

.cancel-btn {
  background-color: #95a5a6;
}

.cancel-btn:hover {
  background-color: #7f8c8d;
}

.required {
  color: #e74c3c;
  margin-left: 4px;
}
</style>
