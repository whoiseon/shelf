import { api } from '@renderer/lib/api/client';
import type { ApiResponse, Bookmark, FolderTree } from '@shelf/shared';

export type TrashFolder = FolderTree;

export type Trash = {
	folders: TrashFolder[];
	bookmarks: Bookmark[];
};

export type RestoreTrashItemInput = {
	type: 'folder' | 'bookmark';
	id: number;
};

export const trashApi = {
	getTrash: async (): Promise<ApiResponse<Trash>> => {
		return api.get<ApiResponse<Trash>>('/api/trash');
	},
	restoreItem: async ({ type, id }: RestoreTrashItemInput) => {
		const resource = type === 'folder' ? 'folders' : 'bookmarks';
		return api.patch(`/api/trash/${resource}/${id}/restore`);
	},
};

export const trashQueryKey = {
	getTrash: ['trash'] as const,
};
