-- Migration: Round all existing Rising Stars timestamps to the nearest hour
-- This makes existing data consistent with the new single-timestamp-per-run approach

-- First, let's see what we're working with
SELECT 'Before migration - sample timestamps:' as info;
SELECT DISTINCT captured_at FROM risingStars ORDER BY captured_at DESC LIMIT 10;

-- Update all Rising Stars entries to round their timestamps to the nearest hour
UPDATE risingStars 
SET captured_at = DATE_FORMAT(
  captured_at, 
  '%Y-%m-%d %H:00:00'
) 
WHERE captured_at IS NOT NULL;

-- Verify the changes
SELECT 'After migration - sample timestamps:' as info;
SELECT DISTINCT captured_at FROM risingStars ORDER BY captured_at DESC LIMIT 10;

-- Show summary of changes
SELECT 'Migration completed - all timestamps rounded to nearest hour' as status;
