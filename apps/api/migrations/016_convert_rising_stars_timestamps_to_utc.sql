-- Convert existing Rising Stars timestamps from local time to UTC
-- This assumes the existing timestamps are in Pacific Time (PDT/PST)

-- Update risingStars table timestamps
-- Convert from Pacific Time to UTC (add 7 hours for PDT, 8 hours for PST)
-- We'll use 7 hours as a conservative estimate for PDT
UPDATE risingStars 
SET captured_at = DATE_ADD(captured_at, INTERVAL 7 HOUR)
WHERE captured_at IS NOT NULL;

-- Also update fictionHistory table timestamps for consistency
UPDATE fictionHistory 
SET captured_at = DATE_ADD(captured_at, INTERVAL 7 HOUR)
WHERE captured_at IS NOT NULL;
