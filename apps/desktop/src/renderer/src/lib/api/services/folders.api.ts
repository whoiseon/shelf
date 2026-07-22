import { api } from '@renderer/lib/api/client';
import type {
	ApiResponse,
	CreateFolderInput,
	FolderTree,
	MoveFolderInput,
	UpdateFolderInput,
} from '@shelf/shared';

export const foldersApi = {
	createFolder: async (input: CreateFolderInput) => {
		return api.post('/api/folders', input);
	},
	getFolders: async (): Promise<ApiResponse<FolderTree[]>> => {
		return api.get<ApiResponse<FolderTree[]>>('/api/folders');
	},
	updateFolder: async ({
		folderId,
		input,
	}: {
		folderId: number;
		input: UpdateFolderInput;
	}) => {
		return api.patch(`/api/folders/${folderId}`, input);
	},
	deleteFolder: async (folderId: number) => {
		return api.delete(`/api/folders/${folderId}`);
	},
	moveFolder: async ({
		folderId,
		input,
	}: {
		folderId: number;
		input: MoveFolderInput;
	}) => {
		return api.patch(`/api/folders/${folderId}/move`, input);
	},
};

export const foldersQueryKey = {
	getFolders: ['folders'] as const,
};
