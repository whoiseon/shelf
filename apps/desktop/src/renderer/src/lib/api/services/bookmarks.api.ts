import { api } from '@renderer/lib/api/client';
import type {
	ApiResponse,
	Bookmark,
	CreateBookmarkInput,
	MoveBookmarkInput,
	PreviewBookmark,
	UpdateBookmarkInput,
} from '@shelf/shared';

export const bookmarksApi = {
	getBookmarks: async ({
		hasFolder = false,
	}: {
		hasFolder?: boolean;
	}): Promise<ApiResponse<Bookmark[]>> => {
		return api.get<ApiResponse<Bookmark[]>>(
			`/api/bookmarks?has_folder=${hasFolder ? 'true' : 'false'}`,
		);
	},
	previewBookmark: async (
		url: string,
	): Promise<ApiResponse<PreviewBookmark>> => {
		return api.post<ApiResponse<PreviewBookmark>>('/api/bookmarks/preview', {
			url,
		});
	},
	createBookmark: async (
		input: CreateBookmarkInput,
	): Promise<ApiResponse<Bookmark>> => {
		return api.post<ApiResponse<Bookmark>>('/api/bookmarks', input);
	},
	updateBookmark: async ({
		bookmarkId,
		input,
	}: {
		bookmarkId: number;
		input: UpdateBookmarkInput;
	}): Promise<ApiResponse<Bookmark>> => {
		return api.patch<ApiResponse<Bookmark>>(
			`/api/bookmarks/${bookmarkId}`,
			input,
		);
	},
	toggleFavorite: async (
		bookmarkId: number,
	): Promise<ApiResponse<{ isFavorite: boolean }>> => {
		return api.post(`/api/bookmarks/favorite/${bookmarkId}`);
	},
	deleteBookmark: async (bookmarkId: number) => {
		return api.delete(`/api/bookmarks/${bookmarkId}`);
	},
	moveBookmark: async ({
		bookmarkId,
		input,
	}: {
		bookmarkId: number;
		input: MoveBookmarkInput;
	}) => {
		return api.patch(`/api/bookmarks/${bookmarkId}/move`, input);
	},
};

export const bookmarkQueryKey = {
	all: ['bookmarks'] as const,
	getBookmarks: (hasFolder = false) =>
		['bookmarks', 'has_folder', hasFolder] as const,
	getAllBookmarks: () => ['bookmarks', 'has_folder', true] as const,
};
