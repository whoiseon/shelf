import { bookmarks, type FolderInsert, folders } from '@shelf/db';
import type { MoveFolderInput, UpdateFolderInput } from '@shelf/shared';
import {
	and,
	asc,
	eq,
	gt,
	gte,
	inArray,
	isNotNull,
	isNull,
	lt,
	lte,
	max,
	sql,
} from 'drizzle-orm';
import { db } from '@/common/database';
import {
	buildFolderTree,
	createUniqueFolderName,
} from '@/features/folders/folders.utils';

export function createFolderRepository() {
	return {
		findAll: async ({ withBookmarks }: { withBookmarks: boolean }) => {
			const rows = await db.query.folders.findMany({
				where: isNull(folders.deletedAt),

				with: withBookmarks
					? {
							bookmarks: {
								where: isNull(bookmarks.deletedAt),
								orderBy: asc(bookmarks.position),
							},
						}
					: undefined,

				orderBy: asc(folders.position),
			});

			return buildFolderTree(rows);
		},

		findByName: async (name: string) => {
			return db.select().from(folders).where(eq(folders.name, name));
		},

		create: async (input: Omit<FolderInsert, 'position'>) => {
			return db.transaction((tx) => {
				const parentFolderId = input.parentFolderId ?? null;
				const parentCondition =
					parentFolderId === null
						? isNull(folders.parentFolderId)
						: eq(folders.parentFolderId, parentFolderId);

				const siblings = tx
					.select({ name: folders.name })
					.from(folders)
					.where(and(parentCondition, isNull(folders.deletedAt)))
					.all();

				const existingNames = new Set(siblings.map((folder) => folder.name));

				const name = createUniqueFolderName(input.name, existingNames);

				const positionRow = tx
					.select({
						maxPosition: max(folders.position),
					})
					.from(folders)
					.where(and(isNull(folders.deletedAt), parentCondition))
					.get();

				return tx
					.insert(folders)
					.values({
						...input,
						name,
						parentFolderId: input.parentFolderId ?? null,
						position: (positionRow?.maxPosition ?? -1) + 1,
					})
					.returning()
					.get();
			});
		},

		update: async (id: number, input: UpdateFolderInput) => {
			const values = Object.fromEntries(
				Object.entries(input).filter(([_, value]) => value !== undefined),
			);

			return db
				.update(folders)
				.set({
					...values,
					updatedAt: new Date(),
				})
				.where(and(eq(folders.id, id), isNull(folders.deletedAt)))
				.returning()
				.get();
		},

		move: async (id: number, input: MoveFolderInput) => {
			return db.transaction((tx) => {
				const folder = tx
					.select()
					.from(folders)
					.where(and(eq(folders.id, id), isNull(folders.deletedAt)))
					.get();

				if (!folder) {
					return { status: 'folder_not_found' as const };
				}

				const oldParentId = folder.parentFolderId;
				const oldPosition = folder.position;
				const newParentId = input.parentFolderId;
				const activeFolders = tx
					.select({
						id: folders.id,
						parentFolderId: folders.parentFolderId,
						position: folders.position,
					})
					.from(folders)
					.where(isNull(folders.deletedAt))
					.all();

				if (newParentId !== null) {
					const foldersById = new Map(
						activeFolders.map((current) => [current.id, current]),
					);
					let ancestorId: number | null = newParentId;

					while (ancestorId !== null) {
						if (ancestorId === id) {
							return {
								status: 'invalid_move' as const,
								message: '자기 자신 또는 하위 폴더로 이동할 수 없습니다.',
							};
						}

						const ancestor = foldersById.get(ancestorId);
						if (!ancestor) {
							return { status: 'parent_not_found' as const };
						}

						ancestorId = ancestor.parentFolderId;
					}
				}

				const sameParent = oldParentId === newParentId;
				const destinationCount = activeFolders.filter(
					(current) => current.parentFolderId === newParentId,
				).length;
				const maxPosition = sameParent
					? Math.max(destinationCount - 1, 0)
					: destinationCount;
				const newPosition = Math.min(input.position, maxPosition);

				if (sameParent) {
					if (newPosition > oldPosition) {
						// 아래 방향으로 이동:
						// 사이에 있는 폴더들을 한 칸 앞으로 당김
						tx.update(folders)
							.set({
								position: sql`${folders.position} - 1`,
							})
							.where(
								and(
									siblingCondition(newParentId),
									gt(folders.position, oldPosition),
									lte(folders.position, newPosition),
									isNull(folders.deletedAt),
								),
							)
							.run();
					} else if (newPosition < oldPosition) {
						// 위 방향 이동:
						// 사이에 있는 폴더들을 한 칸 뒤로 밂
						tx.update(folders)
							.set({
								position: sql`${folders.position} + 1`,
							})
							.where(
								and(
									siblingCondition(newParentId),
									gte(folders.position, newPosition),
									lt(folders.position, oldPosition),
									isNull(folders.deletedAt),
								),
							)
							.run();
					}
				} else {
					tx.update(folders)
						.set({ position: sql`${folders.position} - 1` })
						.where(
							and(
								siblingCondition(oldParentId),
								gt(folders.position, oldPosition),
								isNull(folders.deletedAt),
							),
						)
						.run();

					tx.update(folders)
						.set({ position: sql`${folders.position} + 1` })
						.where(
							and(
								siblingCondition(newParentId),
								gte(folders.position, newPosition),
								isNull(folders.deletedAt),
							),
						)
						.run();
				}

				const movedFolder = tx
					.update(folders)
					.set({
						parentFolderId: newParentId,
						position: newPosition,
						updatedAt: new Date(),
					})
					.where(eq(folders.id, id))
					.returning()
					.get();

				return { status: 'ok' as const, folder: movedFolder };
			});
		},

		delete: async (id: number) => {
			return db.transaction((tx) => {
				const folder = tx
					.select()
					.from(folders)
					.where(and(eq(folders.id, id), isNull(folders.deletedAt)))
					.get();

				if (!folder) return undefined;

				const activeFolders = tx
					.select({
						id: folders.id,
						parentFolderId: folders.parentFolderId,
					})
					.from(folders)
					.where(isNull(folders.deletedAt))
					.all();
				const deletedFolderIds = new Set([id]);
				let foundDescendant = true;

				while (foundDescendant) {
					foundDescendant = false;

					for (const current of activeFolders) {
						if (
							current.parentFolderId !== null &&
							deletedFolderIds.has(current.parentFolderId) &&
							!deletedFolderIds.has(current.id)
						) {
							deletedFolderIds.add(current.id);
							foundDescendant = true;
						}
					}
				}

				const now = new Date();
				const folderIds = [...deletedFolderIds];

				tx.update(bookmarks)
					.set({
						deletedAt: now,
						updatedAt: now,
					})
					.where(
						and(
							inArray(bookmarks.folderId, folderIds),
							isNull(bookmarks.deletedAt),
						),
					)
					.run();

				const deletedFolders = tx
					.update(folders)
					.set({
						deletedAt: now,
						updatedAt: now,
					})
					.where(inArray(folders.id, folderIds))
					.returning()
					.all();

				tx.update(folders)
					.set({ position: sql`${folders.position} - 1` })
					.where(
						and(
							siblingCondition(folder.parentFolderId),
							gt(folders.position, folder.position),
							isNull(folders.deletedAt),
						),
					)
					.run();

				return deletedFolders.find((deleted) => deleted.id === id);
			});
		},

		restore: async (id: number) => {
			return db.transaction((tx) => {
				const requestedFolder = tx
					.select()
					.from(folders)
					.where(and(eq(folders.id, id), isNotNull(folders.deletedAt)))
					.get();

				if (!requestedFolder?.deletedAt) {
					return { status: 'folder_not_found' as const };
				}

				const allFolders = tx.select().from(folders).all();
				const foldersById = new Map(
					allFolders.map((current) => [current.id, current]),
				);
				const deletedAtMs = requestedFolder.deletedAt.getTime();
				let rootFolder = requestedFolder;

				while (rootFolder.parentFolderId !== null) {
					const parent = foldersById.get(rootFolder.parentFolderId);

					if (parent?.deletedAt?.getTime() !== deletedAtMs) break;
					rootFolder = parent;
				}

				const originalParent =
					rootFolder.parentFolderId === null
						? undefined
						: foldersById.get(rootFolder.parentFolderId);
				const restoredParentId =
					rootFolder.parentFolderId !== null &&
					originalParent?.deletedAt === null
						? rootFolder.parentFolderId
						: null;

				const restoredFolderIds = new Set([rootFolder.id]);
				let foundDescendant = true;

				while (foundDescendant) {
					foundDescendant = false;

					for (const current of allFolders) {
						if (
							current.parentFolderId !== null &&
							restoredFolderIds.has(current.parentFolderId) &&
							current.deletedAt?.getTime() === deletedAtMs &&
							!restoredFolderIds.has(current.id)
						) {
							restoredFolderIds.add(current.id);
							foundDescendant = true;
						}
					}
				}

				const activeSiblingCount = allFolders.filter(
					(current) =>
						current.parentFolderId === restoredParentId &&
						current.deletedAt === null,
				).length;
				const restoredPosition = Math.min(
					rootFolder.position,
					activeSiblingCount,
				);

				tx.update(folders)
					.set({ position: sql`${folders.position} + 1` })
					.where(
						and(
							siblingCondition(restoredParentId),
							gte(folders.position, restoredPosition),
							isNull(folders.deletedAt),
						),
					)
					.run();

				const now = new Date();
				const folderIds = [...restoredFolderIds];

				tx.update(folders)
					.set({
						deletedAt: null,
						updatedAt: now,
					})
					.where(inArray(folders.id, folderIds))
					.run();

				tx.update(bookmarks)
					.set({
						deletedAt: null,
						updatedAt: now,
					})
					.where(
						and(
							inArray(bookmarks.folderId, folderIds),
							eq(bookmarks.deletedAt, requestedFolder.deletedAt),
						),
					)
					.run();

				const restoredFolder = tx
					.update(folders)
					.set({
						parentFolderId: restoredParentId,
						position: restoredPosition,
						updatedAt: now,
					})
					.where(eq(folders.id, rootFolder.id))
					.returning()
					.get();

				return { status: 'ok' as const, folder: restoredFolder };
			});
		},
	};
}

function siblingCondition(parentFolderId: number | null) {
	return parentFolderId === null
		? isNull(folders.parentFolderId)
		: eq(folders.parentFolderId, parentFolderId);
}
