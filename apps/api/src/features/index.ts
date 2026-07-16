import { OpenAPIHono } from '@hono/zod-openapi';
import { bookmarkRoutes } from '@/features/bookmark/bookmark.routes';

export const appRoutes = new OpenAPIHono()
	.basePath('/api')
	.route('/bookmarks', bookmarkRoutes);
