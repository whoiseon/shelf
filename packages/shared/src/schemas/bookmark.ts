import { z } from 'zod';
import { positiveIntId } from './primitives';

export const createBookmarkSchema = z.object({
	title: z.string().trim().min(1).max(200),
	url: z.url(),
	description: z.string().trim().max(2000).optional(),
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
