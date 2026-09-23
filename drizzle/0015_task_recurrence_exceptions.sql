CREATE TABLE task_recurrence_exceptions (
  id TEXT PRIMARY KEY NOT NULL,
  task_id TEXT NOT NULL,
  original_date TEXT NOT NULL,
  moved_date TEXT NOT NULL,
  created_at TEXT NOT NULL,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

CREATE UNIQUE INDEX task_recurrence_exceptions_task_original_unique
ON task_recurrence_exceptions(task_id, original_date);

CREATE INDEX task_recurrence_exceptions_task_id_idx
ON task_recurrence_exceptions(task_id);
