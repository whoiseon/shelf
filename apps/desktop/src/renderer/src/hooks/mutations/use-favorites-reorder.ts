import {
	bookmarkQueryKey,
	bookmarksApi,
} from '@renderer/lib/api/services/bookmarks.api';
import type { ApiResponse, Bookmark } from '@shelf/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type BookmarkSnapshot = Array<
	[readonly unknown[], ApiResponse<Bookmark[]> | undefined]
>;

export function useFavoritesReorder() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: bookmarksApi.reorderFavorites,
		onMutate: async ({ bookmarkIds }) => {
			await queryClient.cancelQueries({ queryKey: bookmarkQueryKey.all });
			const snapshot = queryClient.getQueriesData<ApiResponse<Bookmark[]>>({
				queryKey: bookmarkQueryKey.all,
			});
			const positions = new Map(
				bookmarkIds.map((bookmarkId, index) => [bookmarkId, index]),
			);

			queryClient.setQueriesData<ApiResponse<Bookmark[]>>(
				{ queryKey: bookmarkQueryKey.all },
				(current) =>
					current
						? {
								...current,
								payload: current.payload.map((bookmark) => ({
									...bookmark,
									favoritePosition:
										positions.get(bookmark.id) ?? bookmark.favoritePosition,
								})),
							}
						: current,
			);

			return { snapshot };
		},
		onError: (_error, _input, context) => {
			for (const [queryKey, data] of (context?.snapshot as
				| BookmarkSnapshot
				| undefined) ?? []) {
				queryClient.setQueryData(queryKey, data);
			}
		},
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: bookmarkQueryKey.all }),
	});
}
