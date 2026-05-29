CREATE TABLE `server_users` (
  `id` text PRIMARY KEY NOT NULL,
  `server_id` text NOT NULL,
  `user_id` text NOT NULL,
  `permissions` text DEFAULT '[]' NOT NULL,
  `added_by` text NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`user_id`) REFERENCES `users`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE UNIQUE INDEX `server_users_server_user_idx` ON `server_users` (`server_id`, `user_id`);
--> statement-breakpoint
CREATE INDEX `server_users_user_idx` ON `server_users` (`user_id`);
