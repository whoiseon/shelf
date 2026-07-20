import { bookmarks, folders } from '@shelf/db';
import { desc, isNotNull } from 'drizzle-orm';
import { db } from '@/common/database';

export function createTrashRepository() {
	return {
		findAll: async () => {
			const deletedFolders = db
				.select()
				.from(folders)
				.where(isNotNull(folders.deletedAt))
				.orderBy(desc(folders.deletedAt))
				.all();
			const foldersById = new Map(
				deletedFolders.map((folder) => [folder.id, folder]),
			);
			const rootFolders = deletedFolders.filter((folder) => {
				if (folder.parentFolderId === null) return true;

				const parent = foldersById.get(folder.parentFolderId);
				return parent?.deletedAt?.getTime() !== folder.deletedAt?.getTime();
			});

			const deletedBookmarks = db
				.select()
				.from(bookmarks)
				.where(isNotNull(bookmarks.deletedAt))
				.orderBy(desc(bookmarks.deletedAt))
				.all();
			const standaloneBookmarks = deletedBookmarks.filter((bookmark) => {
				if (bookmark.folderId === null) return true;

				const folder = foldersById.get(bookmark.folderId);
				return folder?.deletedAt?.getTime() !== bookmark.deletedAt?.getTime();
			});

			return {
				folders: rootFolders,
				bookmarks: standaloneBookmarks,
			};
		},
	} as const;
}
