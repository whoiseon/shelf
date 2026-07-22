import { extractError } from '@renderer/lib/api/error';
import {
	MutationCache,
	QueryCache,
	QueryClient,
	QueryClientProvider,
} from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import type { ReactNode } from 'react';

// Phase 2 에서 toast 라이브러리 도입 시 onError 콜백에서 사용.
// 지금은 콘솔 로그만.
function logError(error: unknown): void {
	const errorResponse = extractError(error);
	console.warn('[query error]', errorResponse.message);
}

function makeQueryClient(): QueryClient {
	return new QueryClient({
		defaultOptions: {
			queries: {
				retry: false,
				// SSR 환경에서 클라이언트가 즉시 refetch 하지 않도록 staleTime 기본값을 1분 둠.
				staleTime: 60_000,
			},
		},
		queryCache: new QueryCache({
			onError: (error) => {
				logError(error);
			},
		}),
		mutationCache: new MutationCache({
			onError: (error) => logError(error),
		}),
	});
}

export function ReactQueryProvider({ children }: { children: ReactNode }) {
	const queryClient = makeQueryClient();

	return (
		<QueryClientProvider client={queryClient}>
			{children}
			{process.env.NODE_ENV === 'development' && <ReactQueryDevtools />}
		</QueryClientProvider>
	);
}
