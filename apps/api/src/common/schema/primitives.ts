import { z } from 'zod';

export const positiveIntId = z.coerce.number().int().positive();
