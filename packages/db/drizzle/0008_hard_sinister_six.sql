PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_folders` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`position` integer NOT NULL,
	`parent_folder_id` integer,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer,
	FOREIGN KEY (`parent_folder_id`) REFERENCES `folders`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
INSERT INTO `__new_folders`("id", "name", "position", "parent_folder_id", "created_at", "updated_at", "deleted_at") SELECT "id", "name", "position", "parent_folder_id", "created_at", "updated_at", "deleted_at" FROM `folders`;--> statement-breakpoint
DROP TABLE `folders`;--> statement-breakpoint
ALTER TABLE `__new_folders` RENAME TO `folders`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `folders_parent_position_idx` ON `folders` (`parent_folder_id`,`position`);--> statement-breakpoint
ALTER TABLE `bookmarks` ADD `position` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
WITH `ranked_bookmarks` AS (
	SELECT
		`id`,
		ROW_NUMBER() OVER (
			PARTITION BY `folder_id`
			ORDER BY `created_at`, `id`
		) - 1 AS `next_position`
	FROM `bookmarks`
	WHERE `deleted_at` IS NULL
)
UPDATE `bookmarks`
SET `position` = (
	SELECT `next_position`
	FROM `ranked_bookmarks`
	WHERE `ranked_bookmarks`.`id` = `bookmarks`.`id`
)
WHERE `id` IN (SELECT `id` FROM `ranked_bookmarks`);--> statement-breakpoint
CREATE INDEX `bookmarks_folder_position_idx` ON `bookmarks` (`folder_id`,`position`);
