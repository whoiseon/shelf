import { Sidebar } from '@renderer/components/layouts/sidebar';
import { Providers } from '@renderer/components/providers';
import {
	ResizableHandle,
	ResizablePanel,
	ResizablePanelGroup,
} from '@renderer/components/ui/resizable';
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
					defaultSize="20%"
					minSize="15%"
					maxSize="40%"
				>
					<Sidebar />
				</ResizablePanel>
				<ResizableHandle withHandle />
				<ResizablePanel id="content" defaultSize="80%">
					<main className="flex-1">
						<Outlet />
					</main>
				</ResizablePanel>
			</ResizablePanelGroup>
			<TanStackRouterDevtools />
		</Providers>
	);
}

export const Route = createRootRoute({ component: RootLayout });
