CREATE TABLE IF NOT EXISTS users (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(60) NOT NULL,
  name VARCHAR(120) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_users_username (username)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS sessions (
  token_hash CHAR(64) NOT NULL PRIMARY KEY,
  user_id INT UNSIGNED NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_sessions_user (user_id),
  KEY idx_sessions_expires (expires_at),
  CONSTRAINT fk_sessions_user FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Searchable fields live in columns; everything else (contact, hook, email sequence,
-- send dates, outcome dates) lives in the `data` JSON document.
CREATE TABLE IF NOT EXISTS leads (
  id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  business VARCHAR(255) NOT NULL,
  country CHAR(2) NOT NULL,
  city VARCHAR(120) NOT NULL DEFAULT '',
  niche VARCHAR(120) NOT NULL DEFAULT '',
  phone VARCHAR(60) NOT NULL DEFAULT '',
  email VARCHAR(255) NOT NULL DEFAULT '',
  stage VARCHAR(20) NOT NULL DEFAULT 'need',
  score TINYINT NULL,
  dnc TINYINT(1) NOT NULL DEFAULT 0,
  data JSON NOT NULL,
  version INT UNSIGNED NOT NULL DEFAULT 1,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3),
  updated_by INT UNSIGNED NULL,
  KEY idx_leads_stage (stage),
  KEY idx_leads_country (country),
  KEY idx_leads_email (email),
  KEY idx_leads_updated (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS lead_events (
  id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  lead_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NULL,
  kind VARCHAR(16) NOT NULL DEFAULT 'note',
  text TEXT NOT NULL,
  local_time VARCHAR(16) NOT NULL DEFAULT '',
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  KEY idx_events_lead (lead_id),
  CONSTRAINT fk_events_lead FOREIGN KEY (lead_id) REFERENCES leads (id) ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE IF NOT EXISTS app_settings (
  k VARCHAR(64) NOT NULL PRIMARY KEY,
  v JSON NOT NULL,
  updated_at DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3) ON UPDATE CURRENT_TIMESTAMP(3)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
