import {
	Dialog,
	DialogContent,
	DialogTitle,
} from '@renderer/components/ui/dialog';
import { Input } from '@renderer/components/ui/input';
import { useFolderCreate } from '@renderer/hooks/mutations/use-folder-create';
import { type FormEvent, useState } from 'react';

type CreateFolderDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	parentFolderId?: number;
};

export function CreateFolderDialog({
	open,
	onOpenChange,
	parentFolderId,
}: CreateFolderDialogProps) {
	const [name, setName] = useState('');
	const folderCreate = useFolderCreate();

	const handleOpenChange = (nextOpen: boolean) => {
		if (!nextOpen) setName('');
		onOpenChange(nextOpen);
	};

	const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		const trimmedName = name.trim();
		if (!trimmedName || folderCreate.isPending) return;

		await folderCreate.mutateAsync({
			name: trimmedName,
			...(parentFolderId === undefined ? {} : { parentFolderId }),
		});
		handleOpenChange(false);
	};

	return (
		<Dialog open={open} onOpenChange={handleOpenChange}>
			<DialogContent
				showCloseButton={false}
				showOverlay={false}
				className="max-w-72 p-0 ring-0 bg-sidebar"
			>
				<DialogTitle className="sr-only">새 폴더</DialogTitle>
				<form onSubmit={handleSubmit}>
					<Input
						autoFocus
						value={name}
						maxLength={20}
						disabled={folderCreate.isPending}
						onChange={(event) => setName(event.target.value)}
						placeholder="폴더 이름"
						aria-label="폴더 이름"
						className="h-9 bg-sidebar! border-border-accent"
					/>
				</form>
			</DialogContent>
		</Dialog>
	);
}
