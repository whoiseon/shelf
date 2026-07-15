import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';

const currentDirectory = path.dirname(fileURLToPath(import.meta.url));
const packageDirectory = path.resolve(currentDirectory, '..');

const databasePath =
	process.env.DATABASE_URL ?? path.join(packageDirectory, 'data', 'shelf.db');

const migrationsFolder = path.join(packageDirectory, 'drizzle');

const sqlite = new Database(databasePath);
const db = drizzle(sqlite);

try {
	migrate(db, {
		migrationsFolder,
	});

	console.log(`Database migrated: ${databasePath}`);
} finally {
	sqlite.close();
}
