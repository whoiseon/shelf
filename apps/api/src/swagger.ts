import { swaggerUI } from '@hono/swagger-ui';
import type { OpenAPIHono } from '@hono/zod-openapi';

export function configureSwagger(app: OpenAPIHono) {
	app.doc('/doc', {
		openapi: '3.0.0',
		info: {
			title: 'Shelf API Documentation',
			version: '1.0.0',
			description: 'API documentation for Shelf',
		},
	});

	app.get('/swagger', swaggerUI({ url: '/doc' }));
}
