-- Create competitive zone cache table for fast position lookups
-- This table stores pre-calculated positions for fictions competing to reach Rising Stars Main
-- Updated every 5 minutes with intelligent movement tracking

CREATE TABLE IF NOT EXISTS competitiveZoneCache (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fiction_id INT NOT NULL,
  calculated_position INT NOT NULL,
  last_move ENUM('up', 'down', 'same', 'new') DEFAULT 'new',
  last_position INT NULL,
  last_move_date DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  
  UNIQUE KEY unique_fiction (fiction_id),
  FOREIGN KEY (fiction_id) REFERENCES fiction(id) ON DELETE CASCADE,
  
  INDEX idx_calculated_position (calculated_position),
  INDEX idx_last_move (last_move),
  INDEX idx_updated_at (updated_at)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

