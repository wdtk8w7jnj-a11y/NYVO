CREATE TABLE `highlight_control` (
	`id` text PRIMARY KEY NOT NULL,
	`day` text DEFAULT '' NOT NULL,
	`used` integer DEFAULT 0 NOT NULL,
	`lock_until` integer DEFAULT 0 NOT NULL,
	`token` text,
	`blocked_until` integer DEFAULT 0 NOT NULL,
	`last_run` integer,
	`last_success` integer,
	`error` text
);
--> statement-breakpoint
CREATE TABLE `highlight_jobs` (
	`id` integer PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`finished_at` integer NOT NULL,
	`next_check` integer NOT NULL,
	`checked_at` integer,
	`state` text DEFAULT 'waiting' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `highlight_reviews` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`checked_at` integer NOT NULL,
	`state` text DEFAULT 'pending' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `highlight_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`payload` text NOT NULL,
	`checked_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `highlight_videos` (
	`id` text PRIMARY KEY NOT NULL,
	`match_id` integer NOT NULL,
	`payload` text NOT NULL,
	`first_seen` integer NOT NULL,
	`checked_at` integer NOT NULL,
	`state` text DEFAULT 'available' NOT NULL
);
