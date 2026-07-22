import {
	DndContext,
	type DragEndEvent,
	DragOverlay,
	type DragStartEvent,
	PointerSensor,
	pointerWithin,
	useDndContext,
	useDraggable,
	useDroppable,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import { BookmarkPreviewImage } from '@renderer/components/bookmark/bookmark-preview-image';
import { CreateFolderDialog } from '@renderer/components/dialog/create-folder-dialog';
import { UpdateBookmarkDialog } from '@renderer/components/dialog/update-bookmark-dialog';
import { TrashPopover } from '@renderer/components/trash/trash-popover';
import {
	ContextMenu,
	ContextMenuContent,
	ContextMenuItem,
	ContextMenuTrigger,
} from '@renderer/components/ui/context-menu';
import { Input } from '@renderer/components/ui/input';
import { Skeleton } from '@renderer/components/ui/skeleton';
import {
	Tooltip,
	TooltipContent,
	TooltipTrigger,
} from '@renderer/components/ui/tooltip';
import { useBookmarkDelete } from '@renderer/hooks/mutations/use-bookmark-delete';
import { useBookmarkMove } from '@renderer/hooks/mutations/use-bookmark-move';
import { useFavoriteToggle } from '@renderer/hooks/mutations/use-favorite-toggle';
import { useFolderDelete } from '@renderer/hooks/mutations/use-folder-delete';
import { useFolderMove } from '@renderer/hooks/mutations/use-folder-move';
import { useFolderRename } from '@renderer/hooks/mutations/use-folder-rename';
import { useBookmarks } from '@renderer/hooks/queries/bookmarks/use-bookmarks';
import { useFolders } from '@renderer/hooks/queries/folders/use-folders';
import {
	getOpenedFolders,
	toggleOpenedFolder,
} from '@renderer/lib/opened-folders';
import { cn } from '@renderer/lib/utils';
import type { FolderTree } from '@shelf/shared';
import { ChevronRight, Folder, Globe2, Star } from 'lucide-react';
import {
	type KeyboardEvent,
	useEffect,
	useMemo,
	useRef,
	useState,
} from 'react';

type Bookmark = NonNullable<FolderTree['bookmarks']>[number];

const BASE_PADDING = 8;
const DEPTH_INDENT = 16;

type SortableTreeItemData = {
	type: 'folder' | 'bookmark';
	itemId: number;
	parentId: number | null;
	label: string;
	faviconUrl?: string;
};

type DropTargetData =
	| SortableTreeItemData
	| { type: 'trash' }
	| {
			type: 'folder-container';
			folderId: number;
			childFolderCount: number;
			bookmarkCount: number;
	  }
	| {
			type: 'root';
			rootFolderCount: number;
			rootBookmarkCount: number;
	  };

const folderSortableId = (folderId: number) => `folder:${folderId}`;
const bookmarkSortableId = (bookmarkId: number) => `bookmark:${bookmarkId}`;
const folderContainerId = (folderId: number) => `folder-container:${folderId}`;
const ROOT_DROP_ID = 'root-drop';

function findFolder(
	folders: FolderTree[],
	folderId: number,
): FolderTree | null {
	for (const folder of folders) {
		if (folder.id === folderId) return folder;

		const child = findFolder(folder.children, folderId);
		if (child) return child;
	}

	return null;
}

function filterFolderTree(
	folders: FolderTree[],
	keyword: string,
): FolderTree[] {
	return folders.flatMap((folder) => {
		const children = filterFolderTree(folder.children, keyword);
		const bookmarks = (folder.bookmarks ?? []).filter((bookmark) =>
			bookmark.title.toLocaleLowerCase().includes(keyword),
		);
		const isFolderMatch = folder.name.toLocaleLowerCase().includes(keyword);

		if (!isFolderMatch && children.length === 0 && bookmarks.length === 0) {
			return [];
		}

		return [{ ...folder, children, bookmarks }];
	});
}

function moveTreeFocus(
	event: KeyboardEvent<HTMLButtonElement>,
	direction: -1 | 1,
) {
	event.preventDefault();

	const tree = event.currentTarget.closest('[role="tree"]');
	if (!tree) return;

	const items = Array.from(
		tree.querySelectorAll<HTMLButtonElement>('[data-tree-item]'),
	).filter((item) => !item.disabled);
	const currentIndex = items.indexOf(event.currentTarget);
	const nextItem = items[currentIndex + direction];

	if (!nextItem) return;

	nextItem.focus();
	nextItem.scrollIntoView({ block: 'nearest' });
}

function handleVerticalTreeNavigation(event: KeyboardEvent<HTMLButtonElement>) {
	if (event.key === 'ArrowUp') {
		moveTreeFocus(event, -1);
		return true;
	}

	if (event.key === 'ArrowDown') {
		moveTreeFocus(event, 1);
		return true;
	}

	return false;
}

export function FolderTreeList({ keyword = '' }: { keyword?: string }) {
	const {
		data: folderData,
		isLoading: isFolderDataLoading,
		isError: isFolderDataError,
	} = useFolders();
	const {
		data: bookmarkData,
		isLoading: isBookmarkDataLoading,
		isError: isBookmarkDataError,
	} = useBookmarks({ hasFolder: false });
	const folderMove = useFolderMove();
	const bookmarkMove = useBookmarkMove();
	const folderDelete = useFolderDelete();
	const bookmarkDelete = useBookmarkDelete();
	const [draggedItem, setDraggedItem] = useState<SortableTreeItemData | null>(
		null,
	);
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
	);

	const isLoading = isBookmarkDataLoading || isFolderDataLoading;
	const isError = isBookmarkDataError || isFolderDataError;
	const normalizedKeyword = keyword.trim().toLocaleLowerCase();
	const filteredFolders = useMemo(
		() =>
			normalizedKeyword
				? filterFolderTree(folderData?.payload ?? [], normalizedKeyword)
				: (folderData?.payload ?? []),
		[folderData?.payload, normalizedKeyword],
	);
	const filteredBookmarks = useMemo(
		() =>
			normalizedKeyword
				? (bookmarkData?.payload ?? []).filter((bookmark) =>
						bookmark.title.toLocaleLowerCase().includes(normalizedKeyword),
					)
				: (bookmarkData?.payload ?? []),
		[bookmarkData?.payload, normalizedKeyword],
	);

	if (isLoading) {
		return <FolderTreeSkeleton />;
	}

	if (isError || !bookmarkData || !folderData) {
		return (
			<p className="px-2 py-1 text-xs text-muted-foreground">
				폴더를 불러오지 못했습니다.
			</p>
		);
	}

	const isEmpty =
		filteredFolders.length === 0 && filteredBookmarks.length === 0;

	const handleDragEnd = ({ active, over }: DragEndEvent) => {
		setDraggedItem(null);
		if (!over || active.id === over.id) return;

		const activeData = active.data.current as SortableTreeItemData | undefined;
		const overData = over.data.current as DropTargetData | undefined;

		if (!activeData || !overData) return;

		if (overData.type === 'trash') {
			if (activeData.type === 'folder') {
				folderDelete.mutate(activeData.itemId);
			} else {
				bookmarkDelete.mutate(activeData.itemId);
			}
			return;
		}

		if (overData.type === 'root') {
			if (activeData.parentId === null) return;

			if (activeData.type === 'bookmark') {
				bookmarkMove.mutate({
					bookmarkId: activeData.itemId,
					input: {
						folderId: null,
						position: overData.rootBookmarkCount,
					},
				});
			} else {
				folderMove.mutate({
					folderId: activeData.itemId,
					input: {
						parentFolderId: null,
						position: overData.rootFolderCount,
					},
				});
			}
			return;
		}

		if (overData.type === 'folder-container') {
			if (activeData.type === 'folder') {
				const activeFolder = findFolder(folderData.payload, activeData.itemId);
				const targetInActiveSubtree = activeFolder
					? findFolder(activeFolder.children, overData.folderId)
					: null;
				if (activeData.itemId === overData.folderId || targetInActiveSubtree) {
					return;
				}

				folderMove.mutate({
					folderId: activeData.itemId,
					input: {
						parentFolderId: overData.folderId,
						position: overData.childFolderCount,
					},
				});
				return;
			}

			bookmarkMove.mutate({
				bookmarkId: activeData.itemId,
				input: {
					folderId: overData.folderId,
					position: overData.bookmarkCount,
				},
			});
			return;
		}
	};

	const handleDragStart = ({ active }: DragStartEvent) => {
		setDraggedItem(active.data.current as SortableTreeItemData);
	};

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={pointerWithin}
			onDragStart={handleDragStart}
			onDragEnd={handleDragEnd}
			onDragCancel={() => setDraggedItem(null)}
		>
			<div role="tree" aria-label="북마크 폴더" className="flex flex-col">
				{isEmpty ? (
					<p className="px-2 py-1 text-xs text-muted-foreground">
						{normalizedKeyword ? '검색 결과가 없습니다.' : '북마크가 없습니다.'}
					</p>
				) : null}
				{filteredFolders.map((folder) => (
					<FolderItem
						key={folder.id}
						folder={folder}
						depth={0}
						keyword={normalizedKeyword}
					/>
				))}
				{filteredBookmarks.map((bookmark) => (
					<BookmarkItem
						key={bookmark.id}
						bookmark={bookmark}
						depth={0}
						keyword={normalizedKeyword}
					/>
				))}
				<RootDropTarget
					rootFolderCount={folderData.payload.length}
					rootBookmarkCount={bookmarkData.payload.length}
				/>
				<TrashPopover />
			</div>
			<DragOverlay dropAnimation={null}>
				{draggedItem ? <TreeItemDragOverlay item={draggedItem} /> : null}
			</DragOverlay>
		</DndContext>
	);
}

