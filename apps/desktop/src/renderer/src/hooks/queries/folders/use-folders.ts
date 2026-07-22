import {
	foldersApi,
	foldersQueryKey,
} from '@renderer/lib/api/services/folders.api';
import { useQuery } from '@tanstack/react-query';

export function useFolders() {
	return useQuery({
		queryKey: foldersQueryKey.getFolders,
		queryFn: foldersApi.getFolders,
	});
}
