-- Team management from the dashboard: roles (admin can manage people) and deactivation instead of deleting.
-- Existing users become admins so nobody loses access.
ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'admin';
ALTER TABLE users ADD COLUMN active INTEGER NOT NULL DEFAULT 1;
