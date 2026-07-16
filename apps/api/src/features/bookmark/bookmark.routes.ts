import { Hono } from 'hono';
import { createBookmarkService } from '@/features/bookmark/bookmark.service';

const bookmarkRoutes = new Hono();

const bookmarkService = createBookmarkService();

bookmarkRoutes.get('/', async (c) => {
	const bookmarks = await bookmarkService.findBookmarks();
	return c.json(bookmarks);
});

export { bookmarkRoutes };
