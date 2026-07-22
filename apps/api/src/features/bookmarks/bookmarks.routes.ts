import { createRoute, OpenAPIHono, z } from '@hono/zod-openapi';
import {
	bookmarkSchema,
	createBookmarkSchema,
	deleteBookmarkParamSchema,
	favoriteBookmarkParamSchema,
	moveBookmarkParamSchema,
	moveBookmarkSchema,
	previewBookmarkSchema,
	previewBookmarkUrlSchema,
	reorderFavoriteBookmarksSchema,
	updateBookmarkParamSchema,
	updateBookmarkSchema,
} from '@shelf/shared';
import { response } from '@/common/utils';
import {
	BookmarkAlreadyExistsError,
	BookmarkNotFoundError,
	BookmarkTargetFolderNotFoundError,
	createBookmarkService,
} from '@/features/bookmarks/bookmarks.service';

const bookmarkService = createBookmarkService();

const bookmarkResponseSchema = z
	.object(bookmarkSchema.shape)
	.openapi('Bookmark');

const previewBookmarkResponseSchema = z
	.object(previewBookmarkSchema.shape)
	.openapi('PreviewBookmark');

const errorResponseSchema = z
	.object({
		payload: z.null(),
		message: z.string(),
	})
	.openapi('ErrorResponse');

const listBookmarksQuerySchema = z.object({
	has_folder: z
		.enum(['true', 'false'])
		.default('false')
		.transform((value) => value === 'true'),
});

const listBookmarksRoute = createRoute({
	method: 'get',
	path: '/',
	tags: ['Bookmarks'],
	summary: '북마크 목록 조회',
	request: {
		query: listBookmarksQuerySchema,
	},
	responses: {
		200: {
			description: '북마크 목록 조회 성공',
			content: {
				'application/json': {
					schema: z.object({
						payload: z.array(bookmarkResponseSchema),
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
						payload: bookmarkResponseSchema,
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
		409: {
			description: '이미 등록된 북마크',
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
						payload: bookmarkResponseSchema,
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

const moveBookmarkRoute = createRoute({
	method: 'patch',
	path: '/{id}/move',
	tags: ['Bookmarks'],
	summary: '북마크 이동 및 순서 변경',
	request: {
		params: moveBookmarkParamSchema,
		body: {
			required: true,
			content: {
				'application/json': { schema: moveBookmarkSchema },
			},
		},
	},
	responses: {
		200: {
			description: '북마크 이동 성공',
			content: {
				'application/json': {
					schema: z.object({
						payload: bookmarkResponseSchema,
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
			description: '북마크 또는 이동할 폴더를 찾을 수 없음',
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

const previewBookmarkRoute = createRoute({
	method: 'post',
	path: '/preview',
	tags: ['Bookmarks'],
	summary: 'URL 프리뷰 조회',
	request: {
		body: {
			required: true,
			content: {
				'application/json': {
					schema: previewBookmarkUrlSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: 'URL 프리뷰 조회 성공',
			content: {
				'application.json': { schema: previewBookmarkResponseSchema },
			},
		},
		400: {
			description: '잘못된 URL',
			content: {
				'application/json': { schema: errorResponseSchema },
			},
		},
		404: {
			description: '존재하지 않는 URL',
			content: {
				'application/json': { schema: errorResponseSchema },
			},
		},
	},
});

const favoriteBookmarkRoute = createRoute({
	method: 'post',
	path: '/favorite/{id}',
	tags: ['Bookmarks'],
	summary: '북마크 좋아요 토글',
	request: {
		params: favoriteBookmarkParamSchema,
	},
	responses: {
		200: {
			description: '북마크 좋아요 토글 성공',
			content: {
				'application/json': {
					schema: z.object({
						payload: z.object({ isFavorite: z.boolean() }),
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

const reorderFavoriteBookmarksRoute = createRoute({
	method: 'patch',
	path: '/favorites/reorder',
	tags: ['Bookmarks'],
	summary: '즐겨찾기 북마크 순서 변경',
	request: {
		body: {
			required: true,
			content: {
				'application/json': { schema: reorderFavoriteBookmarksSchema },
			},
		},
	},
	responses: {
		200: {
			description: '즐겨찾기 순서 변경 성공',
			content: {
				'application/json': {
					schema: z.object({
						payload: z.object({ bookmarkIds: z.array(z.number().int()) }),
						message: z.string().optional(),
					}),
				},
			},
		},
	},
});

const bookmarksRoutes = new OpenAPIHono({
	defaultHook: (result, c) => {
		if (!result.success) {
			const message =
				result.error.issues[0]?.message ?? '요청 값이 올바르지 않습니다.';
			return response.badRequest(c, message);
		}
	},
})
	.openapi(listBookmarksRoute, async (c) => {
		const query = c.req.valid('query');
		const bookmarks = await bookmarkService.findBookmarks(query.has_folder);
		return response.success(c, bookmarks);
	})
	.openapi(createBookmarkRoute, async (c) => {
		try {
			const input = c.req.valid('json');
			const bookmark = await bookmarkService.createBookmark(input);

			return response.created(c, bookmark);
		} catch (error: unknown) {
			if (error instanceof BookmarkAlreadyExistsError) {
				return response.conflict(c, error.message);
			}

			throw error;
		}
	})
	.openapi(updateBookmarkRoute, async (c) => {
		const { id } = c.req.valid('param');
		const input = c.req.valid('json');
		const bookmark = await bookmarkService.updateBookmark(id, input);

		return response.success(c, bookmark);
	})
	.openapi(moveBookmarkRoute, async (c) => {
		const { id } = c.req.valid('param');
		const input = c.req.valid('json');

		try {
			const bookmark = await bookmarkService.moveBookmark(id, input);
			return response.success(c, bookmark);
		} catch (error: unknown) {
			if (
				error instanceof BookmarkNotFoundError ||
				error instanceof BookmarkTargetFolderNotFoundError
			) {
				return response.notFound(c, error.message);
			}

			throw error;
		}
	})
	.openapi(deleteBookmarkRoute, async (c) => {
		const { id } = c.req.valid('param');
		const bookmark = await bookmarkService.deleteBookmark(id);

		if (!bookmark) {
			return response.notFound(c, '북마크를 찾을 수 없습니다.');
		}

		return response.success(c, { isDeleted: true as const });
	})
	.openapi(previewBookmarkRoute, async (c) => {
		const input = c.req.valid('json');
		const { payload, message } = await bookmarkService.previewUrl(input.url);

		if (!payload) {
			return response.internalError(
				c,
				message || 'metadata 파싱 중 오류가 발생했습니다.',
			);
		}

		return response.success(c, payload);
	})
	.openapi(favoriteBookmarkRoute, async (c) => {
		const { id } = c.req.valid('param');
		try {
			const isFavorite = await bookmarkService.toggleFavorite(id);
			return response.success(c, { isFavorite });
		} catch (error) {
			if (error instanceof BookmarkNotFoundError) {
				return response.notFound(c, error.message);
			}

			throw error;
		}
	})
	.openapi(reorderFavoriteBookmarksRoute, async (c) => {
		const input = c.req.valid('json');
		const result = await bookmarkService.reorderFavorites(input);
		return response.success(c, result);
	});

export { bookmarksRoutes };
