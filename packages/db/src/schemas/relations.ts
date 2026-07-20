import { relations } from 'drizzle-orm';
import { bookmarks } from './bookmarks';
import { folders } from './folders';

export const foldersRelations = relations(folders, ({ one, many }) => ({
	parent: one(folders, {
		fields: [folders.parentFolderId],
		references: [folders.id],
		relationName: 'folderHierarchy',
	}),

	children: many(folders, {
		relationName: 'folderHierarchy',
	}),

	bookmarks: many(bookmarks),
}));

export const bookmarksRelations = relations(bookmarks, ({ one }) => ({
	folder: one(folders, {
		fields: [bookmarks.folderId],
		references: [folders.id],
	}),
}));
