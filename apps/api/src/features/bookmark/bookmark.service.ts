import { createBookmarkRepository } from '@/features/bookmark/bookmark.repository';

const bookmarkRepository = createBookmarkRepository();

export function createBookmarkService() {
	return {
		findBookmarks: async () => {
			return bookmarkRepository.findAll();
		},
	};
}
