ALTER TABLE `users` ADD COLUMN `role` text DEFAULT 'admin' NOT NULL;
--> statement-breakpoint
CREATE TABLE `invites` (
  `id` text PRIMARY KEY NOT NULL,
  `token` text NOT NULL,
  `role` text DEFAULT 'viewer' NOT NULL,
  `note` text,
  `created_by` text NOT NULL,
  `expires_at` integer NOT NULL,
  `used_at` integer,
  `used_by` text,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `invites_token_unique` ON `invites` (`token`);
