import {
	bookmarkQueryKey,
	bookmarksApi,
} from '@renderer/lib/api/services/bookmarks.api';
import { useQuery } from '@tanstack/react-query';

export function useBookmarks({ hasFolder }: { hasFolder: boolean }) {
	return useQuery({
		queryKey: bookmarkQueryKey.getBookmarks(hasFolder),
		queryFn: () => bookmarksApi.getBookmarks({ hasFolder }),
	});
}
