import type {
	CreateBookmarkInput,
	MoveBookmarkInput,
	PreviewBookmark,
	ReorderFavoriteBookmarksInput,
	UpdateBookmarkInput,
} from '@shelf/shared';
import { isUniqueConstraintError, parseMetadata } from '@/common/utils';
import { createBookmarkRepository } from '@/features/bookmarks/bookmarks.repository';

const bookmarkRepository = createBookmarkRepository();

export function createBookmarkService() {
	return {
		findBookmarks: async (hasFolder: boolean) => {
			return bookmarkRepository.findAll(hasFolder);
		},

		createBookmark: async (input: CreateBookmarkInput) => {
			const existing = await bookmarkRepository.findByUrl(input.url);

			if (existing && existing.deletedAt === null) {
				throw new BookmarkAlreadyExistsError();
			}

			if (existing?.deletedAt) {
				return bookmarkRepository.restore(existing.id, input);
			}

			try {
				return await bookmarkRepository.create(input);
			} catch (error: unknown) {
				if (isUniqueConstraintError(error)) {
					throw new BookmarkAlreadyExistsError();
				}

				throw error;
			}
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

		toggleFavorite: async (id: number) => {
			const result = await bookmarkRepository.toggleFavorite(id);

			if (!result) {
				throw new BookmarkNotFoundError();
			}

			return result.isFavorite;
		},

		reorderFavorites: async (input: ReorderFavoriteBookmarksInput) => {
			return bookmarkRepository.reorderFavorites(input);
		},

		moveBookmark: async (id: number, input: MoveBookmarkInput) => {
			const result = await bookmarkRepository.move(id, input);

			if (result.status === 'bookmark_not_found') {
				throw new BookmarkNotFoundError();
			}

			if (result.status === 'folder_not_found') {
				throw new BookmarkTargetFolderNotFoundError();
			}

			return result.bookmark;
		},

		restoreBookmark: async (id: number) => {
			const result = await bookmarkRepository.restoreDeleted(id);

			if (result.status === 'bookmark_not_found') {
				throw new BookmarkNotFoundError();
			}

			return result.bookmark;
		},
	};
}

export class BookmarkAlreadyExistsError extends Error {
	constructor() {
		super('이미 등록된 북마크 입니다.');
		this.name = 'BookmarkAlreadyExistsError';
	}
}

export class BookmarkNotFoundError extends Error {
	constructor() {
		super('북마크를 찾을 수 없습니다.');
		this.name = 'BookmarkNotFoundError';
	}
}

export class BookmarkTargetFolderNotFoundError extends Error {
	constructor() {
		super('이동할 폴더를 찾을 수 없습니다.');
		this.name = 'BookmarkTargetFolderNotFoundError';
	}
}
