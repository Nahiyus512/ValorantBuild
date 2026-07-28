CREATE TABLE `user_loadouts` (
	`user_email` text PRIMARY KEY NOT NULL,
	`player_name` text DEFAULT 'ValorantBuild' NOT NULL,
	`player_level` text DEFAULT '100' NOT NULL,
	`equipped_json` text DEFAULT '{}' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