function TreeItemDragOverlay({ item }: { item: SortableTreeItemData }) {
	return (
		<div className="flex max-w-64 items-center gap-1.5 rounded-md bg-background/50 backdrop-blur-md px-2.5 py-1.5 text-[13px] font-medium shadow-lg">
			{item.type === 'folder' ? (
				<Folder className="size-3.5 shrink-0 fill-neutral-500 stroke-neutral-500" />
			) : (
				<span className="relative flex size-3.5 shrink-0 items-center justify-center">
					{item.faviconUrl ? (
						<img
							src={item.faviconUrl}
							alt=""
							draggable={false}
							onError={(event) => {
								event.currentTarget.style.display = 'none';
							}}
							className="absolute inset-0 size-3.5 rounded-[3px] object-contain"
						/>
					) : (
						<Globe2 className="size-3.5 text-muted-foreground" />
					)}
				</span>
			)}
			<span className="truncate">{item.label}</span>
		</div>
	);
}

function RootDropTarget({
	rootFolderCount,
	rootBookmarkCount,
}: {
	rootFolderCount: number;
	rootBookmarkCount: number;
}) {
	const { active } = useDndContext();
	const activeData = active?.data.current as SortableTreeItemData | undefined;
	const { isOver, setNodeRef } = useDroppable({
		id: ROOT_DROP_ID,
		data: {
			type: 'root',
			rootFolderCount,
			rootBookmarkCount,
		} satisfies DropTargetData,
	});
	const isVisible = activeData != null && activeData.parentId !== null;

	return (
		<div
			ref={setNodeRef}
			className={cn(
				'h-7 shrink-0 overflow-hidden rounded-sm border border-dashed transition-[background-color,border-color,color,opacity] duration-150',
				isVisible
					? 'border-border/70 bg-background/70 opacity-100'
					: 'pointer-events-none border-transparent bg-transparent opacity-0',
				isOver &&
					'bg-primary/10 text-primary ring-1 ring-inset ring-primary/40',
			)}
		>
			<div className="flex size-full items-center justify-center text-[11px] font-medium">
				최상위로 이동
			</div>
		</div>
	);
}

