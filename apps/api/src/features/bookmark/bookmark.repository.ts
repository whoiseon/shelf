import { type BookmarkInsert, bookmarks } from '@shelf/db';
import type { UpdateBookmarkInput } from '@shelf/shared';
import { and, desc, eq, isNull, sql } from 'drizzle-orm';
import { db } from '@/common/database';

export function createBookmarkRepository() {
	return {
		findAll: async () => {
			return db
				.select()
				.from(bookmarks)
				.where(isNull(bookmarks.deletedAt))
				.orderBy(desc(bookmarks.createdAt));
		},
		findById: async (id: number) => {
			return db.query.bookmarks.findFirst({
				where: and(eq(bookmarks.id, id), isNull(bookmarks.deletedAt)),
			});
		},
		findByUrl: async (url: string) => {
			return db.query.bookmarks.findFirst({
				where: eq(bookmarks.url, url),
			});
		},
		create: async (input: BookmarkInsert) => {
			return db.insert(bookmarks).values(input).returning().get();
		},
		update: async (id: number, input: UpdateBookmarkInput) => {
			const values = Object.fromEntries(
				Object.entries(input).filter(([, value]) => value !== undefined),
			);
			return db
				.update(bookmarks)
				.set({
					...values,
					updatedAt: new Date(),
				})
				.where(and(eq(bookmarks.id, id), isNull(bookmarks.deletedAt)))
				.returning()
				.get();
		},
		delete: async (id: number) => {
			return db
				.update(bookmarks)
				.set({
					deletedAt: new Date(),
				})
				.where(eq(bookmarks.id, id))
				.returning()
				.get();
		},
		restore: async (id: number, input: UpdateBookmarkInput) => {
			const values = Object.fromEntries(
				Object.entries(input).filter(([, value]) => value !== undefined),
			);
			return db
				.update(bookmarks)
				.set({
					...values,
					deletedAt: null,
					updatedAt: new Date(),
				})
				.where(eq(bookmarks.id, id))
				.returning()
				.get();
		},
		toggleFavorite: async (id: number) => {
			return db
				.update(bookmarks)
				.set({
					isFavorite: sql`NOT ${bookmarks.isFavorite}`,
					updatedAt: new Date(),
				})
				.where(and(eq(bookmarks.id, id), isNull(bookmarks.deletedAt)))
				.returning({
					isFavorite: bookmarks.isFavorite,
				})
				.get();
		},
	} as const;
}
