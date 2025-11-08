CREATE DATABASE IF NOT EXISTS math_platform;
USE math_platform;

CREATE TABLE IF NOT EXISTS users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(50) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role ENUM('學生','老師') NOT NULL,
  school VARCHAR(100),
  birthday DATE,
  last_login_time TIMESTAMP NULL DEFAULT NULL,
  last_login_ip VARCHAR(45) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 班級群組表
CREATE TABLE IF NOT EXISTS classes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  code VARCHAR(10) UNIQUE NOT NULL,
  teacher_id INT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (teacher_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 班級成員表
CREATE TABLE IF NOT EXISTS class_members (
  class_id INT,
  student_id INT,
  joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (class_id, student_id),
  FOREIGN KEY (class_id) REFERENCES classes(id) ON DELETE CASCADE,
  FOREIGN KEY (student_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS quiz (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  title VARCHAR(100),
  score INT,
  concept VARCHAR(100),
  difficulty VARCHAR(50),
  question_count INT,
  timing_mode VARCHAR(50),
  question_types VARCHAR(255),
  corrected BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS achievement (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT,
  type VARCHAR(50),
  achieved BOOLEAN,
  description VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL
);

-- 存放題目資料表 (question)
CREATE TABLE IF NOT EXISTS question (
  id INT AUTO_INCREMENT PRIMARY KEY,
  level ENUM('國中','高中') NOT NULL,
  topic VARCHAR(100) NOT NULL,
  concept VARCHAR(100) NOT NULL,
  content TEXT NOT NULL,
  image_url VARCHAR(255) NULL,
  type ENUM('single', 'multiple', 'fill') NOT NULL,
  answer TEXT NULL COMMENT '選填題答案或正確選項的索引(逗號分隔)',
  difficulty ENUM('容易', '中等', '困難', '魔王') NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 題目選項表(單選題4個、多選題5個)
CREATE TABLE IF NOT EXISTS question_options (
  id INT AUTO_INCREMENT PRIMARY KEY,
  question_id INT NOT NULL,
  option_order INT NOT NULL COMMENT '選項順序 0-3(單選) 或 0-4(多選)',
  option_content TEXT NOT NULL COMMENT '選項內容',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (question_id) REFERENCES question(id) ON DELETE CASCADE
);

-- AI 題目生成任務佇列表
CREATE TABLE IF NOT EXISTS generation_tasks (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  source_question_id INT NOT NULL,
  total_count INT NOT NULL,
  completed_count INT DEFAULT 0,
  status ENUM('pending', 'processing', 'completed', 'failed') DEFAULT 'pending',
  error_message TEXT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (source_question_id) REFERENCES question(id) ON DELETE CASCADE
);

-- 測驗記錄表
CREATE TABLE IF NOT EXISTS quiz_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  submit_time DATETIME NOT NULL COMMENT '交卷時間',
  topic VARCHAR(100) NOT NULL,
  concept VARCHAR(100) NOT NULL,
  timing_mode ENUM('forward', 'countdown') NOT NULL,
  answer_time INT NOT NULL COMMENT '作答時間（秒）',
  time_limit INT NULL COMMENT '倒數計時的時間限制（分鐘）',
  difficulty VARCHAR(50) NOT NULL,
  question_count INT NOT NULL,
  question_types VARCHAR(255) NOT NULL COMMENT '題型，逗號分隔',
  score INT NULL COMMENT '測驗成績',
  corrected BOOLEAN DEFAULT FALSE COMMENT '是否訂正',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- 測驗記錄明細表(記錄每題的答案)
CREATE TABLE IF NOT EXISTS quiz_record_details (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_record_id INT NOT NULL,
  question_order INT NOT NULL COMMENT '題目順序',
  question_id INT NOT NULL,
  user_answer TEXT NULL COMMENT '使用者的答案',
  option_order TEXT NULL COMMENT '選項順序（JSON陣列，記錄打亂後的索引順序）',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_record_id) REFERENCES quiz_records(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES question(id) ON DELETE CASCADE
);

-- 訂正記錄表
CREATE TABLE IF NOT EXISTS correction_records (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quiz_record_id INT NOT NULL,
  question_id INT NOT NULL,
  corrected BOOLEAN DEFAULT FALSE,
  corrected_at TIMESTAMP NULL DEFAULT NULL,
  UNIQUE KEY unique_correction (quiz_record_id, question_id),
  FOREIGN KEY (quiz_record_id) REFERENCES quiz_records(id) ON DELETE CASCADE,
  FOREIGN KEY (question_id) REFERENCES question(id) ON DELETE CASCADE
);
