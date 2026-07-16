import { z } from 'zod';
import { positiveIntId } from './primitives';

export const bookmarkSchema = z.object({
	id: z.number().int(),
	title: z.string(),
	url: z.string().nullable(),
	description: z.string().nullable(),
	siteName: z.string().nullable(),
	faviconUrl: z.string().nullable(),
	imageUrl: z.string().nullable(),
	isFavorite: z.boolean().default(false),
	createdAt: z.iso.datetime(),
	updatedAt: z.iso.datetime(),
	deletedAt: z.iso.datetime().nullable(),
});

export const createBookmarkSchema = z.object({
	title: z
		.string()
		.trim()
		.min(1, { message: '사이트 제목을 최소 1자 이상 입력하세요' })
		.max(200, { message: '사이트 제목은 최대 200자 이하만 입력하세요' }),
	url: z.url({ message: '잘못된 URL 형식입니다.' }),
	description: z.string().trim().max(2000).optional(),
	siteName: z.string().nullable(),
	faviconUrl: z.string().nullable(),
	imageUrl: z.string().nullable(),
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;

export const updateBookmarkSchema = createBookmarkSchema
	.partial()
	.refine((input) => Object.keys(input).length > 0, {
		message: '수정할 필드 하나 이상 입력해야 합니다.',
	});

export type UpdateBookmarkInput = z.infer<typeof updateBookmarkSchema>;

export const deleteBookmarkParamSchema = z.object({
	id: positiveIntId,
});

export const updateBookmarkParamSchema = z.object({
	id: positiveIntId,
});

export const previewBookmarkUrlSchema = z.object({
	url: z.url({ message: '잘못된 URL 형식입니다.' }),
});

export const previewBookmarkSchema = z.object({
	title: z.string().nullable(),
	description: z.string().nullable(),
	imageUrl: z.string().nullable(),
	siteName: z.string().nullable(),
	faviconUrl: z.string().nullable(),
});

export type PreviewBookmark = z.infer<typeof previewBookmarkSchema>;
