CREATE TABLE `sync_queue` (
  `id` text PRIMARY KEY NOT NULL,
  `payload` text NOT NULL,
  `created_at` text NOT NULL,
  `attempts` integer DEFAULT 0 NOT NULL
);

CREATE INDEX `idx_sync_queue_created`
ON `sync_queue` (`created_at`);
