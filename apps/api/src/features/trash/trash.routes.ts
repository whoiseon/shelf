import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import { bookmarkSchema, folderSchema, folderTreeSchema } from '@shelf/shared';
import { response } from '@/common/utils';
import {
	BookmarkNotFoundError,
	createTrashService,
	FolderNotFoundError,
} from '@/features/trash/trash.service';

const trashService = createTrashService();
const folderResponseSchema = folderSchema.openapi('TrashFolder');
const bookmarkResponseSchema = bookmarkSchema.openapi('TrashBookmark');
const trashParamSchema = z.object({
	id: z.coerce.number().int().positive(),
});
const errorResponseSchema = z.object({
	payload: z.null(),
	message: z.string(),
});

const listTrashRoute = createRoute({
	method: 'get',
	path: '/',
	tags: ['Trash'],
	summary: '휴지통 목록 조회',
	responses: {
		200: {
			description: '휴지통 목록 조회 성공',
			content: {
				'application/json': {
					schema: z.object({
						payload: z.object({
							folders: z.array(folderTreeSchema),
							bookmarks: z.array(bookmarkResponseSchema),
						}),
						message: z.string().optional(),
					}),
				},
			},
		},
	},
});

const restoreFolderRoute = createRoute({
	method: 'patch',
	path: '/folders/{id}/restore',
	tags: ['Trash'],
	summary: '폴더 트리 복원',
	request: { params: trashParamSchema },
	responses: {
		200: {
			description: '폴더 트리 복원 성공',
			content: {
				'application/json': {
					schema: z.object({
						payload: folderResponseSchema,
						message: z.string().optional(),
					}),
				},
			},
		},
		404: {
			description: '폴더를 찾을 수 없음',
			content: { 'application/json': { schema: errorResponseSchema } },
		},
	},
});

const restoreBookmarkRoute = createRoute({
	method: 'patch',
	path: '/bookmarks/{id}/restore',
	tags: ['Trash'],
	summary: '북마크 복원',
	request: { params: trashParamSchema },
	responses: {
		200: {
			description: '북마크 복원 성공',
			content: {
				'application/json': {
					schema: z.object({
						payload: bookmarkResponseSchema,
						message: z.string().optional(),
					}),
				},
			},
		},
		404: {
			description: '북마크를 찾을 수 없음',
			content: { 'application/json': { schema: errorResponseSchema } },
		},
	},
});

const trashRoutes = new OpenAPIHono({
	defaultHook: (result, c) => {
		if (!result.success) {
			const message =
				result.error.issues[0]?.message ?? '요청 값이 올바르지 않습니다.';
			return response.badRequest(c, message);
		}
	},
})
	.openapi(listTrashRoute, async (c) => {
		const trash = await trashService.findTrash();
		return response.success(c, trash);
	})
	.openapi(restoreFolderRoute, async (c) => {
		const { id } = c.req.valid('param');

		try {
			const folder = await trashService.restoreFolder(id);
			return response.success(c, folder);
		} catch (error: unknown) {
			if (error instanceof FolderNotFoundError) {
				return response.notFound(c, error.message);
			}

			throw error;
		}
	})
	.openapi(restoreBookmarkRoute, async (c) => {
		const { id } = c.req.valid('param');

		try {
			const bookmark = await trashService.restoreBookmark(id);
			return response.success(c, bookmark);
		} catch (error: unknown) {
			if (error instanceof BookmarkNotFoundError) {
				return response.notFound(c, error.message);
			}

			throw error;
		}
	});

export { trashRoutes };
