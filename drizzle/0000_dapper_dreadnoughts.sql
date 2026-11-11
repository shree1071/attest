CREATE TABLE `credit_transactions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`amount` integer NOT NULL,
	`transaction_type` text NOT NULL,
	`reference_testimonial_id` text,
	`reference_request_id` text,
	`description` text,
	`balance_after` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	CONSTRAINT "credit_tx_amount_nonzero" CHECK("credit_transactions"."amount" <> 0),
	CONSTRAINT "credit_tx_balance_nonnegative" CHECK("credit_transactions"."balance_after" >= 0)
);
--> statement-breakpoint
CREATE UNIQUE INDEX `credit_tx_testimonial_uq` ON `credit_transactions` (`reference_testimonial_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `credit_tx_request_uq` ON `credit_transactions` (`reference_request_id`);--> statement-breakpoint
CREATE INDEX `credit_tx_user_idx` ON `credit_transactions` (`user_id`);--> statement-breakpoint
CREATE TABLE `products` (
	`id` text PRIMARY KEY NOT NULL,
	`owner_id` text NOT NULL,
	`name` text NOT NULL,
	`description` text NOT NULL,
	`website_url` text NOT NULL,
	`category` text DEFAULT 'SaaS' NOT NULL,
	`logo_key` text,
	`slug` text NOT NULL,
	`is_public` integer DEFAULT true NOT NULL,
	`accepting_testimonials` integer DEFAULT true NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`owner_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `products_owner_uq` ON `products` (`owner_id`);--> statement-breakpoint
CREATE UNIQUE INDEX `products_slug_uq` ON `products` (`slug`);--> statement-breakpoint
CREATE INDEX `products_public_idx` ON `products` (`is_public`);--> statement-breakpoint
CREATE TABLE `sessions` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` integer NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `sessions_user_idx` ON `sessions` (`user_id`);--> statement-breakpoint
CREATE TABLE `testimonial_requests` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`fulfilled_testimonial_id` text,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `requests_product_status_idx` ON `testimonial_requests` (`product_id`,`status`);--> statement-breakpoint
CREATE UNIQUE INDEX `requests_fulfilled_uq` ON `testimonial_requests` (`fulfilled_testimonial_id`);--> statement-breakpoint
CREATE TABLE `testimonials` (
	`id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`author_id` text NOT NULL,
	`content` text NOT NULL,
	`source_type` text NOT NULL,
	`status` text DEFAULT 'pending' NOT NULL,
	`identity_snapshot` text NOT NULL,
	`consent_at` integer NOT NULL,
	`submitted_at` integer NOT NULL,
	`approved_at` integer,
	`rejected_at` integer,
	`display_order` integer DEFAULT 0 NOT NULL,
	`created_at` integer NOT NULL,
	FOREIGN KEY (`product_id`) REFERENCES `products`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`author_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `testimonials_product_author_uq` ON `testimonials` (`product_id`,`author_id`);--> statement-breakpoint
CREATE INDEX `testimonials_product_status_idx` ON `testimonials` (`product_id`,`status`);--> statement-breakpoint
CREATE INDEX `testimonials_author_idx` ON `testimonials` (`author_id`);--> statement-breakpoint
CREATE TABLE `users` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text,
	`name` text NOT NULL,
	`headline` text,
	`headline_source` text DEFAULT 'self_reported' NOT NULL,
	`identity_source` text DEFAULT 'demo' NOT NULL,
	`provider` text,
	`provider_subject` text,
	`profile_url` text,
	`avatar_url` text,
	`identity_observed_at` integer,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_email_uq` ON `users` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_provider_subject_uq` ON `users` (`provider`,`provider_subject`);