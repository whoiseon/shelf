import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import {
	createBookmarkSchema,
	deleteBookmarkParamSchema,
	updateBookmarkParamSchema,
	updateBookmarkSchema,
} from '@shelf/shared';
import { response } from '@/common/utils';
import { createBookmarkService } from '@/features/bookmark/bookmark.service';

const bookmarkService = createBookmarkService();

const bookmarkSchema = z
	.object({
		id: z.number().int(),
		title: z.string(),
		url: z.string().nullable(),
		description: z.string().nullable(),
		faviconUrl: z.string().nullable(),
		isFavorite: z.boolean().nullable(),
		createdAt: z.iso.datetime(),
		updatedAt: z.iso.datetime(),
		deletedAt: z.iso.datetime().nullable(),
	})
	.openapi('Bookmark');

const errorResponseSchema = z
	.object({
		payload: z.null(),
		message: z.string(),
	})
	.openapi('ErrorResponse');

const listBookmarksRoute = createRoute({
	method: 'get',
	path: '/',
	tags: ['Bookmarks'],
	summary: '북마크 목록 조회',
	responses: {
		200: {
			description: '북마크 목록 조회 성공',
			content: {
				'application/json': {
					schema: z.object({
						payload: z.array(bookmarkSchema),
						message: z.string().optional(),
					}),
				},
			},
		},
	},
});

const createBookmarkRoute = createRoute({
	method: 'post',
	path: '/',
	tags: ['Bookmarks'],
	summary: '북마크 생성',
	request: {
		body: {
			required: true,
			content: {
				'application/json': {
					schema: createBookmarkSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: '북마크 생성 성공',
			content: {
				'application/json': {
					schema: z.object({
						payload: bookmarkSchema,
						message: z.string().optional(),
					}),
				},
			},
		},
		400: {
			description: '잘못된 요청',
			content: {
				'application/json': { schema: errorResponseSchema },
			},
		},
	},
});

const updateBookmarkRoute = createRoute({
	method: 'patch',
	path: '/{id}',
	tags: ['Bookmarks'],
	summary: '북마크 수정',
	request: {
		params: updateBookmarkParamSchema,
		body: {
			required: true,
			content: {
				'application/json': {
					schema: updateBookmarkSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: '북마크 수정 성공',
			content: {
				'application/json': {
					schema: z.object({
						payload: bookmarkSchema,
						message: z.string().optional(),
					}),
				},
			},
		},
		400: {
			description: '잘못된 요청',
			content: {
				'application/json': { schema: errorResponseSchema },
			},
		},
		404: {
			description: '북마크를 찾을 수 없음',
			content: {
				'application/json': { schema: errorResponseSchema },
			},
		},
	},
});

const deleteBookmarkRoute = createRoute({
	method: 'delete',
	path: '/{id}',
	tags: ['Bookmarks'],
	summary: '북마크 삭제',
	request: {
		params: deleteBookmarkParamSchema,
	},
	responses: {
		200: {
			description: '북마크 삭제 성공',
			content: {
				'application/json': {
					schema: z.object({
						payload: z.object({ isDeleted: z.literal(true) }),
						message: z.string().optional(),
					}),
				},
			},
		},
		400: {
			description: '잘못된 요청',
			content: {
				'application/json': { schema: errorResponseSchema },
			},
		},
		404: {
			description: '북마크를 찾을 수 없음',
			content: {
				'application/json': { schema: errorResponseSchema },
			},
		},
	},
});

const bookmarkRoutes = new OpenAPIHono({
	defaultHook: (result, c) => {
		if (!result.success) {
			const message =
				result.error.issues[0]?.message ?? '요청 값이 올바르지 않습니다.';
			return response.badRequest(c, message);
		}
	},
})
	.openapi(listBookmarksRoute, async (c) => {
		const bookmarks = await bookmarkService.findBookmarks();
		return response.success(c, bookmarks);
	})
	.openapi(createBookmarkRoute, async (c) => {
		const input = c.req.valid('json');
		const bookmark = await bookmarkService.createBookmark(input);

		return response.created(c, bookmark);
	})
	.openapi(updateBookmarkRoute, async (c) => {
		const { id } = c.req.valid('param');
		const input = c.req.valid('json');
		const bookmark = await bookmarkService.updateBookmark(id, input);

		return response.success(c, bookmark);
	})
	.openapi(deleteBookmarkRoute, async (c) => {
		const { id } = c.req.valid('param');
		const bookmark = await bookmarkService.deleteBookmark(id);

		if (!bookmark) {
			return response.notFound(c, '북마크를 찾을 수 없습니다.');
		}

		return response.success(c, { isDeleted: true as const });
	});

export { bookmarkRoutes };
