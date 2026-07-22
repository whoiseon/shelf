import { BookmarkForm } from '@renderer/components/bookmark/bookmark-form';
import { BookmarkUrlForm } from '@renderer/components/bookmark/bookmark-url-form';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@renderer/components/ui/dialog';
import { useBookmarkCreate } from '@renderer/hooks/mutations/use-bookmark-create';
import type { CreateBookmarkInput, PreviewBookmark } from '@shelf/shared';
import { useState } from 'react';

type CreateBookmarkDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	folderId?: number | null;
};

export type BookmarkPreviewResult = {
	url: string;
	preview: PreviewBookmark;
};

export function CreateBookmarkDialog({
	open,
	onOpenChange,
	folderId = null,
}: CreateBookmarkDialogProps) {
	const [previewResult, setPreviewResult] =
		useState<BookmarkPreviewResult | null>(null);

	const resetAndClose = () => {
		setPreviewResult(null);
		onOpenChange(false);
	};

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) resetAndClose();
	};

	return (
		<>
			<Dialog open={open && !previewResult} onOpenChange={handleOpenChange}>
				<DialogContent
					showCloseButton={false}
					showOverlay={false}
					className="max-w-96 p-0 ring-0 bg-sidebar"
				>
					<DialogTitle className="sr-only">새 북마크 URL</DialogTitle>
					<BookmarkUrlForm onPreview={setPreviewResult} />
				</DialogContent>
			</Dialog>

			<CreateBookmarkDetailsDialog
				open={open && Boolean(previewResult)}
				onOpenChange={(nextOpen) => {
					if (!nextOpen) resetAndClose();
				}}
				previewResult={previewResult}
				folderId={folderId}
			/>
		</>
	);
}

type CreateBookmarkDetailsDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	previewResult: BookmarkPreviewResult | null;
	folderId?: number | null;
};

export function CreateBookmarkDetailsDialog({
	open,
	onOpenChange,
	previewResult,
	folderId = null,
}: CreateBookmarkDetailsDialogProps) {
	const bookmarkCreate = useBookmarkCreate();

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) bookmarkCreate.reset();
		onOpenChange(nextOpen);
	};

	const handleCreate = async (input: CreateBookmarkInput) => {
		try {
			await bookmarkCreate.mutateAsync(input);
			handleOpenChange(false);
		} catch {
			// BookmarkForm renders the mutation error without closing the dialog.
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-h-[calc(100vh-2rem)] max-w-2xl! overflow-y-auto border-border-accent bg-sidebar/60 shadow-xl backdrop-blur-md">
				<DialogHeader>
					<DialogTitle>새 북마크</DialogTitle>
					<DialogDescription>
						가져온 정보를 확인하고 필요한 내용을 수정하세요.
					</DialogDescription>
				</DialogHeader>
				{previewResult ? (
					<BookmarkForm
						defaultValues={toBookmarkInput(previewResult, folderId)}
						isPending={bookmarkCreate.isPending}
						error={bookmarkCreate.error}
						showFolderField
						onSubmit={handleCreate}
					/>
				) : null}
			</DialogContent>
		</Dialog>
	);
}

function toBookmarkInput(
	{ url, preview }: BookmarkPreviewResult,
	folderId: number | null,
): CreateBookmarkInput {
	return {
		title: preview.title ?? new URL(url).hostname,
		url,
		description: preview.description ?? '',
		siteName: preview.siteName ?? '',
		faviconUrl: preview.faviconUrl,
		imageUrl: preview.imageUrl,
		isFavorite: false,
		folderId,
	};
}
