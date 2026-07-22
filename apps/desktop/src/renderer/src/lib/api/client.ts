import axios, {
	type AxiosInstance,
	type AxiosRequestConfig,
	type InternalAxiosRequestConfig,
} from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || '';

if (!API_BASE_URL) {
	throw new Error('VITE_API_URL is not set');
}

// 브라우저용 Axios 인스턴스. apps/api 는 단일 access_token 쿠키 + 7일 만료 정책 (Phase 1) 이라
// refresh 인터셉터 없음. 401 은 그대로 caller 에게 전파.
const createApiClient = (): AxiosInstance => {
	const client = axios.create({
		baseURL: API_BASE_URL,
		timeout: 30000,
		headers: {
			'Content-Type': 'application/json',
		},
		// HTTP-only cookie 동봉 — credentials:include 와 동등.
		withCredentials: true,
	});

	if (process.env.NODE_ENV === 'development') {
		client.interceptors.request.use((config: InternalAxiosRequestConfig) => {
			console.log(
				`[API Request] ${config.method?.toUpperCase()} ${config.url}`,
			);
			return config;
		});
		client.interceptors.response.use((response) => {
			console.log(
				`[API Response] ${response.config.method?.toUpperCase()} ${response.config.url} ${response.status}`,
			);
			return response;
		});
	}

	return client;
};

export const apiClient = createApiClient();

// 가벼운 helper. 응답 본문 (ApiResponseDto) 을 그대로 반환.
export const api = {
	get: async <T = unknown>(
		url: string,
		config?: AxiosRequestConfig,
	): Promise<T> => {
		const response = await apiClient.get<T>(url, config);
		return response.data;
	},
	post: async <T = unknown>(
		url: string,
		data?: unknown,
		config?: AxiosRequestConfig,
	): Promise<T> => {
		const response = await apiClient.post<T>(url, data, config);
		return response.data;
	},
	put: async <T = unknown>(
		url: string,
		data?: unknown,
		config?: AxiosRequestConfig,
	): Promise<T> => {
		const response = await apiClient.put<T>(url, data, config);
		return response.data;
	},
	patch: async <T = unknown>(
		url: string,
		data?: unknown,
		config?: AxiosRequestConfig,
	): Promise<T> => {
		const response = await apiClient.patch<T>(url, data, config);
		return response.data;
	},
	delete: async <T = unknown>(
		url: string,
		config?: AxiosRequestConfig,
	): Promise<T> => {
		const response = await apiClient.delete<T>(url, config);
		return response.data;
	},
};
