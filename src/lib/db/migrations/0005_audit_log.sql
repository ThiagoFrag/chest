CREATE TABLE `audit_events` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `timestamp` integer DEFAULT (unixepoch()) NOT NULL,
  `user_id` text,
  `username` text,
  `action` text NOT NULL,
  `resource_type` text,
  `resource_id` text,
  `ip_address` text,
  `user_agent` text,
  `details` text,
  `status` text DEFAULT 'ok' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `audit_timestamp_idx` ON `audit_events` (`timestamp` DESC);
--> statement-breakpoint
CREATE INDEX `audit_user_idx` ON `audit_events` (`user_id`);
--> statement-breakpoint
CREATE INDEX `audit_action_idx` ON `audit_events` (`action`);
