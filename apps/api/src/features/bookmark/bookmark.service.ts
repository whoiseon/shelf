import type { CreateBookmarkInput } from '@shelf/shared';
import { createBookmarkRepository } from '@/features/bookmark/bookmark.repository';

const bookmarkRepository = createBookmarkRepository();

export function createBookmarkService() {
	return {
		findBookmarks: async () => {
			return bookmarkRepository.findAll();
		},

		createBookmark: async (input: CreateBookmarkInput) => {
			return bookmarkRepository.create({
				title: input.title,
				url: input.url,
				description: input.description ?? null,
			});
		},

		deleteBookmark: async (id: number) => {
			return bookmarkRepository.delete(id);
		},
	};
}
