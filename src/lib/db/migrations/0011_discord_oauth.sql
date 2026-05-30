PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_users` (
	`id` text PRIMARY KEY NOT NULL,
	`username` text NOT NULL,
	`password_hash` text,
	`role` text DEFAULT 'admin' NOT NULL,
	`totp_secret` text,
	`totp_enabled_at` integer,
	`backup_codes_json` text,
	`discord_id` text,
	`discord_username` text,
	`discord_avatar` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL,
	`last_login_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_users`(`id`, `username`, `password_hash`, `role`, `totp_secret`, `totp_enabled_at`, `backup_codes_json`, `discord_id`, `discord_username`, `discord_avatar`, `created_at`, `last_login_at`) SELECT `id`, `username`, `password_hash`, `role`, `totp_secret`, `totp_enabled_at`, `backup_codes_json`, NULL, NULL, NULL, `created_at`, `last_login_at` FROM `users`;--> statement-breakpoint
DROP TABLE `users`;--> statement-breakpoint
ALTER TABLE `__new_users` RENAME TO `users`;--> statement-breakpoint
CREATE UNIQUE INDEX `users_username_unique` ON `users` (`username`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_discord_id_unique` ON `users` (`discord_id`);--> statement-breakpoint
PRAGMA foreign_keys=ON;
