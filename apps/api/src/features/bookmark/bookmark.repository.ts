import { type BookmarkInsert, bookmarks } from '@shelf/db';
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
