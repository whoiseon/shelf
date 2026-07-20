import { createRoute, OpenAPIHono } from '@hono/zod-openapi';
import {
	createFolderSchema,
	deleteFolderParamSchema,
	folderWithBookmarksSchema,
	moveFolderSchema,
	updateFolderParamSchema,
	updateFolderSchema,
} from '@shelf/shared';
import { z } from 'zod';
import { response } from '@/common/utils';
import {
	createFolderService,
	FolderNotFoundError,
	InvalidFolderMoveError,
	ParentFolderNotFoundError,
} from '@/features/folders/folders.service';

const folderService = createFolderService();

const folderResponseSchema = folderWithBookmarksSchema.openapi('Folder');
const folderTreeResponseSchema = folderWithBookmarksSchema
	.extend({
		children: z.array(z.unknown()).openapi({
			items: { $ref: '#/components/schemas/FolderTree' },
		}),
	})
	.openapi('FolderTree');

const errorResponseSchema = z
	.object({
		payload: z.null(),
		message: z.string(),
	})
	.openapi('ErrorResponse');

const listFoldersQuerySchema = z.object({
	with_bookmarks: z
		.enum(['true', 'false'])
		.default('true')
		.transform((value) => value === 'true'),
});
const listFoldersRoute = createRoute({
	method: 'get',
	path: '/',
	tags: ['Folders'],
	summary: '폴더 목록 조회',
	request: {
		query: listFoldersQuerySchema,
	},
	responses: {
		200: {
			description: '폴더 트리 조회 성공',
			content: {
				'application/json': {
					schema: z.object({
						payload: z.array(folderTreeResponseSchema),
						message: z.string().optional(),
					}),
				},
			},
		},
	},
});

const createFolderRoute = createRoute({
	method: 'post',
	path: '/',
	tags: ['Folders'],
	summary: '폴더 생성',
	request: {
		body: {
			required: true,
			content: {
				'application/json': {
					schema: createFolderSchema,
				},
			},
		},
	},
	responses: {
		201: {
			description: '폴더 생성 성공',
			content: {
				'application/json': {
					schema: z.object({
						payload: folderResponseSchema,
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

const updateFolderRoute = createRoute({
	method: 'patch',
	path: '/{id}',
	tags: ['Folders'],
	summary: '폴더 수정',
	request: {
		params: updateFolderParamSchema,
		body: {
			required: true,
			content: {
				'application/json': {
					schema: updateFolderSchema,
				},
			},
		},
	},
	responses: {
		200: {
			description: '폴더 수정 성공',
			content: {
				'application/json': {
					schema: z.object({
						payload: folderResponseSchema,
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
			description: '폴더를 찾을 수 없음',
			content: {
				'application/json': { schema: errorResponseSchema },
			},
		},
	},
});

const moveFolderRoute = createRoute({
	method: 'patch',
	path: '/{id}/move',
	tags: ['Folders'],
	summary: '폴더 이동 및 순서 변경',
	request: {
		params: updateFolderParamSchema,
		body: {
			required: true,
			content: {
				'application/json': { schema: moveFolderSchema },
			},
		},
	},
	responses: {
		200: {
			description: '폴더 이동 성공',
			content: {
				'application/json': {
					schema: z.object({
						payload: folderResponseSchema,
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
			description: '폴더를 찾을 수 없음',
			content: {
				'application/json': { schema: errorResponseSchema },
			},
		},
	},
});

const deleteFolderRoute = createRoute({
	method: 'delete',
	path: '/{id}',
	tags: ['Folders'],
	summary: '폴더 삭제',
	request: {
		params: deleteFolderParamSchema,
	},
	responses: {
		200: {
			description: '폴더 삭제 성공',
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
			description: '폴더를 찾을 수 없음',
			content: {
				'application/json': { schema: errorResponseSchema },
			},
		},
	},
});

const foldersRoute = new OpenAPIHono({
	defaultHook: (result, c) => {
		if (!result.success) {
			const message =
				result.error.issues[0]?.message ?? '요청 값이 올바르지 않습니다.';
			return response.badRequest(c, message);
		}
	},
})
	.openapi(listFoldersRoute, async (c) => {
		const query = c.req.valid('query');
		const folders = await folderService.findFolders({
			withBookmarks: query.with_bookmarks,
		});
		return response.success(c, folders);
	})
	.openapi(createFolderRoute, async (c) => {
		const input = c.req.valid('json');
		const folder = await folderService.createFolder(input);

		return response.created(c, folder);
	})
	.openapi(updateFolderRoute, async (c) => {
		const param = c.req.valid('param');
		const body = c.req.valid('json');

		try {
			const folder = await folderService.updateFolder(param.id, body);
			return response.success(c, folder);
		} catch (error: unknown) {
			if (error instanceof FolderNotFoundError) {
				return response.notFound(c, error.message);
			}

			throw error;
		}
	})
	.openapi(moveFolderRoute, async (c) => {
		const param = c.req.valid('param');
		const body = c.req.valid('json');

		try {
			const folder = await folderService.moveFolder(param.id, body);
			return response.success(c, folder);
		} catch (error: unknown) {
			if (
				error instanceof FolderNotFoundError ||
				error instanceof ParentFolderNotFoundError
			) {
				return response.notFound(c, error.message);
			}

			if (error instanceof InvalidFolderMoveError) {
				return response.badRequest(c, error.message);
			}

			throw error;
		}
	})
	.openapi(deleteFolderRoute, async (c) => {
		const param = c.req.valid('param');

		try {
			await folderService.deleteFolder(param.id);
			return response.success(c, { isDeleted: true as const });
		} catch (error: unknown) {
			if (error instanceof FolderNotFoundError) {
				return response.notFound(c, error.message);
			}

			throw error;
		}
	});

export { foldersRoute };
