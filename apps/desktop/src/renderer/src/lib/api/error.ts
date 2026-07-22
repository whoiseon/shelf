import axios from 'axios';

export interface ApiError<T = null> {
	payload: T;
	message: string;
}

const isApiError = (value: unknown): value is ApiError<unknown> => {
	if (typeof value !== 'object' || value === null) return false;
	const candidate = value as Record<string, unknown>;
	const messageField = candidate.message;
	return typeof messageField === 'string';
};

export function extractError<T = null>(error: unknown): ApiError<T> {
	if (!axios.isAxiosError(error)) {
		return {
			payload: null,
			message: '서버 에러 발생',
		} as ApiError<T>;
	}

	if (!isApiError(error)) {
		return {
			payload: null as T,
			message: error.message || '서버 에러 발생',
		};
	}

	return error.response?.data as ApiError<T>;
}
