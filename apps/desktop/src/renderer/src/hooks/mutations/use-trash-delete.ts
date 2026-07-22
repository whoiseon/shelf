import { trashApi, trashQueryKey } from '@renderer/lib/api/services/trash.api';
import { useMutation, useQueryClient } from '@tanstack/react-query';

export function useTrashDelete() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: trashApi.deleteItem,
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: trashQueryKey.getTrash }),
	});
}

export function useTrashEmpty() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: trashApi.emptyTrash,
		onSuccess: () =>
			queryClient.invalidateQueries({ queryKey: trashQueryKey.getTrash }),
	});
}
