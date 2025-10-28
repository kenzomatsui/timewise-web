-- Add clerk_id to users table for Clerk authentication
ALTER TABLE users ADD COLUMN clerk_id TEXT UNIQUE;

-- Make password_hash nullable since Clerk handles authentication
ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;

-- Create index for clerk_id lookups
CREATE INDEX idx_users_clerk_id ON users(clerk_id);
