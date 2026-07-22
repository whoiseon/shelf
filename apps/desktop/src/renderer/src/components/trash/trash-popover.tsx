import { useDndContext, useDroppable } from '@dnd-kit/core';
import { Button } from '@renderer/components/ui/button';
import {
	Popover,
	PopoverContent,
	PopoverDescription,
	PopoverHeader,
	PopoverTitle,
	PopoverTrigger,
} from '@renderer/components/ui/popover';
import { ScrollArea } from '@renderer/components/ui/scroll-area';
import { useTrashRestore } from '@renderer/hooks/mutations/use-trash-restore';
import { useTrash } from '@renderer/hooks/queries/trash/use-trash';
import type { TrashFolder } from '@renderer/lib/api/services/trash.api';
import { cn } from '@renderer/lib/utils';
import type { Bookmark } from '@shelf/shared';
import { ChevronRight, Folder, Globe2, RotateCcw, Trash2 } from 'lucide-react';
import { useState } from 'react';

export function TrashPopover() {
	const [open, setOpen] = useState(false);
	const trash = useTrash();
	const restore = useTrashRestore();
	const { active } = useDndContext();
	const { isOver, setNodeRef } = useDroppable({
		id: 'trash-drop',
		data: { type: 'trash' },
	});
	const isDragging = active != null;
	const itemCount = trash.data
		? trash.data.payload.folders.length + trash.data.payload.bookmarks.length
		: 0;

	return (
		<Popover open={open} onOpenChange={setOpen}>
			<PopoverTrigger
				render={
					<button
						ref={setNodeRef}
						type="button"
						role="treeitem"
						data-tree-item
						aria-label="휴지통 열기"
						className={cn(
							'flex min-w-0 cursor-default items-center rounded-sm py-1 pr-2 pl-2 text-left outline-none transition-[background-color,color,box-shadow] hover:bg-neutral-500/10 focus:bg-neutral-500/15 dark:hover:bg-white/5 dark:focus:bg-white/10',
							isDragging && 'bg-destructive/5 text-destructive',
							isOver &&
								'bg-destructive/15 text-destructive ring-1 ring-inset ring-destructive/40',
						)}
					>
						<span className="size-3.5 shrink-0" />
						<Trash2 className="ml-1.5 size-3.5 shrink-0 fill-foreground stroke-foreground" />
						<span className="ml-1.5 min-w-0 flex-1 truncate text-[13px] font-medium">
							{isOver ? '휴지통으로 이동' : '휴지통'}
						</span>
						{itemCount > 0 ? (
							<span className="ml-2 text-[11px] tabular-nums text-muted-foreground">
								{itemCount}
							</span>
						) : null}
					</button>
				}
			/>
			<PopoverContent
				side="right"
				align="end"
				sideOffset={16}
				className="w-80 gap-2 bg-sidebar/80 p-2 shadow-xl backdrop-blur-md ring-border-accent"
			>
				<PopoverHeader className="px-1.5 py-1">
					<PopoverTitle>휴지통</PopoverTitle>
					<PopoverDescription>
						삭제한 폴더와 북마크를 복원할 수 있습니다.
					</PopoverDescription>
				</PopoverHeader>
				<TrashContent
					isLoading={trash.isLoading}
					isError={trash.isError}
					folders={trash.data?.payload.folders ?? []}
					bookmarks={trash.data?.payload.bookmarks ?? []}
					restore={restore}
				/>
			</PopoverContent>
		</Popover>
	);
}

type TrashContentProps = {
	isLoading: boolean;
	isError: boolean;
	folders: TrashFolder[];
	bookmarks: Bookmark[];
	restore: ReturnType<typeof useTrashRestore>;
};

function TrashContent({
	isLoading,
	isError,
	folders,
	bookmarks,
	restore,
}: TrashContentProps) {
	if (isLoading) {
		return <TrashMessage>휴지통을 불러오는 중…</TrashMessage>;
	}

	if (isError) {
		return <TrashMessage>휴지통을 불러오지 못했습니다.</TrashMessage>;
	}

	if (folders.length === 0 && bookmarks.length === 0) {
		return <TrashMessage>휴지통이 비어 있습니다.</TrashMessage>;
	}

	return (
		<ScrollArea className="max-h-80">
			<div className="flex flex-col pr-1">
				{folders.map((folder) => (
					<TrashFolderItem
						key={`folder:${folder.id}`}
						folder={folder}
						depth={0}
						isRestoring={
							restore.isPending &&
							restore.variables?.type === 'folder' &&
							restore.variables.id === folder.id
						}
						onRestore={() => restore.mutate({ type: 'folder', id: folder.id })}
					/>
				))}
				{bookmarks.map((bookmark) => (
					<TrashBookmarkItem
						key={`bookmark:${bookmark.id}`}
						bookmark={bookmark}
						isRestoring={
							restore.isPending &&
							restore.variables?.type === 'bookmark' &&
							restore.variables.id === bookmark.id
						}
						onRestore={() =>
							restore.mutate({ type: 'bookmark', id: bookmark.id })
						}
					/>
				))}
			</div>
		</ScrollArea>
	);
}

