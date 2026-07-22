import { bookmarksApi } from '@renderer/lib/api/services/bookmarks.api';
import { foldersQueryKey } from '@renderer/lib/api/services/folders.api';
import type {
	ApiResponse,
	Bookmark,
	FolderTree,
	MoveBookmarkInput,
} from '@shelf/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type MoveBookmarkVariables = {
	bookmarkId: number;
	input: MoveBookmarkInput;
};

type BookmarkQueriesSnapshot = Array<
	[readonly unknown[], ApiResponse<Bookmark[]> | undefined]
>;

function insertBookmark(
	bookmarks: Bookmark[],
	bookmark: Bookmark,
	position: number,
) {
	const next = bookmarks.filter((current) => current.id !== bookmark.id);
	next.splice(Math.min(position, next.length), 0, bookmark);
	return next.map((current, index) => ({ ...current, position: index }));
}

function findBookmarkInFolders(
	folders: FolderTree[],
	bookmarkId: number,
): Bookmark | undefined {
	for (const folder of folders) {
		const bookmark = folder.bookmarks?.find(
			(current) => current.id === bookmarkId,
		);
		if (bookmark) return bookmark;

		const childBookmark = findBookmarkInFolders(folder.children, bookmarkId);
		if (childBookmark) return childBookmark;
	}

	return undefined;
}

function removeBookmarkFromFolders(
	folders: FolderTree[],
	bookmarkId: number,
): FolderTree[] {
	return folders.map((folder) => ({
		...folder,
		bookmarks: folder.bookmarks
			?.filter((bookmark) => bookmark.id !== bookmarkId)
			.map((bookmark, position) => ({ ...bookmark, position })),
		children: removeBookmarkFromFolders(folder.children, bookmarkId),
	}));
}

function insertBookmarkIntoFolder(
	folders: FolderTree[],
	folderId: number,
	bookmark: Bookmark,
	position: number,
): FolderTree[] {
	return folders.map((folder) => ({
		...folder,
		bookmarks:
			folder.id === folderId
				? insertBookmark(folder.bookmarks ?? [], bookmark, position)
				: folder.bookmarks,
		children: insertBookmarkIntoFolder(
			folder.children,
			folderId,
			bookmark,
			position,
		),
	}));
}

export function useBookmarkMove() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: bookmarksApi.moveBookmark,
		onMutate: async ({ bookmarkId, input }: MoveBookmarkVariables) => {
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
			const bookmark =
				bookmarkQueries
					.flatMap(([, data]) => data?.payload ?? [])
					.find((current) => current.id === bookmarkId) ??
				(findBookmarkInFolders(folders?.payload ?? [], bookmarkId) as
					| Bookmark
					| undefined);

			if (bookmark) {
				const movedBookmark = { ...bookmark, folderId: input.folderId };

				queryClient.setQueryData<ApiResponse<Bookmark[]>>(
					['bookmarks', 'has_folder', false],
					(current) =>
						current
							? {
									...current,
									payload:
										input.folderId === null
											? insertBookmark(
													current.payload,
													movedBookmark,
													input.position,
												)
											: current.payload.filter(
													(current) => current.id !== bookmarkId,
												),
								}
							: current,
				);

				queryClient.setQueryData<ApiResponse<FolderTree[]>>(
					foldersQueryKey.getFolders,
					(current) => {
						if (!current) return current;

						const withoutBookmark = removeBookmarkFromFolders(
							current.payload,
							bookmarkId,
						);
						return {
							...current,
							payload:
								input.folderId === null
									? withoutBookmark
									: insertBookmarkIntoFolder(
											withoutBookmark,
											input.folderId,
											movedBookmark,
											input.position,
										),
						};
					},
				);
			}

			return { bookmarkQueries, folders };
		},
		onError: (
			_error,
			_variables,
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
