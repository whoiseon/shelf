import { BookmarkForm } from '@renderer/components/bookmark/bookmark-form';
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from '@renderer/components/ui/dialog';
import { useBookmarkUpdate } from '@renderer/hooks/mutations/use-bookmark-update';
import type {
	Bookmark,
	CreateBookmarkInput,
	UpdateBookmarkInput,
} from '@shelf/shared';

type UpdateBookmarkDialogProps = {
	bookmark: Bookmark;
	open: boolean;
	onOpenChange: (open: boolean) => void;
};

export function UpdateBookmarkDialog({
	bookmark,
	open,
	onOpenChange,
}: UpdateBookmarkDialogProps) {
	const bookmarkUpdate = useBookmarkUpdate();

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) bookmarkUpdate.reset();
		onOpenChange(nextOpen);
	};

	const handleUpdate = async (input: CreateBookmarkInput) => {
		const { folderId: _folderId, ...values } = input;
		const updateInput = {
			...values,
			faviconUrl: values.faviconUrl?.trim() || null,
			imageUrl: values.imageUrl?.trim() || null,
		} satisfies UpdateBookmarkInput;

		try {
			await bookmarkUpdate.mutateAsync({
				bookmarkId: bookmark.id,
				input: updateInput,
			});
			handleOpenChange(false);
		} catch {
			// BookmarkForm renders the mutation error without closing the dialog.
		}
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent className="max-h-[calc(100vh-2rem)] max-w-2xl! overflow-y-auto border-border-accent bg-sidebar/60 shadow-xl backdrop-blur-md">
				<DialogHeader>
					<DialogTitle>북마크 수정</DialogTitle>
					<DialogDescription>
						북마크 정보를 확인하고 필요한 내용을 수정하세요.
					</DialogDescription>
				</DialogHeader>
				<BookmarkForm
					defaultValues={toBookmarkFormValues(bookmark)}
					isPending={bookmarkUpdate.isPending}
					error={bookmarkUpdate.error}
					submitLabel="저장"
					pendingLabel="저장 중..."
					showMediaUrlFields
					onSubmit={handleUpdate}
				/>
			</DialogContent>
		</Dialog>
	);
}

function toBookmarkFormValues(bookmark: Bookmark): CreateBookmarkInput {
	return {
		title: bookmark.title,
		url: bookmark.url ?? '',
		description: bookmark.description ?? '',
		siteName: bookmark.siteName ?? '',
		faviconUrl: bookmark.faviconUrl,
		imageUrl: bookmark.imageUrl,
		isFavorite: bookmark.isFavorite,
		folderId: bookmark.folderId,
	};
}
