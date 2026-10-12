-- My Life V2: add task classification to existing databases.
-- Requires a database where this column does not yet exist.
ALTER TABLE tasks ADD COLUMN classification TEXT NOT NULL DEFAULT 'Task';
