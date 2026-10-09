-- STEP 18F.23I.32F
-- My Life V2 Notes foundation
-- Prepared for web and desktop; synchronization is not enabled.

CREATE TABLE note_folders (
  id TEXT PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  sort_order INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT
);

CREATE INDEX note_folders_active_sort_idx
ON note_folders(deleted_at, sort_order, name);

CREATE TABLE notes (
  id TEXT PRIMARY KEY NOT NULL,
  folder_id TEXT,
  title TEXT NOT NULL DEFAULT '',
  content TEXT NOT NULL DEFAULT '',
  content_format TEXT NOT NULL DEFAULT 'html',
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  deleted_at TEXT,
  FOREIGN KEY (folder_id) REFERENCES note_folders(id)
);

CREATE INDEX notes_folder_idx
ON notes(folder_id);

CREATE INDEX notes_active_updated_idx
ON notes(deleted_at, updated_at);
