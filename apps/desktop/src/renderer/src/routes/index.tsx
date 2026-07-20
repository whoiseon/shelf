import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/')({
	component: Index,
});

function Index() {
	return <div className="text-blue-500">Welcome Home!</div>;
}
