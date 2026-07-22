import {
	type BookmarkPreviewResult,
	CreateBookmarkDetailsDialog,
} from '@renderer/components/dialog/create-bookmark-dialog';
import { useBookmarkPreview } from '@renderer/hooks/mutations/use-bookmark-preview';
import { usePasteBookmark } from '@renderer/hooks/use-paste-bookmark';
import { LoaderCircle } from 'lucide-react';
import { useCallback, useState } from 'react';

export function PasteBookmarkHandler() {
	const [previewResult, setPreviewResult] =
		useState<BookmarkPreviewResult | null>(null);
	const previewBookmark = useBookmarkPreview();

	const handlePasteUrl = useCallback(
		async (url: string) => {
			try {
				const response = await previewBookmark.mutateAsync(url);
				setPreviewResult({ url, preview: response.payload });
			} catch {
				// The global paste shortcut stays silent when preview parsing fails.
			}
		},
		[previewBookmark.mutateAsync],
	);

	usePasteBookmark({
		onPasteUrl: handlePasteUrl,
		disabled: previewResult !== null,
	});

	return (
		<>
			{previewBookmark.isPending ? (
				<div
					role="status"
					className="fixed top-14 left-1/2 z-60 flex -translate-x-1/2 items-center gap-2 rounded-lg border border-border-accent bg-sidebar/85 px-3 py-2 text-sm shadow-xl backdrop-blur-md"
				>
					<LoaderCircle className="size-4 animate-spin" />
					붙여넣은 URL을 불러오는 중…
				</div>
			) : null}
			<CreateBookmarkDetailsDialog
				open={previewResult !== null}
				onOpenChange={(open) => {
					if (!open) {
						setPreviewResult(null);
						previewBookmark.reset();
					}
				}}
				previewResult={previewResult}
			/>
		</>
	);
}
