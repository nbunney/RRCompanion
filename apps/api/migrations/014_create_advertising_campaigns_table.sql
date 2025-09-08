-- Migration 014: Create advertising_campaigns table
-- This table stores Royal Road advertising campaign data scraped by the Chrome extension

CREATE TABLE IF NOT EXISTS advertising_campaigns (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  username VARCHAR(255) NULL,
  title VARCHAR(500) NOT NULL,
  views INT DEFAULT 0,
  clicks INT DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0.00,
  follow INT DEFAULT 0,
  read_later INT DEFAULT 0,
  raw_data JSON NULL,
  scraped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  INDEX idx_user_id (user_id),
  INDEX idx_username (username),
  INDEX idx_scraped_at (scraped_at),
  INDEX idx_title (title(100))
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

