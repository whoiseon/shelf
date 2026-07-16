import type { Context } from 'hono';

export const response = {
	success: <T>(c: Context, data: T, message?: string) => {
		return c.json(
			{
				payload: data,
				message,
			},
			200,
		);
	},

	created: <T>(c: Context, data: T, message?: string) => {
		return c.json(
			{
				payload: data,
				message,
			},
			201,
		);
	},

	badRequest: (c: Context, message: string) => {
		return c.json(
			{
				payload: null,
				message,
			},
			400,
		);
	},

	notFound: (c: Context, message: string) => {
		return c.json(
			{
				payload: null,
				message,
			},
			404,
		);
	},

	conflict: (c: Context, message: string) => {
		return c.json(
			{
				payload: null,
				message,
			},
			409,
		);
	},

	internalError: (c: Context, message: string) => {
		return c.json(
			{
				payload: null,
				message,
			},
			500,
		);
	},
};
