import { type BookmarkInsert, bookmarks, folders } from '@shelf/db';
import type {
	MoveBookmarkInput,
	ReorderFavoriteBookmarksInput,
	UpdateBookmarkInput,
} from '@shelf/shared';
import {
	and,
	desc,
	eq,
	gt,
	gte,
	isNotNull,
	isNull,
	lt,
	lte,
	max,
	sql,
} from 'drizzle-orm';
import { db } from '@/common/database';

export function createBookmarkRepository() {
	return {
		findAll: async (hasFolder: boolean) => {
			return db
				.select()
				.from(bookmarks)
				.where(
					hasFolder
						? isNull(bookmarks.deletedAt)
						: and(isNull(bookmarks.deletedAt), isNull(bookmarks.folderId)),
				)
				.orderBy(desc(bookmarks.createdAt));
		},
		findById: async (id: number) => {
			return db.query.bookmarks.findFirst({
				where: and(eq(bookmarks.id, id), isNull(bookmarks.deletedAt)),
			});
		},
		findByUrl: async (url: string) => {
			return db.query.bookmarks.findFirst({
				where: eq(bookmarks.url, url),
			});
		},
		create: async (input: BookmarkInsert) => {
			return db.transaction((tx) => {
				const folderId = input.folderId ?? null;
				const positionRow = tx
					.select({ maxPosition: max(bookmarks.position) })
					.from(bookmarks)
					.where(
						and(bookmarkFolderCondition(folderId), isNull(bookmarks.deletedAt)),
					)
					.get();

				return tx
					.insert(bookmarks)
					.values({
						...input,
						folderId,
						position: (positionRow?.maxPosition ?? -1) + 1,
					})
					.returning()
					.get();
			});
		},
		update: async (id: number, input: UpdateBookmarkInput) => {
			const values = Object.fromEntries(
				Object.entries(input).filter(([, value]) => value !== undefined),
			);
			return db
				.update(bookmarks)
				.set({
					...values,
					updatedAt: new Date(),
				})
				.where(and(eq(bookmarks.id, id), isNull(bookmarks.deletedAt)))
				.returning()
				.get();
		},
		delete: async (id: number) => {
			return db.transaction((tx) => {
				const bookmark = tx
					.select()
					.from(bookmarks)
					.where(and(eq(bookmarks.id, id), isNull(bookmarks.deletedAt)))
					.get();

				if (!bookmark) return undefined;

				const deletedBookmark = tx
					.update(bookmarks)
					.set({ deletedAt: new Date() })
					.where(eq(bookmarks.id, id))
					.returning()
					.get();

				tx.update(bookmarks)
					.set({ position: sql`${bookmarks.position} - 1` })
					.where(
						and(
							bookmarkFolderCondition(bookmark.folderId),
							gt(bookmarks.position, bookmark.position),
							isNull(bookmarks.deletedAt),
						),
					)
					.run();

				return deletedBookmark;
			});
		},
		restore: async (id: number, input: BookmarkInsert) => {
			const values = Object.fromEntries(
				Object.entries(input).filter(([, value]) => value !== undefined),
			);

			return db.transaction((tx) => {
				const existing = tx
					.select()
					.from(bookmarks)
					.where(eq(bookmarks.id, id))
					.get();

				if (!existing) {
					throw new Error('복원할 북마크를 찾을 수 없습니다.');
				}

				const folderId = input.folderId ?? existing.folderId;
				const positionRow = tx
					.select({ maxPosition: max(bookmarks.position) })
					.from(bookmarks)
					.where(
						and(bookmarkFolderCondition(folderId), isNull(bookmarks.deletedAt)),
					)
					.get();

				return tx
					.update(bookmarks)
					.set({
						...values,
						folderId,
						position: (positionRow?.maxPosition ?? -1) + 1,
						deletedAt: null,
						updatedAt: new Date(),
					})
					.where(eq(bookmarks.id, id))
					.returning()
					.get();
			});
		},
		toggleFavorite: async (id: number) => {
			return db.transaction((tx) => {
				const bookmark = tx
					.select()
					.from(bookmarks)
					.where(and(eq(bookmarks.id, id), isNull(bookmarks.deletedAt)))
					.get();

				if (!bookmark) return undefined;

				const isFavorite = !bookmark.isFavorite;
				const positionRow = isFavorite
					? tx
							.select({ maxPosition: max(bookmarks.favoritePosition) })
							.from(bookmarks)
							.where(
								and(
									eq(bookmarks.isFavorite, true),
									isNull(bookmarks.deletedAt),
								),
							)
							.get()
					: undefined;

				return tx
					.update(bookmarks)
					.set({
						isFavorite,
						favoritePosition: isFavorite
							? (positionRow?.maxPosition ?? -1) + 1
							: null,
						updatedAt: new Date(),
					})
					.where(eq(bookmarks.id, id))
					.returning({ isFavorite: bookmarks.isFavorite })
					.get();
			});
		},
		reorderFavorites: async ({
			bookmarkIds,
		}: ReorderFavoriteBookmarksInput) => {
			return db.transaction((tx) => {
				for (const [favoritePosition, id] of bookmarkIds.entries()) {
					tx.update(bookmarks)
						.set({ favoritePosition, updatedAt: new Date() })
						.where(
							and(
								eq(bookmarks.id, id),
								eq(bookmarks.isFavorite, true),
								isNull(bookmarks.deletedAt),
							),
						)
						.run();
				}

				return { bookmarkIds };
			});
		},
		move: async (id: number, input: MoveBookmarkInput) => {
			return db.transaction((tx) => {
				const bookmark = tx
					.select()
					.from(bookmarks)
					.where(and(eq(bookmarks.id, id), isNull(bookmarks.deletedAt)))
					.get();

				if (!bookmark) {
					return { status: 'bookmark_not_found' as const };
				}

				if (input.folderId !== null) {
					const targetFolder = tx
						.select({ id: folders.id })
						.from(folders)
						.where(
							and(eq(folders.id, input.folderId), isNull(folders.deletedAt)),
						)
						.get();

					if (!targetFolder) {
						return { status: 'folder_not_found' as const };
					}
				}

				const oldFolderId = bookmark.folderId;
				const oldPosition = bookmark.position;
				const newFolderId = input.folderId;
				const sameFolder = oldFolderId === newFolderId;
				const destinationCount = tx
					.select({ id: bookmarks.id })
					.from(bookmarks)
					.where(
						and(
							bookmarkFolderCondition(newFolderId),
							isNull(bookmarks.deletedAt),
						),
					)
					.all().length;
				const maxPosition = sameFolder
					? Math.max(destinationCount - 1, 0)
					: destinationCount;
				const newPosition = Math.min(input.position, maxPosition);

				if (sameFolder) {
					if (newPosition > oldPosition) {
						tx.update(bookmarks)
							.set({ position: sql`${bookmarks.position} - 1` })
							.where(
								and(
									bookmarkFolderCondition(newFolderId),
									gt(bookmarks.position, oldPosition),
									lte(bookmarks.position, newPosition),
									isNull(bookmarks.deletedAt),
								),
							)
							.run();
					} else if (newPosition < oldPosition) {
						tx.update(bookmarks)
							.set({ position: sql`${bookmarks.position} + 1` })
							.where(
								and(
									bookmarkFolderCondition(newFolderId),
									gte(bookmarks.position, newPosition),
									lt(bookmarks.position, oldPosition),
									isNull(bookmarks.deletedAt),
								),
							)
							.run();
					}
				} else {
					tx.update(bookmarks)
						.set({ position: sql`${bookmarks.position} - 1` })
						.where(
							and(
								bookmarkFolderCondition(oldFolderId),
								gt(bookmarks.position, oldPosition),
								isNull(bookmarks.deletedAt),
							),
						)
						.run();

					tx.update(bookmarks)
						.set({ position: sql`${bookmarks.position} + 1` })
						.where(
							and(
								bookmarkFolderCondition(newFolderId),
								gte(bookmarks.position, newPosition),
								isNull(bookmarks.deletedAt),
							),
						)
						.run();
				}

				const movedBookmark = tx
					.update(bookmarks)
					.set({
						folderId: newFolderId,
						position: newPosition,
						updatedAt: new Date(),
					})
					.where(eq(bookmarks.id, id))
					.returning()
					.get();

				return { status: 'ok' as const, bookmark: movedBookmark };
			});
		},
		restoreDeleted: async (id: number) => {
			return db.transaction((tx) => {
				const bookmark = tx
					.select()
					.from(bookmarks)
					.where(and(eq(bookmarks.id, id), isNotNull(bookmarks.deletedAt)))
					.get();

				if (!bookmark) {
					return { status: 'bookmark_not_found' as const };
				}

				let restoredFolderId = bookmark.folderId;

				if (restoredFolderId !== null) {
					const folder = tx
						.select({ id: folders.id })
						.from(folders)
						.where(
							and(eq(folders.id, restoredFolderId), isNull(folders.deletedAt)),
						)
						.get();

					if (!folder) {
						restoredFolderId = null;
					}
				}

				const activeBookmarkCount = tx
					.select({ id: bookmarks.id })
					.from(bookmarks)
					.where(
						and(
							bookmarkFolderCondition(restoredFolderId),
							isNull(bookmarks.deletedAt),
						),
					)
					.all().length;
				const restoredPosition = Math.min(
					bookmark.position,
					activeBookmarkCount,
				);

				tx.update(bookmarks)
					.set({ position: sql`${bookmarks.position} + 1` })
					.where(
						and(
							bookmarkFolderCondition(restoredFolderId),
							gte(bookmarks.position, restoredPosition),
							isNull(bookmarks.deletedAt),
						),
					)
					.run();

				const restoredBookmark = tx
					.update(bookmarks)
					.set({
						folderId: restoredFolderId,
						position: restoredPosition,
						deletedAt: null,
						updatedAt: new Date(),
					})
					.where(eq(bookmarks.id, id))
					.returning()
					.get();

				return { status: 'ok' as const, bookmark: restoredBookmark };
			});
		},
	} as const;
}

function bookmarkFolderCondition(folderId: number | null) {
	return folderId === null
		? isNull(bookmarks.folderId)
		: eq(bookmarks.folderId, folderId);
}
