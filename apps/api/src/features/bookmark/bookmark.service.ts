import type { CreateBookmarkInput, UpdateBookmarkInput } from '@shelf/shared';
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

		updateBookmark: async (id: number, input: UpdateBookmarkInput) => {
			return bookmarkRepository.update(id, input);
		},

		deleteBookmark: async (id: number) => {
			return bookmarkRepository.delete(id);
		},
	};
}
