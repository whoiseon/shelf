import { CreateBookmarkDialog } from '@renderer/components/dialog/create-bookmark-dialog';
import { CreateFolderDialog } from '@renderer/components/dialog/create-folder-dialog';
import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { useDebounce } from '@renderer/hooks/use-debounce';
import { useIsWindowFocused } from '@renderer/hooks/use-is-window-focused';
import { cn } from '@renderer/lib/utils';
import { FolderTreeList } from '@renderer/routes/-components/folder-tree-list';
import { BookmarkPlus, FolderPlus, Search } from 'lucide-react';
import { useState } from 'react';

export function Sidebar() {
	const [isWindowFocused] = useIsWindowFocused();
	const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
	const [isCreateBookmarkOpen, setIsCreateBookmarkOpen] = useState(false);
	const [searchKeyword, setSearchKeyword] = useState('');
	const debouncedSearchKeyword = useDebounce(searchKeyword);
	const focusSearchResult = (position: 'first' | 'last', open = false) => {
		const results = document.querySelectorAll<HTMLButtonElement>(
			'[data-search-result="true"]',
		);
		const result =
			position === 'first' ? results[0] : results[results.length - 1];

		if (open) result?.click();
		else result?.focus();
	};

	return (
		<div className="flex h-full flex-col bg-transparent p-2 z-10">
			<div
				className={cn(
					'relative flex-1 overflow-hidden rounded-xl border bg-sidebar transition-[background-color,border-color,box-shadow,opacity] duration-150 pb-2',
					isWindowFocused
						? 'border-border shadow-xl'
						: 'border-sidebar bg-neutral-200 dark:bg-neutral-800 shadow-none',
				)}
			>
				<header className="flex flex-col">
					<div className="app-drag-region flex h-10 items-center justify-end gap-0.5 px-2.5">
						<Button
							type="button"
							aria-label="폴더 추가"
							title="폴더 추가"
							onClick={() => setIsCreateFolderOpen(true)}
							variant="ghost"
							size="icon-sm"
							className="app-no-drag-region text-muted-foreground"
						>
							<FolderPlus className="size-4.5" />
						</Button>
						<Button
							type="button"
							aria-label="북마크 추가"
							title="북마크 추가"
							onClick={() => setIsCreateBookmarkOpen(true)}
							variant="ghost"
							size="icon-sm"
							className="app-no-drag-region text-muted-foreground"
						>
							<BookmarkPlus className="size-4.5" />
						</Button>
					</div>
					<div className="px-2.5 pb-2 pt-1">
						<div className="relative">
							<Search className="absolute left-2 size-4 translate-y-1/2 text-muted-foreground" />
							<Input
								value={searchKeyword}
								onChange={(event) => setSearchKeyword(event.target.value)}
								onKeyDown={(event) => {
									if (!debouncedSearchKeyword.trim()) return;

									if (event.key === 'ArrowDown') {
										event.preventDefault();
										focusSearchResult('first');
									} else if (event.key === 'ArrowUp') {
										event.preventDefault();
										focusSearchResult('last');
									} else if (event.key === 'Enter') {
										event.preventDefault();
										focusSearchResult('first', true);
									}
								}}
								className="pl-7"
								placeholder="검색"
								aria-label="폴더 및 북마크 검색"
							/>
						</div>
					</div>
				</header>
				<ScrollArea className="h-[calc(100%-84px)] px-2.5">
					<FolderTreeList keyword={debouncedSearchKeyword} />
				</ScrollArea>
			</div>
			<CreateFolderDialog
				open={isCreateFolderOpen}
				onOpenChange={setIsCreateFolderOpen}
			/>
			<CreateBookmarkDialog
				open={isCreateBookmarkOpen}
				onOpenChange={setIsCreateBookmarkOpen}
			/>
		</div>
	);
}
