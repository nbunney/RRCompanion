-- Migration: Remove overly restrictive unique constraint from risingStars table
-- This allows multiple entries per fiction-genre combination, which is needed for proper Rising Stars data collection

-- Drop the unique constraint if it exists
ALTER TABLE risingStars DROP INDEX unique_rising_star;

-- Add a comment to document the change
ALTER TABLE risingStars COMMENT = 'Rising Stars table - allows multiple entries per fiction-genre combination for proper data collection';
