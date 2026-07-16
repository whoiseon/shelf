import { zValidator } from '@hono/zod-validator';
import { createBookmarkSchema, deleteBookmarkParamSchema } from '@shelf/shared';
import { Hono } from 'hono';
import { response } from '@/common/utils';
import { createBookmarkService } from '@/features/bookmark/bookmark.service';

const bookmarkRoutes = new Hono();

const bookmarkService = createBookmarkService();

bookmarkRoutes.get('/', async (c) => {
	const bookmarks = await bookmarkService.findBookmarks();
	return response.success(c, bookmarks);
});

bookmarkRoutes.post(
	'/',
	zValidator('json', createBookmarkSchema),
	async (c) => {
		const input = c.req.valid('json');
		const bookmark = await bookmarkService.createBookmark(input);

		return response.created(c, bookmark);
	},
);

bookmarkRoutes.delete(
	'/:id',
	zValidator('param', deleteBookmarkParamSchema),
	async (c) => {
		const { id } = c.req.valid('param');
		const bookmark = await bookmarkService.deleteBookmark(id);

		if (!bookmark) {
			return response.notFound(c, '북마크를 찾을 수 없습니다.');
		}

		return response.success(c, { isDeleted: true });
	},
);

export { bookmarkRoutes };
