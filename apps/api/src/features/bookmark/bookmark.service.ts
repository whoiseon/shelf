import type {
	CreateBookmarkInput,
	PreviewBookmark,
	UpdateBookmarkInput,
} from '@shelf/shared';
import { parseMetadata } from '@/common/utils';
import { createBookmarkRepository } from '@/features/bookmark/bookmark.repository';

const bookmarkRepository = createBookmarkRepository();

export function createBookmarkService() {
	return {
		findBookmarks: async () => {
			return bookmarkRepository.findAll();
		},

		createBookmark: async (input: CreateBookmarkInput) => {
			return bookmarkRepository.create(input);
		},

		updateBookmark: async (id: number, input: UpdateBookmarkInput) => {
			return bookmarkRepository.update(id, input);
		},

		deleteBookmark: async (id: number) => {
			return bookmarkRepository.delete(id);
		},

		previewUrl: async (
			url: string,
		): Promise<{ payload: PreviewBookmark | null; message?: string }> => {
			const metadata = await parseMetadata(url);

			if (!metadata.payload) {
				return {
					payload: null,
					message: metadata.message,
				};
			}

			return {
				payload: metadata.payload,
			};
		},
	};
}
