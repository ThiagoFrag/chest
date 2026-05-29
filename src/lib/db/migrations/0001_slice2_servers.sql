-- Slice 2: extender tabela servers com colunas pra hosting completo
-- Drop e recreate (servers table não tinha dados antes)

DROP TABLE IF EXISTS `backups`;
--> statement-breakpoint
DROP TABLE IF EXISTS `metric_snapshots`;
--> statement-breakpoint
DROP TABLE IF EXISTS `player_events`;
--> statement-breakpoint
DROP TABLE IF EXISTS `servers`;
--> statement-breakpoint

CREATE TABLE `servers` (
  `id` text PRIMARY KEY NOT NULL,
  `slug` text NOT NULL,
  `container_name` text NOT NULL,
  `display_name` text NOT NULL,
  `modloader_type` text DEFAULT 'VANILLA' NOT NULL,
  `mc_version` text NOT NULL,
  `loader_version` text,
  `memory_mb` integer DEFAULT 4096 NOT NULL,
  `max_players` integer DEFAULT 10 NOT NULL,
  `difficulty` text DEFAULT 'normal' NOT NULL,
  `motd` text,
  `host_port_http` integer NOT NULL,
  `host_port_rcon` integer NOT NULL,
  `data_volume` text NOT NULL,
  `rcon_password_encrypted` text NOT NULL,
  `drasl_enabled` integer DEFAULT false NOT NULL,
  `status` text DEFAULT 'creating' NOT NULL,
  `status_message` text,
  `discord_channel_id` text,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  `updated_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `servers_slug_unique` ON `servers` (`slug`);
--> statement-breakpoint
CREATE UNIQUE INDEX `servers_container_name_unique` ON `servers` (`container_name`);
--> statement-breakpoint

CREATE TABLE `backups` (
  `id` text PRIMARY KEY NOT NULL,
  `server_id` text NOT NULL,
  `path` text NOT NULL,
  `size_bytes` integer NOT NULL,
  `notes` text,
  `created_at` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON DELETE cascade
);
--> statement-breakpoint

CREATE TABLE `metric_snapshots` (
  `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
  `server_id` text NOT NULL,
  `timestamp` integer DEFAULT (unixepoch()) NOT NULL,
  `tps` real,
  `mspt` real,
  `cpu_percent` real,
  `ram_used_mb` integer,
  `players_online` integer,
  FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON DELETE cascade
);
--> statement-breakpoint

CREATE TABLE `player_events` (
  `id` text PRIMARY KEY NOT NULL,
  `server_id` text NOT NULL,
  `player_name` text NOT NULL,
  `event` text NOT NULL,
  `reason` text,
  `performed_by` text,
  `timestamp` integer DEFAULT (unixepoch()) NOT NULL,
  FOREIGN KEY (`server_id`) REFERENCES `servers`(`id`) ON DELETE cascade
);
