import {
	foldersApi,
	foldersQueryKey,
} from '@renderer/lib/api/services/folders.api';
import { trashQueryKey } from '@renderer/lib/api/services/trash.api';
import type { ApiResponse, FolderTree } from '@shelf/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

function removeFolder(folders: FolderTree[], folderId: number): FolderTree[] {
	return folders
		.filter((folder) => folder.id !== folderId)
		.map((folder) => ({
			...folder,
			children: removeFolder(folder.children, folderId),
		}));
}

export function useFolderDelete() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: foldersApi.deleteFolder,
		onMutate: async (folderId: number) => {
			await queryClient.cancelQueries({ queryKey: foldersQueryKey.getFolders });

			const previous = queryClient.getQueryData<ApiResponse<FolderTree[]>>(
				foldersQueryKey.getFolders,
			);

			queryClient.setQueryData<ApiResponse<FolderTree[]>>(
				foldersQueryKey.getFolders,
				(current) =>
					current
						? {
								...current,
								payload: removeFolder(current.payload, folderId),
							}
						: current,
			);

			return { previous };
		},
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: trashQueryKey.getTrash }),
		onError: (_error, _folderId, context) => {
			queryClient.setQueryData(foldersQueryKey.getFolders, context?.previous);
		},
		onSettled: async () => {
			await Promise.all([
				queryClient.invalidateQueries({
					queryKey: foldersQueryKey.getFolders,
				}),
				queryClient.invalidateQueries({ queryKey: ['bookmarks'] }),
			]);
		},
	});
}
