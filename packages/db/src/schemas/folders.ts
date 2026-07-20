import {
	type AnySQLiteColumn,
	index,
	integer,
	sqliteTable,
	text,
} from 'drizzle-orm/sqlite-core';

export const folders = sqliteTable(
	'folders',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),

		name: text('name').notNull(),
		position: integer('position').notNull(),
		parentFolderId: integer('parent_folder_id').references(
			(): AnySQLiteColumn => folders.id,
			{
				onDelete: 'cascade',
				onUpdate: 'cascade',
			},
		),

		createdAt: integer('created_at', {
			mode: 'timestamp_ms',
		})
			.notNull()
			.$defaultFn(() => new Date()),

		updatedAt: integer('updated_at', {
			mode: 'timestamp_ms',
		})
			.notNull()
			.$defaultFn(() => new Date()),

		deletedAt: integer('deleted_at', {
			mode: 'timestamp_ms',
		}),
	},
	(table) => [
		index('folders_parent_position_idx').on(
			table.parentFolderId,
			table.position,
		),
	],
);

export type FolderSelect = typeof folders.$inferSelect;
export type FolderInsert = typeof folders.$inferInsert;
