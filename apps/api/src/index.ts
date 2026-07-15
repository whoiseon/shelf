import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { env } from './common/utils';

const app = new Hono();

app.get('/', (c) => {
	return c.text('Hello Hono!');
});

serve(
	{
		fetch: app.fetch,
		port: env.PORT,
	},
	(info) => {
		console.log(`Server is running on http://localhost:${info.port}`);
	},
);
