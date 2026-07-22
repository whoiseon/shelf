import {
	bookmarkQueryKey,
	bookmarksApi,
} from '@renderer/lib/api/services/bookmarks.api';
import { foldersQueryKey } from '@renderer/lib/api/services/folders.api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useBookmarkUpdate() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: bookmarksApi.updateBookmark,
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: bookmarkQueryKey.all }),
				queryClient.invalidateQueries({
					queryKey: foldersQueryKey.getFolders,
				}),
			]);
		},
	});
}
