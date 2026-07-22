import { OpenAPIHono } from '@hono/zod-openapi';
import { cors } from 'hono/cors';
import { factoryServer } from '@/server';
import { configureSwagger } from '@/swagger';
import { appRoutes } from './features';

const app = new OpenAPIHono();

app.get('/health', (c) => c.json({ status: 'ok' as const }));

app.use(
	'/api/*',
	cors({
		origin: 'http://localhost:5173',
		credentials: true,
	}),
);

configureSwagger(app);

const routes = app.route('/', appRoutes);

factoryServer(routes);

export type AppType = typeof routes;
