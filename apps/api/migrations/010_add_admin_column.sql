-- Add admin column to user table
ALTER TABLE users ADD COLUMN admin BOOLEAN DEFAULT FALSE;

-- Create index for admin users (optional, for performance)
CREATE INDEX idx_users_admin ON users(admin);

-- Update existing migration log
INSERT INTO migration_log (migration_name, applied_at) VALUES ('010_add_admin_column', NOW());