function FolderItem({
	folder,
	depth,
	keyword,
	closeParent,
}: {
	folder: FolderTree;
	depth: number;
	keyword: string;
	closeParent?: () => void;
}) {
	const openedFolders = getOpenedFolders();
	const buttonRef = useRef<HTMLButtonElement>(null);
	const renameInputRef = useRef<HTMLInputElement>(null);
	const folderRename = useFolderRename();
	const folderDelete = useFolderDelete();
	const { active } = useDndContext();
	const { isOver: isContainerOver, setNodeRef: setContainerDropRef } =
		useDroppable({
			id: folderContainerId(folder.id),
			data: {
				type: 'folder-container',
				folderId: folder.id,
				childFolderCount: folder.children.length,
				bookmarkCount: folder.bookmarks?.length ?? 0,
			} satisfies DropTargetData,
			disabled: active?.data.current?.itemId === folder.id,
		});
	const {
		attributes,
		listeners,
		setNodeRef: setDraggableRef,
		isDragging,
	} = useDraggable({
		id: folderSortableId(folder.id),
		disabled: Boolean(keyword),
		data: {
			type: 'folder',
			itemId: folder.id,
			parentId: folder.parentFolderId,
			label: folder.name,
		} satisfies SortableTreeItemData,
	});
	const activeItem = active?.data.current as SortableTreeItemData | undefined;
	const isFolderContainerTarget = isContainerOver && Boolean(activeItem);

	const [isOpen, setIsOpen] = useState(() => openedFolders.includes(folder.id));
	const [isRenaming, setIsRenaming] = useState(false);
	const [isCreateFolderOpen, setIsCreateFolderOpen] = useState(false);
	const [draftName, setDraftName] = useState(folder.name);

	useEffect(() => {
		if (!isRenaming) return;

		const frame = requestAnimationFrame(() => {
			renameInputRef.current?.focus();
			renameInputRef.current?.select();
		});

		return () => cancelAnimationFrame(frame);
	}, [isRenaming]);

	const bookmarks = folder.bookmarks ?? [];
	const hasChildren = folder.children.length > 0 || bookmarks.length > 0;
	const isExpanded = keyword ? hasChildren : isOpen;
	const setFolderOpen = (open: boolean) => {
		if (keyword) return;
		if (!hasChildren || open === isOpen) return;

		setIsOpen(open);
		toggleOpenedFolder(folder.id);
	};
	const closeFolderAndFocus = () => {
		setFolderOpen(false);
		buttonRef.current?.focus();
	};
	const cancelRename = () => {
		setDraftName(folder.name);
		setIsRenaming(false);
	};
	const submitRename = () => {
		const name = draftName.trim();

		if (!name || name === folder.name) {
			cancelRename();
			return;
		}

		folderRename.mutate({ folderId: folder.id, input: { name } });
		setIsRenaming(false);
	};

	return (
		<div className="flex flex-col">
			<CreateFolderDialog
				open={isCreateFolderOpen}
				onOpenChange={setIsCreateFolderOpen}
				parentFolderId={folder.id}
			/>
			{isRenaming ? (
				<div
					className="flex min-w-0 items-center py-0.5 pr-2"
					style={{ paddingInlineStart: BASE_PADDING + depth * DEPTH_INDENT }}
				>
					<span className="size-3.5 shrink-0" />
					<Folder className="ml-1.5 size-3.5 shrink-0 fill-neutral-500 stroke-neutral-500 dark:fill-foreground dark:stroke-foreground" />
					<Input
						ref={renameInputRef}
						value={draftName}
						disabled={folderRename.isPending}
						onChange={(event) => setDraftName(event.target.value)}
						onBlur={cancelRename}
						onKeyDown={(event) => {
							event.stopPropagation();
							if (event.key === 'Enter') {
								event.preventDefault();
								submitRename();
							}
							if (event.key === 'Escape') {
								event.preventDefault();
								cancelRename();
							}
						}}
						className="ml-1.5 h-6 min-w-0 flex-1 px-1.5 text-[13px]"
					/>
				</div>
			) : (
				<ContextMenu>
					<ContextMenuTrigger
						render={
							<button
								ref={(node) => {
									buttonRef.current = node;
									setDraggableRef(node);
									setContainerDropRef(node);
								}}
								{...attributes}
								{...listeners}
								type="button"
								role="treeitem"
								data-tree-item
								data-search-result={keyword ? 'true' : undefined}
								aria-level={depth + 1}
								aria-expanded={hasChildren ? isExpanded : undefined}
								onClick={() => setFolderOpen(!isExpanded)}
								onKeyDown={(event) => {
									if (handleVerticalTreeNavigation(event)) return;

									if (
										event.key === 'ArrowRight' &&
										hasChildren &&
										!isExpanded
									) {
										event.preventDefault();
										setFolderOpen(true);
									}

									if (event.key === 'ArrowLeft') {
										if (hasChildren && isExpanded) {
											event.preventDefault();
											setFolderOpen(false);
										} else if (closeParent) {
											event.preventDefault();
											closeParent();
										}
									}
								}}
								className={cn(
									'relative flex min-w-0 cursor-default touch-none items-center rounded-sm py-1 pr-2 text-left outline-none focus:bg-neutral-500/15 dark:focus:bg-white/10',
									isDragging && 'z-20 opacity-50',
									isFolderContainerTarget &&
										'bg-primary/10 ring-1 ring-inset ring-primary/40',
								)}
								style={{
									paddingInlineStart: BASE_PADDING + depth * DEPTH_INDENT,
								}}
							>
								<span className="flex size-3.5 shrink-0 items-center justify-center">
									{hasChildren ? (
										<ChevronRight
											className={cn(
												'size-3.5 transition-transform duration-150',
												isExpanded && 'rotate-90',
											)}
										/>
									) : null}
								</span>
								<Folder
									className={cn(
										'ml-1.5 size-3.5 shrink-0 fill-neutral-500 stroke-neutral-500 transition-[color,fill,transform] dark:fill-foreground dark:stroke-foreground',
										isFolderContainerTarget &&
											'scale-110 fill-primary stroke-primary dark:fill-primary dark:stroke-primary',
									)}
								/>
								<span className="ml-1.5 min-w-0 flex-1 truncate text-[13px] font-medium">
									<HighlightedText text={folder.name} keyword={keyword} />
								</span>
								{isFolderContainerTarget ? (
									<span
										className={cn(
											'ml-2 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground',
											'bg-primary/15 text-primary',
										)}
									>
										이 폴더로 이동
									</span>
								) : null}
							</button>
						}
					/>
					<ContextMenuContent>
						<ContextMenuItem onClick={() => setIsCreateFolderOpen(true)}>
							폴더 생성
						</ContextMenuItem>
						<ContextMenuItem
							onClick={() => {
								setDraftName(folder.name);
								setIsRenaming(true);
							}}
						>
							이름 변경
						</ContextMenuItem>
						<ContextMenuItem
							disabled={folderDelete.isPending}
							onClick={() => folderDelete.mutate(folder.id)}
						>
							삭제
						</ContextMenuItem>
					</ContextMenuContent>
				</ContextMenu>
			)}

			{isExpanded ? (
				<fieldset className="m-0 flex min-w-0 flex-col border-0 p-0">
					{folder.children.map((child) => (
						<FolderItem
							key={child.id}
							folder={child}
							depth={depth + 1}
							keyword={keyword}
							closeParent={closeFolderAndFocus}
						/>
					))}
					{bookmarks.map((bookmark) => (
						<BookmarkItem
							key={bookmark.id}
							bookmark={bookmark}
							depth={depth + 1}
							keyword={keyword}
							closeParent={closeFolderAndFocus}
						/>
					))}
				</fieldset>
			) : null}
		</div>
	);
}

