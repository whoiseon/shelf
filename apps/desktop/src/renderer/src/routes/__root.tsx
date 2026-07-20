import { createRootRoute, Outlet } from '@tanstack/react-router';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';

function RootLayout() {
	return (
		<div>
			Tanstack Router
			<Outlet />
			<TanStackRouterDevtools />
		</div>
	);
}

export const Route = createRootRoute({ component: RootLayout });
