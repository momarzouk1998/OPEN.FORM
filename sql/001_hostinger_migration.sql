CREATE TABLE profiles (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50) DEFAULT '',
  gender VARCHAR(10) DEFAULT '',
  role ENUM('volunteer', 'supervisor', 'admin') NOT NULL DEFAULT 'volunteer',
  status ENUM('pending', 'approved', 'rejected') NOT NULL DEFAULT 'pending',
  avatar_url TEXT,
  banned TINYINT(1) DEFAULT 0,
  form_limit INT DEFAULT NULL,
  submission_limit INT DEFAULT NULL,
  company VARCHAR(255) DEFAULT NULL,
  bio TEXT,
  social_links JSON DEFAULT NULL,
  other_links JSON DEFAULT NULL,
  referral_code VARCHAR(50) DEFAULT NULL,
  referred_by VARCHAR(36) DEFAULT NULL,
  partner_logo TEXT,
  partner_banner TEXT,
  partner_website VARCHAR(500) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE projects (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  icon VARCHAR(50) DEFAULT 'star',
  color VARCHAR(50) DEFAULT 'blue',
  image_url TEXT,
  visibility ENUM('public', 'private') DEFAULT 'public',
  category ENUM('male', 'female', 'all') DEFAULT 'all',
  target_gender ENUM('male', 'female', 'all') DEFAULT 'all',
  has_forms TINYINT(1) DEFAULT 0,
  has_curriculum TINYINT(1) DEFAULT 0,
  is_active TINYINT(1) DEFAULT 1,
  created_by VARCHAR(36) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE forms (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  icon VARCHAR(50) DEFAULT 'document-text',
  color VARCHAR(50) DEFAULT 'blue',
  is_active TINYINT(1) DEFAULT 1,
  time_limit INT DEFAULT NULL,
  pass_score INT DEFAULT NULL,
  end_date DATETIME DEFAULT NULL,
  allow_multiple TINYINT(1) DEFAULT 0,
  allow_delete TINYINT(1) DEFAULT 0,
  randomize_questions TINYINT(1) DEFAULT 0,
  shuffle_options TINYINT(1) DEFAULT 0,
  max_attempts INT DEFAULT NULL,
  page_titles JSON DEFAULT NULL,
  created_by VARCHAR(36) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE questions (
  id VARCHAR(36) PRIMARY KEY,
  form_id VARCHAR(36) NOT NULL,
  text TEXT NOT NULL,
  type VARCHAR(50) NOT NULL,
  required TINYINT(1) DEFAULT 0,
  points INT DEFAULT 0,
  order_index INT DEFAULT 0,
  options JSON DEFAULT NULL,
  has_counter TINYINT(1) DEFAULT 0,
  counter_target INT DEFAULT NULL,
  page_number INT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE form_responses (
  id VARCHAR(36) PRIMARY KEY,
  form_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  answers JSON DEFAULT NULL,
  score INT DEFAULT 0,
  max_score INT DEFAULT 0,
  is_sample TINYINT(1) DEFAULT 0,
  submitted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (form_id) REFERENCES forms(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE curricula (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  image_url TEXT,
  is_active TINYINT(1) DEFAULT 1,
  created_by VARCHAR(36) DEFAULT NULL,
  allow_comments TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE lessons (
  id VARCHAR(36) PRIMARY KEY,
  curriculum_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  type ENUM('video', 'audio', 'text') DEFAULT 'video',
  content_count ENUM('single', 'multiple') DEFAULT 'single',
  youtube_url TEXT,
  audio_url TEXT,
  audio_files JSON DEFAULT NULL,
  video_url TEXT,
  video_files JSON DEFAULT NULL,
  content TEXT,
  order_index INT DEFAULT 0,
  duration INT DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (curriculum_id) REFERENCES curricula(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE lesson_progress (
  id VARCHAR(36) PRIMARY KEY,
  lesson_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  completed TINYINT(1) DEFAULT 0,
  completed_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_progress (lesson_id, user_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE lesson_comments (
  id VARCHAR(36) PRIMARY KEY,
  lesson_id VARCHAR(36) NOT NULL,
  user_id VARCHAR(36) NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE project_invites (
  id VARCHAR(36) PRIMARY KEY,
  project_id VARCHAR(36) NOT NULL,
  token VARCHAR(255) NOT NULL UNIQUE,
  created_by VARCHAR(36) DEFAULT NULL,
  max_uses INT DEFAULT NULL,
  use_count INT DEFAULT 0,
  expires_at DATETIME DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_projects (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE KEY unique_user_project (user_id, project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE project_supervisors (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE KEY unique_supervisor (user_id, project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE project_bans (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  project_id VARCHAR(36) NOT NULL,
  reason TEXT,
  created_by VARCHAR(36) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  UNIQUE KEY unique_ban (user_id, project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notification_preferences (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type VARCHAR(100) NOT NULL,
  enabled TINYINT(1) DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE KEY unique_pref (user_id, type)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE notifications (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  message TEXT,
  `type` VARCHAR(50) DEFAULT 'info',
  `read` TINYINT(1) DEFAULT 0,
  link TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE app_settings (
  id VARCHAR(36) PRIMARY KEY,
  key_name VARCHAR(100) NOT NULL UNIQUE,
  value TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE verification_codes (
  id VARCHAR(36) PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  code VARCHAR(6) NOT NULL,
  expires_at DATETIME NOT NULL,
  `used` TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE partner_ideas (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100) DEFAULT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE partner_likes (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  idea_id VARCHAR(36) NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (idea_id) REFERENCES partner_ideas(id) ON DELETE CASCADE,
  UNIQUE KEY unique_like (user_id, idea_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE referrals (
  id VARCHAR(36) PRIMARY KEY,
  referrer_id VARCHAR(36) NOT NULL,
  referred_email VARCHAR(255) DEFAULT NULL,
  referred_id VARCHAR(36) DEFAULT NULL,
  status ENUM('pending', 'joined', 'completed') DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (referrer_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

CREATE TABLE user_templates (
  id VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  type VARCHAR(50) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  content JSON DEFAULT NULL,
  approved TINYINT(1) DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES profiles(id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;

-- Insert default admin user (password: admin123)
INSERT INTO profiles (id, email, password_hash, name, role, status) VALUES
('00000000-0000-0000-0000-000000000001', 'admin@ahlashabab.com', '$2a$12$LJ3m4ys3Lk0TSwHnbfOMiOXPm1Qlq5p0p0p0p0p0p0p0p0p0p0', 'مدير النظام', 'admin', 'approved');

-- Insert default app settings
INSERT INTO app_settings (id, key_name, value) VALUES
('00000000-0000-0000-0000-000000000002', 'app_name', 'Ahla Shabab'),
('00000000-0000-0000-0000-000000000003', 'app_description', 'منصة تعليمية متكاملة');
