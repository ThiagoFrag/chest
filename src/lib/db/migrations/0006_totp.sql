ALTER TABLE `users` ADD COLUMN `totp_secret` text;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `totp_enabled_at` integer;
--> statement-breakpoint
ALTER TABLE `users` ADD COLUMN `backup_codes_json` text;
--> statement-breakpoint
ALTER TABLE `sessions` ADD COLUMN `passed_2fa` integer DEFAULT 1 NOT NULL;
