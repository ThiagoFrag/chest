PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_invites` (
	`id` text PRIMARY KEY NOT NULL,
	`token` text NOT NULL,
	`role` text DEFAULT 'viewer' NOT NULL,
	`note` text,
	`created_by` text,
	`expires_at` integer NOT NULL,
	`used_at` integer,
	`used_by` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null,
	FOREIGN KEY (`used_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_invites`(`id`, `token`, `role`, `note`, `created_by`, `expires_at`, `used_at`, `used_by`, `created_at`) SELECT `id`, `token`, `role`, `note`, `created_by`, `expires_at`, `used_at`, `used_by`, `created_at` FROM `invites`;--> statement-breakpoint
DROP TABLE `invites`;--> statement-breakpoint
ALTER TABLE `__new_invites` RENAME TO `invites`;--> statement-breakpoint
CREATE UNIQUE INDEX `invites_token_unique` ON `invites` (`token`);--> statement-breakpoint
CREATE TABLE `__new_server_users` (
	`id` text PRIMARY KEY NOT NULL,
	`server_id` text NOT NULL,
	`user_id` text NOT NULL,
	`permissions` text DEFAULT '[]' NOT NULL,
	`added_by` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`added_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_server_users`(`id`, `server_id`, `user_id`, `permissions`, `added_by`, `created_at`) SELECT `id`, `server_id`, `user_id`, `permissions`, `added_by`, `created_at` FROM `server_users`;--> statement-breakpoint
DROP TABLE `server_users`;--> statement-breakpoint
ALTER TABLE `__new_server_users` RENAME TO `server_users`;--> statement-breakpoint
CREATE UNIQUE INDEX `server_users_server_user_idx` ON `server_users` (`server_id`,`user_id`);--> statement-breakpoint
CREATE INDEX `server_users_user_idx` ON `server_users` (`user_id`);--> statement-breakpoint
CREATE TABLE `__new_webhook_endpoints` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`url` text NOT NULL,
	`secret` text NOT NULL,
	`events_json` text DEFAULT '["*"]' NOT NULL,
	`server_id` text,
	`enabled` integer DEFAULT true NOT NULL,
	`created_by` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_delivery_at` integer,
	`last_delivery_status` text,
	`last_delivery_message` text,
	`consecutive_failures` integer DEFAULT 0 NOT NULL,
	FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`created_by`) REFERENCES `users`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_webhook_endpoints`(`id`, `name`, `url`, `secret`, `events_json`, `server_id`, `enabled`, `created_by`, `created_at`, `last_delivery_at`, `last_delivery_status`, `last_delivery_message`, `consecutive_failures`) SELECT `id`, `name`, `url`, `secret`, `events_json`, `server_id`, `enabled`, `created_by`, `created_at`, `last_delivery_at`, `last_delivery_status`, `last_delivery_message`, `consecutive_failures` FROM `webhook_endpoints`;--> statement-breakpoint
DROP TABLE `webhook_endpoints`;--> statement-breakpoint
ALTER TABLE `__new_webhook_endpoints` RENAME TO `webhook_endpoints`;--> statement-breakpoint
CREATE INDEX `webhook_server_idx` ON `webhook_endpoints` (`server_id`);--> statement-breakpoint
CREATE INDEX `webhook_enabled_idx` ON `webhook_endpoints` (`enabled`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
