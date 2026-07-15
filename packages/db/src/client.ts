import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';

import * as schema from './schemas';

export function createDatabase(databasePath: string) {
	const sqlite = new Database(databasePath);

	sqlite.pragma('journal_mode = WAL');
	sqlite.pragma('foreign_keys = ON');

	const db = drizzle({
		client: sqlite,
		schema,
	});

	return {
		db,
		sqlite,
	};
}

export type DatabaseClient = ReturnType<typeof createDatabase>['db'];
