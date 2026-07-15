import { defineConfig } from 'drizzle-kit';

const databaseUrl = process.env.DATABASE_URL ?? './data/shelf.db';

export default defineConfig({
	dialect: 'sqlite',
	schema: './src/schemas/*.ts',
	out: './drizzle',
	dbCredentials: {
		url: databaseUrl,
	},
	verbose: true,
	strict: true,
});
