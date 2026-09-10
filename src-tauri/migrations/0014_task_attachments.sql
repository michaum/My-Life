CREATE TABLE `task_attachments` (
  `id` text PRIMARY KEY NOT NULL,
  `task_id` text NOT NULL,
  `name` text NOT NULL,
  `mime_type` text NOT NULL,
  `data` text NOT NULL,
  `created_at` text NOT NULL,
  FOREIGN KEY (`task_id`) REFERENCES `tasks`(`id`) ON UPDATE no action ON DELETE cascade
);

CREATE INDEX `idx_task_attachments_task`
ON `task_attachments` (`task_id`);
