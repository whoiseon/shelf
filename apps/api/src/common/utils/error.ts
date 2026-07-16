export function isUniqueConstraintError(error: unknown) {
	let current: unknown = error;

	while (current && typeof current === 'object') {
		if ('code' in current && current.code === 'SQLITE_CONSTRAINT_UNIQUE') {
			return true;
		}

		current = 'cause' in current ? current.cause : undefined;
	}

	return false;
}
