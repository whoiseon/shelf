import { type BookmarkInsert, bookmarks } from '@shelf/db';
import type { UpdateBookmarkInput } from '@shelf/shared';
import { and, desc, eq, isNull } from 'drizzle-orm';
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
	} as const;
}
