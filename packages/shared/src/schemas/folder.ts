import { z } from 'zod';
import { bookmarkSchema } from './bookmark';
import { positiveIntId } from './primitives';

export const folderSchema = z.object({
	id: z.number().int(),
	name: z.string(),
	parentFolderId: z.number().int().nullable(),
	position: z.number().int(),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
	deletedAt: z.iso.datetime().nullable(),
});

export const folderWithBookmarksSchema = folderSchema.extend({
	bookmarks: z.array(bookmarkSchema).optional(),
});

export type FolderTree = z.infer<typeof folderWithBookmarksSchema> & {
	children: FolderTree[];
};

export const folderTreeSchema: z.ZodType<FolderTree> =
	folderWithBookmarksSchema.extend({
		children: z.lazy(() => z.array(folderTreeSchema)),
	});

const nameFieldSchema = z
	.string()
	.trim()
	.min(1, { message: '폴더명은 최소 1자 이상 입력하세요' })
	.max(20, { message: '폴더명은 최대 20자 이하 입력하세요' });

export const createFolderSchema = z.object({
	name: nameFieldSchema,
	parentFolderId: z.number().int().optional(),
});

export type CreateFolderInput = z.infer<typeof createFolderSchema>;

export const updateFolderParamSchema = z.object({
	id: positiveIntId,
});

export const updateFolderSchema = z.object({
	name: nameFieldSchema,
});

export type UpdateFolderInput = z.infer<typeof updateFolderSchema>;

export const moveFolderSchema = z.object({
	parentFolderId: z.number().int().positive().nullable(),
	position: z.number().int().min(0),
});

export type MoveFolderInput = z.infer<typeof moveFolderSchema>;

export const deleteFolderParamSchema = z.object({
	id: positiveIntId,
});
