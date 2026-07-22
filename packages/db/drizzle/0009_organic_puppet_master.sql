ALTER TABLE `bookmarks` ADD `favorite_position` integer;
--> statement-breakpoint
UPDATE `bookmarks`
SET `favorite_position` = (
	SELECT COUNT(*)
	FROM `bookmarks` AS `newer_favorite`
	WHERE `newer_favorite`.`is_favorite` = 1
		AND `newer_favorite`.`deleted_at` IS NULL
		AND (
			`newer_favorite`.`created_at` > `bookmarks`.`created_at`
			OR (
				`newer_favorite`.`created_at` = `bookmarks`.`created_at`
				AND `newer_favorite`.`id` > `bookmarks`.`id`
			)
		)
)
WHERE `is_favorite` = 1 AND `deleted_at` IS NULL;
