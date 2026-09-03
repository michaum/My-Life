ALTER TABLE `projects` ADD `icon` text DEFAULT 'folder' NOT NULL;--> statement-breakpoint
ALTER TABLE `sections` ADD `sort_order` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `end_time` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `font_color` text DEFAULT '#1d2128' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `sort_order` integer DEFAULT 0 NOT NULL;