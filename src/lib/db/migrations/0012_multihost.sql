CREATE TABLE `hosts` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`endpoint` text,
	`tls_ca_encrypted` text,
	`tls_cert_encrypted` text,
	`tls_key_encrypted` text,
	`is_default` integer DEFAULT false NOT NULL,
	`enabled` integer DEFAULT true NOT NULL,
	`host_address` text,
	`created_at` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
INSERT INTO `hosts` (`id`, `name`, `endpoint`, `is_default`, `enabled`, `created_at`) VALUES ('local', 'Local', NULL, true, true, (unixepoch()));--> statement-breakpoint
ALTER TABLE `servers` ADD COLUMN `host_id` text DEFAULT 'local' NOT NULL REFERENCES `hosts`(`id`);
