import { serve } from '@hono/node-server';
import type { Hono } from 'hono';
import { closeDatabase } from '@/common/database';
import { env } from '@/common/utils';

export function factoryServer(app: Hono) {
	const server = serve({
		fetch: app.fetch,
		port: env.PORT,
	});

	console.log(`Server is running on http://localhost:${env.PORT}`);

	let isShuttingDown = false;

	async function shutdown(signal: string) {
		if (isShuttingDown) return;
		isShuttingDown = true;

		console.log(`${signal} received. Shutting down...`);

		server.close(async (error) => {
			try {
				closeDatabase();

				if (error) {
					console.error('Failed to close HTTP server:', error);
					process.exit(1);
				}

				console.log('Server and database closed');
			} catch (shutdownError) {
				console.error('Failed to shut down:', shutdownError);
				process.exit(1);
			}
		});
	}

	process.once('SIGINT', () => void shutdown('SIGINT'));
	process.once('SIGTERM', () => void shutdown('SIGTERM'));
}
