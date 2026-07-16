import { mkdirSync } from 'node:fs';
import path from 'node:path';
import { createDatabase } from '@shelf/db';
import { env } from '../utils';

const databasePath = path.resolve(env.DATABASE_URL);

mkdirSync(path.dirname(databasePath), {
	recursive: true,
});

export const database = createDatabase(databasePath);

export function closeDatabase() {
	database.sqlite.close();
}

export const db = database.db;
