-- What a member account is allowed to do, set by an admin. Admins can always do everything.
-- Keys: team_view, templates, import, reports (true/false).
ALTER TABLE users ADD COLUMN perms TEXT NOT NULL DEFAULT '{}';
