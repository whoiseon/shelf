import 'dotenv/config';
import * as process from 'node:process';
import { z } from 'zod';

const envSchema = z.object({
	PORT: z.coerce.number().int().positive().default(3070),
	DATABASE_URL: z.string().min(1),
});

export const env = envSchema.parse(process.env);
