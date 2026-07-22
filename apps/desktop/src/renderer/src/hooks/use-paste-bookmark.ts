import { previewBookmarkUrlSchema } from '@shelf/shared';
import { useEffect, useRef } from 'react';

type UsePasteBookmarkOptions = {
	onPasteUrl: (url: string) => Promise<void> | void;
	disabled?: boolean;
};

export function usePasteBookmark({
	onPasteUrl,
	disabled = false,
}: UsePasteBookmarkOptions) {
	const isProcessingRef = useRef(false);

	useEffect(() => {
		const handlePaste = async (event: ClipboardEvent) => {
			if (
				disabled ||
				isProcessingRef.current ||
				isEditableElement(event.target)
			) {
				return;
			}

			const result = previewBookmarkUrlSchema.safeParse({
				url: event.clipboardData?.getData('text/plain').trim() ?? '',
			});

			if (!result.success) return;

			event.preventDefault();
			isProcessingRef.current = true;

			try {
				await onPasteUrl(result.data.url);
			} finally {
				isProcessingRef.current = false;
			}
		};

		window.addEventListener('paste', handlePaste);
		return () => window.removeEventListener('paste', handlePaste);
	}, [disabled, onPasteUrl]);
}

function isEditableElement(target: EventTarget | null) {
	return (
		target instanceof HTMLInputElement ||
		target instanceof HTMLTextAreaElement ||
		(target instanceof HTMLElement && target.isContentEditable)
	);
}
