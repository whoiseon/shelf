import { z } from 'zod';
import { positiveIntId } from './primitives';

export const createBookmarkSchema = z.object({
	title: z.string().trim().min(1).max(200),
	url: z.url(),
	description: z.string().trim().max(2000).optional(),
});

export type CreateBookmarkInput = z.infer<typeof createBookmarkSchema>;

export const deleteBookmarkParamSchema = z.object({
	id: positiveIntId,
});