function TrashFolderItem({
	folder,
	depth,
	isRestoring = false,
	onRestore,
}: {
	folder: TrashFolder;
	depth: number;
	isRestoring?: boolean;
	onRestore?: () => void;
}) {
	const [isOpen, setIsOpen] = useState(false);
	const bookmarks = folder.bookmarks ?? [];
	const hasChildren = folder.children.length > 0 || bookmarks.length > 0;

	return (
		<div className="flex flex-col">
			<div
				className="group flex min-w-0 items-center rounded-sm py-1 pr-1 hover:bg-neutral-500/10 dark:hover:bg-white/5"
				style={{ paddingInlineStart: 8 + depth * 16 }}
			>
				<button
					type="button"
					disabled={!hasChildren}
					onClick={() => setIsOpen((current) => !current)}
					aria-label={isOpen ? `${folder.name} 접기` : `${folder.name} 펼치기`}
					aria-expanded={hasChildren ? isOpen : undefined}
					className="flex min-w-0 flex-1 cursor-default items-center text-left outline-none disabled:pointer-events-none"
				>
					<span className="flex size-3.5 shrink-0 items-center justify-center">
						{hasChildren ? (
							<ChevronRight
								className={cn(
									'size-3.5 transition-transform duration-150',
									isOpen && 'rotate-90',
								)}
							/>
						) : null}
					</span>
					<Folder className="ml-1.5 size-3.5 shrink-0 fill-neutral-500 stroke-neutral-500" />
					<span className="ml-1.5 min-w-0 flex-1 truncate text-[13px] font-medium">
						{folder.name}
					</span>
				</button>
				{onRestore ? (
					<RestoreButton isRestoring={isRestoring} onRestore={onRestore} />
				) : null}
			</div>
			{isOpen ? (
				<div className="flex flex-col">
					{folder.children.map((child) => (
						<TrashFolderItem key={child.id} folder={child} depth={depth + 1} />
					))}
					{bookmarks.map((bookmark) => (
						<TrashBookmarkItem
							key={bookmark.id}
							bookmark={bookmark}
							depth={depth + 1}
						/>
					))}
				</div>
			) : null}
		</div>
	);
}

function TrashBookmarkItem({
	bookmark,
	depth = 0,
	isRestoring = false,
	onRestore,
}: {
	bookmark: Bookmark;
	depth?: number;
	isRestoring?: boolean;
	onRestore?: () => void;
}) {
	const [showFavicon, setShowFavicon] = useState(Boolean(bookmark.faviconUrl));

	return (
		<TrashItem
			icon={
				showFavicon && bookmark.faviconUrl ? (
					<img
						src={bookmark.faviconUrl}
						alt=""
						onError={() => setShowFavicon(false)}
						className="size-3.5 rounded-[3px] object-contain"
					/>
				) : (
					<Globe2 className="size-3.5 text-muted-foreground" />
				)
			}
			label={bookmark.title}
			depth={depth}
			isRestoring={isRestoring}
			onRestore={onRestore}
		/>
	);
}

function TrashItem({
	icon,
	label,
	depth = 0,
	isRestoring,
	onRestore,
}: {
	icon: React.ReactNode;
	label: string;
	depth?: number;
	isRestoring: boolean;
	onRestore?: () => void;
}) {
	return (
		<div
			className="group flex min-w-0 items-center rounded-sm py-1 pr-1 hover:bg-neutral-500/10 dark:hover:bg-white/5"
			style={{ paddingInlineStart: 28 + depth * 16 }}
		>
			<span className="flex size-3.5 shrink-0 items-center justify-center">
				{icon}
			</span>
			<span className="ml-1.5 min-w-0 flex-1 truncate text-[13px]">
				{label}
			</span>
			{onRestore ? (
				<RestoreButton isRestoring={isRestoring} onRestore={onRestore} />
			) : null}
		</div>
	);
}

function RestoreButton({
	isRestoring,
	onRestore,
}: {
	isRestoring: boolean;
	onRestore: () => void;
}) {
	return (
		<Button
			type="button"
			variant="ghost"
			size="xs"
			disabled={isRestoring}
			onClick={onRestore}
			className={cn('ml-2 shrink-0', isRestoring && 'cursor-wait')}
		>
			<RotateCcw className={cn(isRestoring && 'animate-spin')} />
			{isRestoring ? '복원 중' : '복원'}
		</Button>
	);
}

function TrashMessage({ children }: { children: React.ReactNode }) {
	return (
		<p className="px-2 py-6 text-center text-xs text-muted-foreground">
			{children}
		</p>
	);
}
