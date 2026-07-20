PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_bookmarks` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`url` text NOT NULL,
	`description` text,
	`site_name` text,
	`favicon_url` text,
	`image_url` text,
	`is_favorite` integer DEFAULT false,
	`created_at` integer NOT NULL,
	`updated_at` integer NOT NULL,
	`deleted_at` integer
);
--> statement-breakpoint
INSERT INTO `__new_bookmarks`("id", "title", "url", "description", "site_name", "favicon_url", "image_url", "is_favorite", "created_at", "updated_at", "deleted_at") SELECT "id", "title", COALESCE("url", 'about:blank#bookmark-' || "id"), "description", NULL, "favicon_url", NULL, "is_favorite", "created_at", "updated_at", "deleted_at" FROM `bookmarks`;--> statement-breakpoint
DROP TABLE `bookmarks`;--> statement-breakpoint
ALTER TABLE `__new_bookmarks` RENAME TO `bookmarks`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `bookmarks_url_unique` ON `bookmarks` (`url`);
