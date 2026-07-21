import { ThemeToggle } from '@renderer/components/system/theme-toggle';
import { Input } from '@renderer/components/ui/input';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { useIsWindowFocused } from '@renderer/hooks/use-is-window-focused';
import { cn } from '@renderer/lib/utils';
import { Search } from 'lucide-react';

export function Sidebar() {
	const [isWindowFocused] = useIsWindowFocused();

	return (
		<div className="flex flex-col h-full bg-transparent p-2 z-10">
			<div
				className={cn(
					'relative flex-1 overflow-hidden rounded-xl border bg-sidebar transition-[background-color,border-color,box-shadow,opacity] duration-150 pb-2',
					isWindowFocused
						? 'border-border shadow-xl'
						: 'border-sidebar bg-neutral-200 dark:bg-neutral-800 shadow-none',
				)}
			>
				<header className="flex flex-col">
					<div className="h-10 flex items-center justify-end px-2.5 app-drag-region">
						<div className="app-no-drag-region">
							<ThemeToggle />
						</div>
					</div>
					<div className="px-2.5 pb-2 pt-1">
						<div className="relative">
							<Search className="absolute left-2 size-4 translate-y-1/2 text-muted-foreground" />
							<Input className="pl-7" placeholder="검색" />
						</div>
					</div>
				</header>
				<ScrollArea className="h-[calc(100%-84px)] px-2.5">13</ScrollArea>
			</div>
		</div>
	);
}
