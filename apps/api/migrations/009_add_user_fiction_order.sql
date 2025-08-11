-- Migration: Add user fiction order table
-- This table stores the custom order of fictions in a user's favorites list

CREATE TABLE IF NOT EXISTS userFictionOrder (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    fiction_id INT NOT NULL,
    position INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    
    -- Ensure each user can only have one position per fiction
    UNIQUE KEY unique_user_fiction (user_id, fiction_id),
    
    -- Foreign key constraints
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (fiction_id) REFERENCES fictions(id) ON DELETE CASCADE,
    
    -- Index for efficient ordering queries
    INDEX idx_user_position (user_id, position)
);

-- Add comment to table
ALTER TABLE userFictionOrder COMMENT = 'Stores custom order of fictions in user favorites list'; 