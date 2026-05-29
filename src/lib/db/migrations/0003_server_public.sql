ALTER TABLE `servers` ADD COLUMN `public_url` text;
--> statement-breakpoint
ALTER TABLE `servers` ADD COLUMN `public_mode` text;
--> statement-breakpoint
ALTER TABLE `servers` ADD COLUMN `cf_dns_record_id` text;
