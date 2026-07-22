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
		hardDeleteFolder: async (id: number) => {
			const folder = await trashRepository.hardDeleteFolder(id);

			if (!folder) throw new FolderNotFoundError();
			return folder;
		},
		hardDeleteBookmark: async (id: number) => {
			const bookmark = await trashRepository.hardDeleteBookmark(id);

			if (!bookmark) throw new BookmarkNotFoundError();
			return bookmark;
		},
		emptyTrash: async () => trashRepository.empty(),
	} as const;
}

export { BookmarkNotFoundError, FolderNotFoundError };
