-- Create coupon_codes table
CREATE TABLE IF NOT EXISTS coupon_codes (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(20) NOT NULL UNIQUE,
  discount_percent INT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  used_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  INDEX idx_code (code),
  INDEX idx_is_active (is_active),
  INDEX idx_expires_at (expires_at)
);

-- Update existing migration log
INSERT INTO migration_log (migration_name, applied_at) VALUES ('011_create_coupon_codes_table', NOW());
