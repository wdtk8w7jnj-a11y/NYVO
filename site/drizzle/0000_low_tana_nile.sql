CREATE TABLE `pilot_cache` (
	`key` text PRIMARY KEY NOT NULL,
	`fetched_at` integer NOT NULL,
	`expires_at` integer NOT NULL,
	`payload` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pilot_control` (
	`id` text PRIMARY KEY NOT NULL,
	`day` text DEFAULT '' NOT NULL,
	`used` integer DEFAULT 0 NOT NULL,
	`lock_until` integer DEFAULT 0 NOT NULL,
	`token` text,
	`last_call` integer DEFAULT 0 NOT NULL,
	`blocked_until` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `pilot_fixtures` (
	`id` integer PRIMARY KEY NOT NULL,
	`league` integer NOT NULL,
	`season` integer NOT NULL
);
