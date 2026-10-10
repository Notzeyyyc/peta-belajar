CREATE TABLE `materi_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`resource_id` text NOT NULL,
	`learning_style` text NOT NULL,
	`payload_json` text NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`resource_id`) REFERENCES `resources`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `materi_cache_resource_style_uk` ON `materi_cache` (`resource_id`,`learning_style`);--> statement-breakpoint
ALTER TABLE `resources` ADD `content` text;