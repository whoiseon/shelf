import {
	bookmarkQueryKey,
	bookmarksApi,
} from '@renderer/lib/api/services/bookmarks.api';
import { foldersQueryKey } from '@renderer/lib/api/services/folders.api';
import type { ApiResponse, Bookmark, FolderTree } from '@shelf/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type BookmarkQueriesSnapshot = Array<
	[readonly unknown[], ApiResponse<Bookmark[]> | undefined]
>;

type FavoriteToggleContext = {
	bookmarkQueries: BookmarkQueriesSnapshot;
	folders: ApiResponse<FolderTree[]> | undefined;
};

function updateBookmarks(
	bookmarks: Bookmark[],
	bookmarkId: number,
	isFavorite?: boolean,
) {
	return bookmarks.map((bookmark) =>
		bookmark.id === bookmarkId
			? {
					...bookmark,
					isFavorite: isFavorite ?? !bookmark.isFavorite,
				}
			: bookmark,
	);
}

function updateFolderTree(
	folders: FolderTree[],
	bookmarkId: number,
	isFavorite?: boolean,
): FolderTree[] {
	return folders.map((folder) => ({
		...folder,
		bookmarks: folder.bookmarks
			? updateBookmarks(folder.bookmarks, bookmarkId, isFavorite)
			: folder.bookmarks,
		children: updateFolderTree(folder.children, bookmarkId, isFavorite),
	}));
}

export function useFavoriteToggle() {
	const queryClient = useQueryClient();

	const updateFavoriteCaches = (bookmarkId: number, isFavorite?: boolean) => {
		queryClient.setQueriesData<ApiResponse<Bookmark[]>>(
			{ queryKey: ['bookmarks'] },
			(current) =>
				current
					? {
							...current,
							payload: updateBookmarks(current.payload, bookmarkId, isFavorite),
						}
					: current,
		);

		queryClient.setQueryData<ApiResponse<FolderTree[]>>(
			foldersQueryKey.getFolders,
			(current) =>
				current
					? {
							...current,
							payload: updateFolderTree(
								current.payload,
								bookmarkId,
								isFavorite,
							),
						}
					: current,
		);
	};

	return useMutation<
		Awaited<ReturnType<typeof bookmarksApi.toggleFavorite>>,
		Error,
		number,
		FavoriteToggleContext
	>({
		mutationFn: bookmarksApi.toggleFavorite,
		onMutate: async (bookmarkId) => {
			await Promise.all([
				queryClient.cancelQueries({ queryKey: ['bookmarks'] }),
				queryClient.cancelQueries({ queryKey: foldersQueryKey.getFolders }),
			]);

			const bookmarkQueries = queryClient.getQueriesData<
				ApiResponse<Bookmark[]>
			>({
				queryKey: ['bookmarks'],
			});
			const folders = queryClient.getQueryData<ApiResponse<FolderTree[]>>(
				foldersQueryKey.getFolders,
			);

			updateFavoriteCaches(bookmarkId);

			return { bookmarkQueries, folders };
		},
		onError: (_error, _bookmarkId, context) => {
			for (const [queryKey, data] of context?.bookmarkQueries ?? []) {
				queryClient.setQueryData(queryKey, data);
			}

			if (context) {
				queryClient.setQueryData(foldersQueryKey.getFolders, context.folders);
			}
		},
		onSuccess: (response, bookmarkId) => {
			updateFavoriteCaches(bookmarkId, response.payload.isFavorite);
		},
		onSettled: async () => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: bookmarkQueryKey.getBookmarks(),
				}),
				queryClient.invalidateQueries({
					queryKey: bookmarkQueryKey.getAllBookmarks(),
				}),
				queryClient.invalidateQueries({
					queryKey: foldersQueryKey.getFolders,
				}),
			]);
		},
	});
}
