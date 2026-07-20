import {
	BookmarkNotFoundError,
	createBookmarkService,
} from '@/features/bookmarks/bookmarks.service';
import {
	createFolderService,
	FolderNotFoundError,
} from '@/features/folders/folders.service';
import { createTrashRepository } from '@/features/trash/trash.repository';

const trashRepository = createTrashRepository();
const folderService = createFolderService();
const bookmarkService = createBookmarkService();

export function createTrashService() {
	return {
		findTrash: async () => trashRepository.findAll(),
		restoreFolder: async (id: number) => folderService.restoreFolder(id),
		restoreBookmark: async (id: number) => bookmarkService.restoreBookmark(id),
	} as const;
}

export { BookmarkNotFoundError, FolderNotFoundError };