function BookmarkItem({
	bookmark,
	depth,
	keyword,
	closeParent,
}: {
	bookmark: Bookmark;
	depth: number;
	keyword: string;
	closeParent?: () => void;
}) {
	const favoriteToggle = useFavoriteToggle();
	const bookmarkDelete = useBookmarkDelete();
	const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
		id: bookmarkSortableId(bookmark.id),
		disabled: Boolean(keyword),
		data: {
			type: 'bookmark',
			itemId: bookmark.id,
			parentId: bookmark.folderId,
			label: bookmark.title,
			faviconUrl: bookmark.faviconUrl ?? undefined,
		} satisfies SortableTreeItemData,
	});
	const [showFavicon, setShowFavicon] = useState(Boolean(bookmark.faviconUrl));
	const [isUpdateBookmarkOpen, setIsUpdateBookmarkOpen] = useState(false);

	return (
		<>
			<UpdateBookmarkDialog
				bookmark={bookmark}
				open={isUpdateBookmarkOpen}
				onOpenChange={setIsUpdateBookmarkOpen}
			/>
			<ContextMenu>
				<ContextMenuTrigger
					render={
						<div className="contents">
							<Tooltip>
								<TooltipTrigger
									render={
										<button
											ref={setNodeRef}
											{...attributes}
											{...listeners}
											type="button"
											role="treeitem"
											data-tree-item
											data-search-result={keyword ? 'true' : undefined}
											aria-level={depth + 1}
											disabled={!bookmark.url}
											onKeyDown={(event) => {
												if (handleVerticalTreeNavigation(event)) return;

												if (event.key === 'ArrowLeft' && closeParent) {
													event.preventDefault();
													closeParent();
												}
											}}
											onClick={() => {
												if (bookmark.url)
													window.open(
														bookmark.url,
														'_blank',
														'noopener,noreferrer',
													);
											}}
											className={cn(
												'flex min-w-0 cursor-default touch-none items-center rounded-sm py-1 pr-2 text-left outline-none hover:bg-neutral-500/10 focus:bg-neutral-500/15 disabled:opacity-50 dark:hover:bg-white/5 dark:focus:bg-white/10',
												isDragging && 'z-20 opacity-50',
											)}
											style={{
												paddingInlineStart:
													BASE_PADDING + depth * DEPTH_INDENT + 20,
											}}
										>
											{showFavicon && bookmark.faviconUrl ? (
												<img
													src={bookmark.faviconUrl}
													alt=""
													draggable={false}
													onError={() => setShowFavicon(false)}
													className="size-3.5 shrink-0 rounded-[3px] object-contain"
												/>
											) : (
												<Globe2 className="size-3.5 shrink-0 text-muted-foreground" />
											)}
											<span className="ml-1.5 min-w-0 flex-1 truncate text-[13px]">
												<HighlightedText
													text={bookmark.title}
													keyword={keyword}
												/>
											</span>
											{bookmark.isFavorite && (
												<Star className="size-3 fill-red-500 dark:fill-red-400 stroke-none" />
											)}
										</button>
									}
								/>
								<TooltipContent
									align="center"
									side="right"
									sideOffset={16}
									className="bg-background dark:bg-sidebar text-foreground border border-border-accent p-0 overflow-hidden shadow-xl w-80"
								>
									<div className="flex flex-col">
										<BookmarkPreviewImage
											imageUrl={bookmark.imageUrl}
											className="aspect-video w-80"
										/>
										<div className="flex flex-col p-3">
											<div className="flex items-center justify-between">
												<div className="flex flex-col">
													<h2 className="text-base font-semibold">
														{bookmark.title}
													</h2>
													<span className="text-muted-foreground">
														{bookmark.url}
													</span>
												</div>
												<button
													type="button"
													aria-label={
														bookmark.isFavorite
															? '즐겨찾기에서 제거'
															: '즐겨찾기에 추가'
													}
													aria-pressed={bookmark.isFavorite}
													disabled={favoriteToggle.isPending}
													onClick={() => favoriteToggle.mutate(bookmark.id)}
													className="flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-neutral-500/10 disabled:cursor-wait disabled:opacity-60 dark:hover:bg-white/10"
												>
													<Star
														className={cn(
															'size-4.5',
															bookmark.isFavorite &&
																'fill-red-500 stroke-red-500 dark:fill-red-400 dark:stroke-red-400',
														)}
													/>
												</button>
											</div>
											<div className="flex flex-col mt-2">
												<p className="wrap-break-word">
													{bookmark.description}
												</p>
											</div>
										</div>
									</div>
								</TooltipContent>
							</Tooltip>
						</div>
					}
				/>
				<ContextMenuContent>
					<ContextMenuItem onClick={() => setIsUpdateBookmarkOpen(true)}>
						수정
					</ContextMenuItem>
					<ContextMenuItem
						disabled={bookmarkDelete.isPending}
						onClick={() => bookmarkDelete.mutate(bookmark.id)}
					>
						삭제
					</ContextMenuItem>
				</ContextMenuContent>
			</ContextMenu>
		</>
	);
}

