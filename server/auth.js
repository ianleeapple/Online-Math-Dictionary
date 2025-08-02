// 密碼雜湊相關工具函數
const bcrypt = require('bcrypt');
require('dotenv').config();

const SALT_ROUNDS = parseInt(process.env.BCRYPT_SALT_ROUNDS) || 12;

/**
 * 將明文密碼進行雜湊處理
 * @param {string} plainPassword - 明文密碼
 * @returns {Promise<string>} - 雜湊後的密碼
 */
async function hashPassword(plainPassword) {
  try {
    const hashedPassword = await bcrypt.hash(plainPassword, SALT_ROUNDS);
    return hashedPassword;
  } catch (error) {
    throw new Error('密碼雜湊失敗: ' + error.message);
  }
}

/**
 * 驗證密碼是否正確
 * @param {string} plainPassword - 明文密碼
 * @param {string} hashedPassword - 雜湊後的密碼
 * @returns {Promise<boolean>} - 密碼是否正確
 */
async function verifyPassword(plainPassword, hashedPassword) {
  try {
    const isMatch = await bcrypt.compare(plainPassword, hashedPassword);
    return isMatch;
  } catch (error) {
    throw new Error('密碼驗證失敗: ' + error.message);
  }
}

module.exports = {
  hashPassword,
  verifyPassword
};
