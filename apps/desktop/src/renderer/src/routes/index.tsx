import { BookmarkPreviewImage } from '@renderer/components/bookmark/bookmark-preview-image';
import { BookmarkUrlForm } from '@renderer/components/bookmark/bookmark-url-form';
import {
	type BookmarkPreviewResult,
	CreateBookmarkDetailsDialog,
} from '@renderer/components/dialog/create-bookmark-dialog';
import { ThemeToggle } from '@renderer/components/system/theme-toggle';
import { useBookmarks } from '@renderer/hooks/queries/bookmarks/use-bookmarks';
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
		bookmarks.data?.payload.filter((bookmark) => bookmark.isFavorite) ?? [];

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
	if (isLoading) {
		return <ListMessage>즐겨찾기를 불러오는 중…</ListMessage>;
	}

	if (isError) {
		return <ListMessage>즐겨찾기를 불러오지 못했습니다.</ListMessage>;
	}

	if (bookmarks.length === 0) {
		return <ListMessage>즐겨찾기한 북마크가 없습니다.</ListMessage>;
	}

	return (
		<div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
			{bookmarks.map((bookmark) => (
				<FavoriteBookmarkCard key={bookmark.id} bookmark={bookmark} />
			))}
		</div>
	);
}

function FavoriteBookmarkCard({ bookmark }: { bookmark: Bookmark }) {
	const [showFavicon, setShowFavicon] = useState(Boolean(bookmark.faviconUrl));

	return (
		<button
			type="button"
			disabled={!bookmark.url}
			onClick={() => {
				if (bookmark.url) {
					window.open(bookmark.url, '_blank', 'noopener,noreferrer');
				}
			}}
			className="group overflow-hidden rounded-xl border border-border bg-sidebar text-left shadow-sm transition-[border-color,box-shadow,transform] hover:-translate-y-0.5 hover:border-border-accent hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-60"
		>
			<BookmarkPreviewImage
				imageUrl={bookmark.imageUrl}
				className="aspect-video"
				imageClassName="transition-transform duration-200 group-hover:scale-[1.02]"
			/>
			<div className="flex min-w-0 items-center gap-2.5 p-3 border-t border-border">
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
			</div>
		</button>
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
