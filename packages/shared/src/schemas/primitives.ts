import { z } from 'zod';

export const positiveIntId = z.coerce.number().int().positive({
	message: '요청 값이 올바르지 않습니다.',
});
