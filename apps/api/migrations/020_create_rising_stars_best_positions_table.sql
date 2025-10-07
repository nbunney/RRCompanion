-- Create risingStarsBestPositions table to preserve historical best positions
CREATE TABLE IF NOT EXISTS risingStarsBestPositions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  fiction_id INT NOT NULL,
  genre VARCHAR(100) NOT NULL,
  best_position INT NOT NULL,
  first_achieved_at DATETIME NOT NULL,
  last_updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  
  -- Composite unique key on fiction_id and genre
  UNIQUE KEY unique_fiction_genre (fiction_id, genre),
  
  -- Foreign key to fiction table
  FOREIGN KEY (fiction_id) REFERENCES fiction(id) ON DELETE CASCADE,
  
  -- Index for faster lookups
  INDEX idx_genre (genre),
  INDEX idx_best_position (best_position),
  INDEX idx_fiction_genre (fiction_id, genre)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

