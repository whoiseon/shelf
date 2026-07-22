import { ReactQueryProvider } from '@renderer/components/providers/react-query-provider';
import { ThemeProvider } from '@renderer/components/providers/theme-provider';
import { TooltipProvider } from '@renderer/components/ui/tooltip';
import type { PropsWithChildren } from 'react';

export function Providers({ children }: PropsWithChildren) {
	return (
		<ReactQueryProvider>
			<ThemeProvider>
				<TooltipProvider>{children}</TooltipProvider>
			</ThemeProvider>
		</ReactQueryProvider>
	);
}
