import {
	bookmarkQueryKey,
	bookmarksApi,
} from '@renderer/lib/api/services/bookmarks.api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useBookmarkCreate() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: bookmarksApi.createBookmark,
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: bookmarkQueryKey.all }),
	});
}
