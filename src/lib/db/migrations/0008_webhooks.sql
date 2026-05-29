CREATE TABLE `webhook_endpoints` (
  `id` text PRIMARY KEY NOT NULL,
  `name` text NOT NULL,
  `url` text NOT NULL,
  `secret` text NOT NULL,
  `events_json` text DEFAULT '["*"]' NOT NULL,
  `server_id` text,
  `enabled` integer DEFAULT 1 NOT NULL,
  `created_by` text NOT NULL,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `last_delivery_at` integer,
  `last_delivery_status` text,
  `last_delivery_message` text,
  `consecutive_failures` integer DEFAULT 0 NOT NULL,
  FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON DELETE CASCADE
);
--> statement-breakpoint
CREATE INDEX `webhook_server_idx` ON `webhook_endpoints` (`server_id`);
--> statement-breakpoint
CREATE INDEX `webhook_enabled_idx` ON `webhook_endpoints` (`enabled`);
