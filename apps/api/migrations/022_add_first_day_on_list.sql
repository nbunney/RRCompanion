-- Add first_day_on_list column to risingStarsBestPositions table
-- This tracks the earliest day a fiction appeared on Rising Stars Main

ALTER TABLE risingStarsBestPositions 
ADD COLUMN first_day_on_list DATE NULL AFTER best_position,
ADD INDEX idx_first_day_on_list (first_day_on_list);

-- Populate the column with existing data from risingStars table
UPDATE risingStarsBestPositions rbp
SET first_day_on_list = (
  SELECT DATE(MIN(captured_at))
  FROM risingStars rs
  WHERE rs.fiction_id = rbp.fiction_id
    AND rs.genre = rbp.genre
);

