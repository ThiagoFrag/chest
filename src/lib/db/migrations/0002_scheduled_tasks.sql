CREATE TABLE `scheduled_tasks` (
  `id` text PRIMARY KEY NOT NULL,
  `server_id` text NOT NULL,
  `task_type` text NOT NULL,
  `cron_expr` text NOT NULL,
  `params` text DEFAULT '{}' NOT NULL,
  `enabled` integer DEFAULT true NOT NULL,
  `last_run_at` integer,
  `last_run_status` text,
  `next_run_at` integer,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON DELETE cascade
);
