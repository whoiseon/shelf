import { OpenAPIHono } from '@hono/zod-openapi';
import { factoryServer } from '@/server';
import { configureSwagger } from '@/swagger';
import { appRoutes } from './features';

const app = new OpenAPIHono().route('/', appRoutes);

configureSwagger(app);

factoryServer(app);

export type AppType = typeof app;
