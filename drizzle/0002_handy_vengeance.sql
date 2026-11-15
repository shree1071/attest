CREATE TABLE `audit_events` (
	`id` text PRIMARY KEY NOT NULL,
	`actor_id` text NOT NULL,
	`action` text NOT NULL,
	`target_type` text NOT NULL,
	`target_id` text NOT NULL,
	`reason` text,
	`metadata` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`actor_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `audit_actor_idx` ON `audit_events` (`actor_id`);--> statement-breakpoint
CREATE INDEX `audit_target_idx` ON `audit_events` (`target_type`,`target_id`);--> statement-breakpoint
ALTER TABLE `testimonials` ADD `rating` integer DEFAULT 5 NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `is_admin` integer DEFAULT false NOT NULL;--> statement-breakpoint
ALTER TABLE `users` ADD `is_restricted` integer DEFAULT false NOT NULL;