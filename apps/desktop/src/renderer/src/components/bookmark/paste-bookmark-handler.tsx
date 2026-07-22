import {
	type BookmarkPreviewResult,
	CreateBookmarkDetailsDialog,
} from '@renderer/components/dialog/create-bookmark-dialog';
import { useBookmarkPreview } from '@renderer/hooks/mutations/use-bookmark-preview';
import { usePasteBookmark } from '@renderer/hooks/use-paste-bookmark';
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
	);
}
