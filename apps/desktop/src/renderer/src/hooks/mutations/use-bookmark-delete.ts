import { bookmarksApi } from '@renderer/lib/api/services/bookmarks.api';
import { foldersQueryKey } from '@renderer/lib/api/services/folders.api';
import { trashQueryKey } from '@renderer/lib/api/services/trash.api';
import type { ApiResponse, Bookmark, FolderTree } from '@shelf/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type BookmarkQueriesSnapshot = Array<
	[readonly unknown[], ApiResponse<Bookmark[]> | undefined]
>;

function removeBookmarkFromFolders(
	folders: FolderTree[],
	bookmarkId: number,
): FolderTree[] {
	return folders.map((folder) => ({
		...folder,
		bookmarks: folder.bookmarks?.filter(
			(bookmark) => bookmark.id !== bookmarkId,
		),
		children: removeBookmarkFromFolders(folder.children, bookmarkId),
	}));
}

export function useBookmarkDelete() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: bookmarksApi.deleteBookmark,
		onMutate: async (bookmarkId: number) => {
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

			queryClient.setQueriesData<ApiResponse<Bookmark[]>>(
				{ queryKey: ['bookmarks'] },
				(current) =>
					current
						? {
								...current,
								payload: current.payload.filter(
									(bookmark) => bookmark.id !== bookmarkId,
								),
							}
						: current,
			);

			queryClient.setQueryData<ApiResponse<FolderTree[]>>(
				foldersQueryKey.getFolders,
				(current) =>
					current
						? {
								...current,
								payload: removeBookmarkFromFolders(current.payload, bookmarkId),
							}
						: current,
			);

			return { bookmarkQueries, folders };
		},
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: trashQueryKey.getTrash }),
		onError: (
			_error,
			_bookmarkId,
			context:
				| {
						bookmarkQueries: BookmarkQueriesSnapshot;
						folders: ApiResponse<FolderTree[]> | undefined;
				  }
				| undefined,
		) => {
			for (const [queryKey, data] of context?.bookmarkQueries ?? []) {
				queryClient.setQueryData(queryKey, data);
			}
			queryClient.setQueryData(foldersQueryKey.getFolders, context?.folders);
		},
		onSettled: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
				queryClient.invalidateQueries({
					queryKey: foldersQueryKey.getFolders,
				}),
			]);
		},
	});
}
