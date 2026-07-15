import { integer, sqliteTable, text } from 'drizzle-orm/sqlite-core';

export const bookmarks = sqliteTable('bookmarks', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	title: text('title').notNull(),
	url: text('url').unique(),
	description: text('description'),
	faviconUrl: text('favicon_url'),
	isFavorite: integer('is_favorite', {
		mode: 'boolean',
	}),
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
});

export type BookmarkSelect = typeof bookmarks.$inferSelect;
export type BookmarkInsert = typeof bookmarks.$inferInsert;
