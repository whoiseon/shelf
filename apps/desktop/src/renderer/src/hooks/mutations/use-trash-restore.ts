import { bookmarkQueryKey } from '@renderer/lib/api/services/bookmarks.api';
import { foldersQueryKey } from '@renderer/lib/api/services/folders.api';
import { trashApi, trashQueryKey } from '@renderer/lib/api/services/trash.api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useTrashRestore() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: trashApi.restoreItem,
		onSuccess: async () => {
			await Promise.all([
				queryClient.invalidateQueries({ queryKey: trashQueryKey.getTrash }),
				queryClient.invalidateQueries({ queryKey: bookmarkQueryKey.all }),
				queryClient.invalidateQueries({
					queryKey: foldersQueryKey.getFolders,
				}),
			]);
		},
	});
}
