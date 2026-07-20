type FolderNodeBase = {
	id: number;
	parentFolderId: number | null;
};

export type FolderTreeNode<T extends FolderNodeBase> = T & {
	children: FolderTreeNode<T>[];
};

export function buildFolderTree<T extends FolderNodeBase>(
	rows: readonly T[],
): FolderTreeNode<T>[] {
	const nodes = new Map<number, FolderTreeNode<T>>();

	for (const row of rows) {
		nodes.set(row.id, {
			...row,
			children: [],
		});
	}

	const roots: FolderTreeNode<T>[] = [];

	for (const node of nodes.values()) {
		if (node.parentFolderId === null) {
			roots.push(node);
			continue;
		}

		const parent = nodes.get(node.parentFolderId);

		if (!parent || parent.id === node.id) {
			roots.push(node);
			continue;
		}

		parent.children.push(node);
	}

	return roots;
}

export function createUniqueFolderName(
	requestedName: string,
	existingNames: ReadonlySet<string>,
): string {
	if (!existingNames.has(requestedName)) {
		return requestedName;
	}

	let suffix = 1;

	while (existingNames.has(`${requestedName} (${suffix})`)) {
		suffix += 1;
	}

	return `${requestedName} (${suffix})`;
}
