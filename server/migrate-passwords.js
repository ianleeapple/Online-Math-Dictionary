// 密碼遷移腳本：將現有明文密碼轉換為雜湊密碼
const pool = require('./db');
const { hashPassword } = require('./auth');

async function migratePasswords() {
  try {
    console.log('開始密碼遷移...');
    
    // 1. 取得所有使用者的明文密碼
    const [users] = await pool.query('SELECT id, email, password FROM users');
    
    console.log(`找到 ${users.length} 個使用者需要遷移密碼`);
    
    // 2. 逐一將明文密碼雜湊化
    for (const user of users) {
      console.log(`正在處理使用者: ${user.email}`);
      
      // 檢查密碼是否已經是雜湊格式（bcrypt 雜湊通常以 $2b$ 開頭且長度為 60）
      if (user.password.startsWith('$2b$') && user.password.length === 60) {
        console.log(`  -> 跳過，密碼已經是雜湊格式`);
        continue;
      }
      
      // 將明文密碼雜湊化
      const hashedPassword = await hashPassword(user.password);
      
      // 更新資料庫
      await pool.query(
        'UPDATE users SET password = ? WHERE id = ?',
        [hashedPassword, user.id]
      );
      
      console.log(`  -> 完成雜湊化`);
    }
    
    console.log('密碼遷移完成！');
    
    // 3. 驗證遷移結果
    console.log('\n驗證遷移結果...');
    const [updatedUsers] = await pool.query('SELECT id, email, password FROM users');
    
    for (const user of updatedUsers) {
      const isHashed = user.password.startsWith('$2b$') && user.password.length === 60;
      console.log(`${user.email}: ${isHashed ? '雜湊格式' : '明文格式'}`);
    }
    
  } catch (error) {
    console.error('密碼遷移失敗:', error);
  } finally {
    process.exit();
  }
}

// 執行遷移
migratePasswords();
