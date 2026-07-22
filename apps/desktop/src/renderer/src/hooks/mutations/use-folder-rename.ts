import {
	foldersApi,
	foldersQueryKey,
} from '@renderer/lib/api/services/folders.api';
import type { ApiResponse, FolderTree, UpdateFolderInput } from '@shelf/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type RenameFolderVariables = {
	folderId: number;
	input: UpdateFolderInput;
};

function renameFolder(
	folders: FolderTree[],
	folderId: number,
	name: string,
): FolderTree[] {
	return folders.map((folder) => ({
		...folder,
		name: folder.id === folderId ? name : folder.name,
		children: renameFolder(folder.children, folderId, name),
	}));
}

export function useFolderRename() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: foldersApi.updateFolder,
		onMutate: async ({ folderId, input }: RenameFolderVariables) => {
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
								payload: renameFolder(current.payload, folderId, input.name),
							}
						: current,
			);

			return { previous };
		},
		onError: (_error, _variables, context) => {
			queryClient.setQueryData(foldersQueryKey.getFolders, context?.previous);
		},
		onSettled: () =>
			queryClient.invalidateQueries({ queryKey: foldersQueryKey.getFolders }),
	});
}
