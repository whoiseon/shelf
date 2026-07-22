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
			const deletedBookmarks = db
				.select()
				.from(bookmarks)
				.where(isNotNull(bookmarks.deletedAt))
				.orderBy(desc(bookmarks.deletedAt))
				.all();
			type DeletedBookmark = (typeof deletedBookmarks)[number];
			type TrashFolderNode = (typeof deletedFolders)[number] & {
				bookmarks: DeletedBookmark[];
				children: TrashFolderNode[];
			};
			const folderNodes = new Map<number, TrashFolderNode>(
				deletedFolders.map((folder) => [
					folder.id,
					{ ...folder, bookmarks: [], children: [] } as TrashFolderNode,
				]),
			);
			const rootFolders: TrashFolderNode[] = [];

			for (const folder of folderNodes.values()) {
				const parent =
					folder.parentFolderId === null
						? undefined
						: folderNodes.get(folder.parentFolderId);

				if (
					parent &&
					parent.deletedAt?.getTime() === folder.deletedAt?.getTime()
				) {
					parent.children.push(folder);
				} else {
					rootFolders.push(folder);
				}
			}

			const standaloneBookmarks: DeletedBookmark[] = [];

			for (const bookmark of deletedBookmarks) {
				const folder =
					bookmark.folderId === null
						? undefined
						: folderNodes.get(bookmark.folderId);

				if (
					folder &&
					folder.deletedAt?.getTime() === bookmark.deletedAt?.getTime()
				) {
					folder.bookmarks.push(bookmark);
				} else {
					standaloneBookmarks.push(bookmark);
				}
			}

			return {
				folders: rootFolders,
				bookmarks: standaloneBookmarks,
			};
		},
	} as const;
}
