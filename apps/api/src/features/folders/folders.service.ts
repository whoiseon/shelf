import type {
	CreateFolderInput,
	MoveFolderInput,
	UpdateFolderInput,
} from '@shelf/shared';
import { createFolderRepository } from '@/features/folders/folders.repository';

const folderRepository = createFolderRepository();

export function createFolderService() {
	return {
		findFolders: async ({ withBookmarks }: { withBookmarks: boolean }) => {
			return folderRepository.findAll({ withBookmarks });
		},

		createFolder: async (input: CreateFolderInput) => {
			return await folderRepository.create(input);
		},

		updateFolder: async (id: number, input: UpdateFolderInput) => {
			const folder = await folderRepository.update(id, input);

			if (!folder) {
				throw new FolderNotFoundError();
			}

			return folder;
		},

		moveFolder: async (id: number, input: MoveFolderInput) => {
			const result = await folderRepository.move(id, input);

			if (result.status === 'folder_not_found') {
				throw new FolderNotFoundError();
			}

			if (result.status === 'parent_not_found') {
				throw new ParentFolderNotFoundError();
			}

			if (result.status === 'invalid_move') {
				throw new InvalidFolderMoveError(result.message);
			}

			return result.folder;
		},

		deleteFolder: async (id: number) => {
			const folder = await folderRepository.delete(id);

			if (!folder) {
				throw new FolderNotFoundError();
			}

			return folder;
		},

		restoreFolder: async (id: number) => {
			const result = await folderRepository.restore(id);

			if (result.status === 'folder_not_found') {
				throw new FolderNotFoundError();
			}

			return result.folder;
		},
	};
}

export class FolderNotFoundError extends Error {
	constructor() {
		super('폴더를 찾을 수 없습니다.');
		this.name = 'FolderNotFoundError';
	}
}

export class ParentFolderNotFoundError extends Error {
	constructor() {
		super('이동할 상위 폴더를 찾을 수 없습니다.');
		this.name = 'ParentFolderNotFoundError';
	}
}

export class InvalidFolderMoveError extends Error {
	constructor(message: string) {
		super(message);
		this.name = 'InvalidFolderMoveError';
	}
}
