import { bookmarks } from '@shelf/db';
import { db } from '@/common/database';

export function createBookmarkRepository() {
	return {
		findAll: async () => {
			return db.select().from(bookmarks);
		},
	} as const;
}
