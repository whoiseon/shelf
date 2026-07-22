import { bookmarksApi } from '@renderer/lib/api/services/bookmarks.api';
import { useMutation } from '@tanstack/react-query';

export function useBookmarkPreview() {
	return useMutation({
		mutationFn: bookmarksApi.previewBookmark,
	});
}
