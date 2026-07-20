import { OpenAPIHono } from '@hono/zod-openapi';
import { bookmarksRoutes } from '@/features/bookmarks/bookmarks.routes';
import { foldersRoute } from '@/features/folders/folders.route';
import { trashRoutes } from '@/features/trash/trash.routes';

export const appRoutes = new OpenAPIHono()
	.basePath('/api')
	.route('/bookmarks', bookmarksRoutes)
	.route('/folders', foldersRoute)
	.route('/trash', trashRoutes);
