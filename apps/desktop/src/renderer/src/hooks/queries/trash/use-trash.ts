import { trashApi, trashQueryKey } from '@renderer/lib/api/services/trash.api';
import { useQuery } from '@tanstack/react-query';

export function useTrash() {
	return useQuery({
		queryKey: trashQueryKey.getTrash,
		queryFn: trashApi.getTrash,
	});
}
