import {
	foldersApi,
	foldersQueryKey,
} from '@renderer/lib/api/services/folders.api';
import type { ApiResponse, FolderTree, MoveFolderInput } from '@shelf/shared';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type MoveFolderVariables = {
	folderId: number;
	input: MoveFolderInput;
};

function removeFolder(
	folders: FolderTree[],
	folderId: number,
): { folders: FolderTree[]; removed?: FolderTree } {
	const index = folders.findIndex((folder) => folder.id === folderId);
	if (index >= 0) {
		const next = [...folders];
		const [removed] = next.splice(index, 1);
		return {
			folders: next.map((folder, position) => ({ ...folder, position })),
			removed,
		};
	}

	for (let index = 0; index < folders.length; index += 1) {
		const folder = folders[index];
		if (!folder) continue;
		const result = removeFolder(folder.children, folderId);
		if (!result.removed) continue;

		const next = [...folders];
		next[index] = { ...folder, children: result.folders };
		return { folders: next, removed: result.removed };
	}

	return { folders };
}

function insertFolder(
	folders: FolderTree[],
	parentFolderId: number | null,
	folder: FolderTree,
	position: number,
): FolderTree[] {
	const moved = { ...folder, parentFolderId };
	if (parentFolderId === null) {
		const index = Math.min(position, folders.length);
		return [...folders.slice(0, index), moved, ...folders.slice(index)].map(
			(item, itemPosition) => ({ ...item, position: itemPosition }),
		);
	}

	return folders.map((current) => ({
		...current,
		children:
			current.id === parentFolderId
				? [
						...current.children.slice(0, position),
						moved,
						...current.children.slice(position),
					].map((item, itemPosition) => ({
						...item,
						position: itemPosition,
					}))
				: insertFolder(current.children, parentFolderId, moved, position),
	}));
}

function moveFolder(
	folders: FolderTree[],
	folderId: number,
	parentFolderId: number | null,
	position: number,
) {
	const result = removeFolder(folders, folderId);
	return result.removed
		? insertFolder(result.folders, parentFolderId, result.removed, position)
		: folders;
}

export function useFolderMove() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: foldersApi.moveFolder,
		onMutate: async ({ folderId, input }: MoveFolderVariables) => {
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
								payload: moveFolder(
									current.payload,
									folderId,
									input.parentFolderId,
									input.position,
								),
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
