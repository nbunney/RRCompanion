-- Migration: Create retention_analytics table
-- This table stores user retention data from Royal Road author dashboard analytics

CREATE TABLE IF NOT EXISTS retention_analytics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NULL,
  username VARCHAR(255) NULL,
  fiction_id INT NULL,
  chapters JSON NOT NULL,
  summary JSON NOT NULL,
  raw_data JSON NOT NULL,
  scraped_at TIMESTAMP NOT NULL,
  url VARCHAR(500) NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  -- Indexes for efficient querying
  INDEX idx_user_id (user_id),
  INDEX idx_fiction_id (fiction_id),
  INDEX idx_username (username),
  INDEX idx_scraped_at (scraped_at),
  INDEX idx_created_at (created_at),
  
  -- Foreign key constraints (optional, for data integrity)
  -- FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
  -- FOREIGN KEY (fiction_id) REFERENCES fictions(id) ON DELETE SET NULL
);

-- Add comments to describe the table structure
ALTER TABLE retention_analytics COMMENT = 'Stores user retention analytics data from Royal Road author dashboard';

