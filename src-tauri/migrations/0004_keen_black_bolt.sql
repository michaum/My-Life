ALTER TABLE `tasks` ADD `due_time` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `emoji` text DEFAULT '' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `font_family` text DEFAULT 'Arial' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `font_size` text DEFAULT '11' NOT NULL;--> statement-breakpoint
ALTER TABLE `tasks` ADD `font_style` text DEFAULT 'normal' NOT NULL;--> statement-breakpoint
ALTER TABLE `workspace` ADD `filter_labels` text DEFAULT '{"priority":{"High":"High","Medium":"Medium","Low":"Low"},"sort":{"Default":"Sort: default","Due date":"Due date","Priority":"Priority","Name":"Name"}}' NOT NULL;