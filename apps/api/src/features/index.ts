import { Hono } from 'hono';
import { bookmarkRoutes } from '@/features/bookmark/bookmark.routes';

export const appRoutes = new Hono()
	.basePath('/api')
	.route('/bookmarks', bookmarkRoutes);
