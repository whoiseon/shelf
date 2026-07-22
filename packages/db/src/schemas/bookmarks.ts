import { index, integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';
import { folders } from './folders';

export const bookmarks = sqliteTable(
	'bookmarks',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),

		title: text('title').notNull(),
		url: text('url').notNull().unique(),
		description: text('description'),

		siteName: text('site_name'),
		faviconUrl: text('favicon_url'),
		imageUrl: text('image_url'),

		isFavorite: integer('is_favorite', {
			mode: 'boolean',
		})
			.notNull()
			.default(false),
		favoritePosition: integer('favorite_position'),

		folderId: integer('folder_id').references(() => folders.id, {
			onDelete: 'cascade',
			onUpdate: 'cascade',
		}),
		position: integer('position').notNull().default(0),

		createdAt: integer('created_at', {
			mode: 'timestamp_ms',
		})
			.notNull()
			.$defaultFn(() => new Date()),
		updatedAt: integer('updated_at', {
			mode: 'timestamp_ms',
		})
			.notNull()
			.$defaultFn(() => new Date()),
		deletedAt: integer('deleted_at', {
			mode: 'timestamp_ms',
		}),
	},
	(table) => [
		index('bookmarks_folder_position_idx').on(table.folderId, table.position),
	],
);

export type BookmarkSelect = typeof bookmarks.$inferSelect;
export type BookmarkInsert = typeof bookmarks.$inferInsert;
