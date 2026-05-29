ALTER TABLE `servers` ADD COLUMN `host_port_map` integer;
--> statement-breakpoint
ALTER TABLE `servers` ADD COLUMN `map_installed` integer DEFAULT 0 NOT NULL;
--> statement-breakpoint
ALTER TABLE `servers` ADD COLUMN `map_type` text;