function HighlightedText({ text, keyword }: { text: string; keyword: string }) {
	if (!keyword) return text;

	const normalizedText = text.toLocaleLowerCase();
	const parts: React.ReactNode[] = [];
	let cursor = 0;
	let matchIndex = normalizedText.indexOf(keyword, cursor);

	while (matchIndex !== -1) {
		if (matchIndex > cursor) {
			parts.push(text.slice(cursor, matchIndex));
		}

		const matchEnd = matchIndex + keyword.length;
		parts.push(
			<strong
				key={matchIndex}
				className="font-bold underline decoration-current underline-offset-2"
			>
				{text.slice(matchIndex, matchEnd)}
			</strong>,
		);
		cursor = matchEnd;
		matchIndex = normalizedText.indexOf(keyword, cursor);
	}

	if (cursor < text.length) {
		parts.push(text.slice(cursor));
	}

	return parts;
}

function FolderTreeSkeleton() {
	return (
		<div
			className="flex flex-col gap-2 px-2 py-1"
			role="status"
			aria-label="폴더 목록 로딩 중"
		>
			{[72, 58, 82, 64, 76].map((width, index) => (
				<div
					key={width}
					className="flex h-6 items-center gap-2"
					style={{ paddingInlineStart: index % 3 === 1 ? 16 : 0 }}
				>
					<Skeleton className="size-3.5 shrink-0 rounded-sm" />
					<Skeleton className="h-3" style={{ width: `${width}%` }} />
				</div>
			))}
		</div>
	);
}
