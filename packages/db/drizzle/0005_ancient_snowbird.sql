ALTER TABLE `folders` ADD `position` integer NOT NULL;--> statement-breakpoint
CREATE INDEX `folders_position_idx` ON `folders` (`position`);