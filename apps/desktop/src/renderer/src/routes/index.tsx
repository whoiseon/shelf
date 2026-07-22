import {
	closestCenter,
	DndContext,
	type DragEndEvent,
	PointerSensor,
	useSensor,
	useSensors,
} from '@dnd-kit/core';
import {
	arrayMove,
	rectSortingStrategy,
	SortableContext,
	useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { BookmarkPreviewImage } from '@renderer/components/bookmark/bookmark-preview-image';
import { BookmarkUrlForm } from '@renderer/components/bookmark/bookmark-url-form';
import {
	type BookmarkPreviewResult,
	CreateBookmarkDetailsDialog,
} from '@renderer/components/dialog/create-bookmark-dialog';
import { ThemeToggle } from '@renderer/components/system/theme-toggle';
import { Skeleton } from '@renderer/components/ui/skeleton';
import { useFavoriteToggle } from '@renderer/hooks/mutations/use-favorite-toggle';
import { useFavoritesReorder } from '@renderer/hooks/mutations/use-favorites-reorder';
import { useBookmarks } from '@renderer/hooks/queries/bookmarks/use-bookmarks';
import { cn } from '@renderer/lib/utils';
import type { Bookmark } from '@shelf/shared';
import { createFileRoute } from '@tanstack/react-router';
import { Globe2, Star } from 'lucide-react';
import { useState } from 'react';

export const Route = createFileRoute('/')({
	component: Index,
});

function Index() {
	const [previewResult, setPreviewResult] =
		useState<BookmarkPreviewResult | null>(null);
	const [urlFormKey, setUrlFormKey] = useState(0);
	const bookmarks = useBookmarks({ hasFolder: true });
	const favoriteBookmarks =
		bookmarks.data?.payload
			.filter((bookmark) => bookmark.isFavorite)
			.toSorted(
				(a, b) =>
					(a.favoritePosition ?? Number.MAX_SAFE_INTEGER) -
					(b.favoritePosition ?? Number.MAX_SAFE_INTEGER),
			) ?? [];

	const closeCreateDialog = () => {
		setPreviewResult(null);
		setUrlFormKey((current) => current + 1);
	};

	return (
		<div className="relative h-full overflow-y-auto px-8 pb-10 pt-20 lg:px-12">
			<div className="fixed top-4 right-4">
				<ThemeToggle />
			</div>
			<div className="mx-auto flex w-full max-w-3xl flex-col gap-12">
				<section className="mx-auto flex w-full max-w-3xl flex-col gap-3 text-center">
					<h1 className="text-2xl font-semibold tracking-tight">
						새 북마크 추가
					</h1>
					<p className="text-sm text-muted-foreground">
						저장할 페이지의 URL을 입력하세요.
					</p>
					<BookmarkUrlForm
						key={urlFormKey}
						onPreview={setPreviewResult}
						className="mt-3 w-full text-left"
						inputClassName="h-12 rounded-xl bg-background! px-4 pr-11 text-base shadow-sm"
						errorClassName="h-11 right-4"
						loadingSpinnerClassName="size-6 top-3 right-4"
						placeholder="https://example.com"
					/>
				</section>

				<section className="flex flex-col gap-4">
					<div className="flex items-center gap-2">
						<Star className="size-4 fill-red-500 stroke-red-500 dark:fill-red-400 dark:stroke-red-400" />
						<h2 className="text-base font-semibold">즐겨찾기</h2>
					</div>
					<FavoriteBookmarks
						bookmarks={favoriteBookmarks}
						isLoading={bookmarks.isLoading}
						isError={bookmarks.isError}
					/>
				</section>
			</div>

			<CreateBookmarkDetailsDialog
				open={Boolean(previewResult)}
				onOpenChange={(open) => {
					if (!open) closeCreateDialog();
				}}
				previewResult={previewResult}
			/>
		</div>
	);
}

function FavoriteBookmarks({
	bookmarks,
	isLoading,
	isError,
}: {
	bookmarks: Bookmark[];
	isLoading: boolean;
	isError: boolean;
}) {
	const reorderFavorites = useFavoritesReorder();
	const sensors = useSensors(
		useSensor(PointerSensor, { activationConstraint: { distance: 6 } }),
	);
	const visibleBookmarks = bookmarks.slice(0, 12);

	if (isLoading) {
		return <FavoriteBookmarksSkeleton />;
	}

	if (isError) {
		return <ListMessage>즐겨찾기를 불러오지 못했습니다.</ListMessage>;
	}

	if (bookmarks.length === 0) {
		return <ListMessage>즐겨찾기한 북마크가 없습니다.</ListMessage>;
	}

	const handleDragEnd = ({ active, over }: DragEndEvent) => {
		if (!over || active.id === over.id) return;

		const oldIndex = bookmarks.findIndex(
			(bookmark) => bookmark.id === active.id,
		);
		const newIndex = bookmarks.findIndex((bookmark) => bookmark.id === over.id);

		if (oldIndex === -1 || newIndex === -1) return;

		const bookmarkIds = arrayMove(bookmarks, oldIndex, newIndex).map(
			(bookmark) => bookmark.id,
		);
		reorderFavorites.mutate({ bookmarkIds });
	};

	return (
		<DndContext
			sensors={sensors}
			collisionDetection={closestCenter}
			onDragEnd={handleDragEnd}
		>
			<SortableContext
				items={visibleBookmarks.map((bookmark) => bookmark.id)}
				strategy={rectSortingStrategy}
			>
				<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
					{visibleBookmarks.map((bookmark) => (
						<FavoriteBookmarkCard key={bookmark.id} bookmark={bookmark} />
					))}
				</div>
			</SortableContext>
		</DndContext>
	);
}

function FavoriteBookmarksSkeleton() {
	const skeletonKeys = ['favorite-1', 'favorite-2', 'favorite-3', 'favorite-4'];

	return (
		<div
			className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
			role="status"
			aria-label="즐겨찾기 로딩 중"
		>
			{skeletonKeys.map((key) => (
				<div
					key={key}
					className="overflow-hidden rounded-xl border border-border"
				>
					<Skeleton className="aspect-video w-full rounded-none" />
					<div className="flex items-center gap-2.5 p-3">
						<Skeleton className="size-5 shrink-0" />
						<div className="flex flex-1 flex-col gap-1.5">
							<Skeleton className="h-3.5 w-4/5" />
							<Skeleton className="h-3 w-3/5" />
						</div>
					</div>
				</div>
			))}
		</div>
	);
}

function FavoriteBookmarkCard({ bookmark }: { bookmark: Bookmark }) {
	const [showFavicon, setShowFavicon] = useState(Boolean(bookmark.faviconUrl));
	const favoriteToggle = useFavoriteToggle();
	const {
		attributes,
		listeners,
		setNodeRef,
		transform,
		transition,
		isDragging,
	} = useSortable({ id: bookmark.id });

	return (
		<div
			ref={setNodeRef}
			{...attributes}
			{...listeners}
			style={{
				transform: CSS.Transform.toString(transform),
				transition,
			}}
			className={cn(
				'group relative overflow-hidden rounded-xl border border-border bg-sidebar text-left shadow-sm transition-[border-color,box-shadow] hover:border-border-accent hover:shadow-md',
				isDragging && 'z-10 opacity-60 shadow-xl',
			)}
		>
			<button
				type="button"
				disabled={!bookmark.url}
				onClick={() => {
					if (bookmark.url) {
						window.open(bookmark.url, '_blank', 'noopener,noreferrer');
					}
				}}
				className="block w-full text-left outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60"
			>
				<BookmarkPreviewImage
					imageUrl={bookmark.imageUrl}
					className="aspect-video"
					imageClassName="transition-transform duration-200 group-hover:scale-[1.02]"
				/>
			</button>
			<div className="flex min-w-0 items-center gap-2.5 border-t border-border p-3">
				{showFavicon && bookmark.faviconUrl ? (
					<img
						src={bookmark.faviconUrl}
						alt=""
						onError={() => setShowFavicon(false)}
						className="size-5 shrink-0 rounded-sm object-contain"
					/>
				) : (
					<Globe2 className="size-5 shrink-0 text-muted-foreground" />
				)}
				<div className="min-w-0 flex-1">
					<h3 className="truncate text-sm font-medium">{bookmark.title}</h3>
					<p className="truncate text-xs text-muted-foreground">
						{bookmark.siteName || getHostname(bookmark.url)}
					</p>
				</div>
				<button
					type="button"
					aria-label="즐겨찾기에서 제거"
					disabled={favoriteToggle.isPending}
					onPointerDown={(event) => event.stopPropagation()}
					onClick={() => favoriteToggle.mutate(bookmark.id)}
					className="flex size-7 shrink-0 items-center justify-center rounded-md text-red-500 outline-none hover:bg-red-500/10 focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 dark:text-red-400"
				>
					<Star className="size-4 fill-current" />
				</button>
			</div>
		</div>
	);
}

function ListMessage({ children }: { children: React.ReactNode }) {
	return (
		<div className="flex min-h-40 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
			{children}
		</div>
	);
}

function getHostname(url: string | null) {
	if (!url) return '';

	try {
		return new URL(url).hostname;
	} catch {
		return url;
	}
}
