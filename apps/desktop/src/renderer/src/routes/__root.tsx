import { Providers } from '@renderer/components/providers';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@renderer/components/ui/resizable';
import { Sidebar } from '@renderer/routes/-components/sidebar';
import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { useDefaultLayout } from 'react-resizable-panels';

function RootLayout() {
	const { defaultLayout, onLayoutChanged } = useDefaultLayout({
		id: 'shelf-main-layout',
		storage: localStorage,
		onlySaveAfterUserInteractions: true,
	});

	return (
		<Providers>
			<ResizablePanelGroup
				id="shelf-main-layout"
				orientation="horizontal"
				defaultLayout={defaultLayout}
				onLayoutChanged={onLayoutChanged}
			>
				<ResizablePanel
					id="sidebar"
					className="relative z-10 overflow-visible!"
					defaultSize="20%"
					minSize="15%"
					maxSize="40%"
				>
					<Sidebar />
				</ResizablePanel>
				<ResizableHandle className="-translate-x-2 bg-transparent" />
				<ResizablePanel id="content" className="relative" defaultSize="80%">
					<div className="absolute inset-x-0 top-0 h-12 app-drag-region" />
					<main className="relative flex-1">
						<Outlet />
					</main>
				</ResizablePanel>
			</ResizablePanelGroup>
			<TanStackRouterDevtools />
			{/*<div className="absolute top-0 w-full bg-transparent h-12 app-drag-region" />*/}
		</Providers>
	);
}

export const Route = createRootRoute({ component: RootLayout });
