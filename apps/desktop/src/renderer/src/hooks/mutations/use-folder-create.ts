import {
	foldersApi,
	foldersQueryKey,
} from '@renderer/lib/api/services/folders.api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useFolderCreate() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: foldersApi.createFolder,
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: foldersQueryKey.getFolders }),
	});
}
