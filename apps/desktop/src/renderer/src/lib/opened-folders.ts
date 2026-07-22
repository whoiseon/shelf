import { storage } from './storage';

const FOLDER_OPEN_STATUS_KEY = 'opened_folders';

export function getOpenedFolders() {
	const openedFolders = storage.getItem(FOLDER_OPEN_STATUS_KEY) as number[];

	if (!openedFolders) {
		storage.setItem(FOLDER_OPEN_STATUS_KEY, []);
		return [];
	}

	return openedFolders;
}

export function toggleOpenedFolder(folderId: number) {
	const openedFolders = getOpenedFolders();

	if (openedFolders.includes(folderId)) {
		const newOpenedFolders = openedFolders.filter((id) => folderId !== id);
		storage.setItem(FOLDER_OPEN_STATUS_KEY, newOpenedFolders);
		return;
	}

	openedFolders.push(folderId);
	storage.setItem(FOLDER_OPEN_STATUS_KEY, openedFolders);
}
