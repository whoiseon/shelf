import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const bookmarks = sqliteTable('bookmarks', {
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
});

export type BookmarkSelect = typeof bookmarks.$inferSelect;
export type BookmarkInsert = typeof bookmarks.$inferInsert;
