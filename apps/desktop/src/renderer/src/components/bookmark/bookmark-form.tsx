import { zodResolver } from '@hookform/resolvers/zod';
import { BookmarkPreviewImage } from '@renderer/components/bookmark/bookmark-preview-image';
import { Button } from '@renderer/components/ui/button';
import { Input } from '@renderer/components/ui/input';
import { Textarea } from '@renderer/components/ui/textarea';
import { useFolders } from '@renderer/hooks/queries/folders/use-folders';
import { extractError } from '@renderer/lib/api/error';
import { cn } from '@renderer/lib/utils';
import type { FolderTree } from '@shelf/shared';
import { type CreateBookmarkInput, createBookmarkSchema } from '@shelf/shared';
import { useState } from 'react';
import { type UseFormRegister, useForm } from 'react-hook-form';
import type { z } from 'zod';

type BookmarkFormInput = z.input<typeof createBookmarkSchema>;

type BookmarkFormProps = {
	defaultValues: CreateBookmarkInput;
	isPending: boolean;
	error?: unknown;
	submitLabel?: string;
	pendingLabel?: string;
	showMediaUrlFields?: boolean;
	showFolderField?: boolean;
	onSubmit: (input: CreateBookmarkInput) => Promise<void>;
};

export function BookmarkForm({
	defaultValues,
	isPending,
	error,
	submitLabel = '생성',
	pendingLabel = '생성 중...',
	showMediaUrlFields = false,
	showFolderField = false,
	onSubmit,
}: BookmarkFormProps) {
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<BookmarkFormInput, unknown, CreateBookmarkInput>({
		resolver: zodResolver(createBookmarkSchema),
		defaultValues,
	});

	const serverError = error ? extractError(error).message : null;
	return (
		<form onSubmit={handleSubmit(onSubmit)} className="grid gap-4" noValidate>
			<div className="grid gap-6 sm:grid-cols-2">
				<BookmarkMediaPreview
					title={defaultValues.title}
					siteName={defaultValues.siteName}
					imageUrl={defaultValues.imageUrl}
					faviconUrl={defaultValues.faviconUrl}
				/>
				<div className="grid content-start gap-4">
					{showFolderField ? <FolderField register={register} /> : null}
					<FormField
						id="bookmark-title"
						label="제목"
						error={errors.title?.message}
					>
						<Input
							{...register('title')}
							id="bookmark-title"
							autoFocus
							maxLength={200}
							disabled={isPending}
							aria-invalid={Boolean(errors.title)}
						/>
					</FormField>
					<FormField id="bookmark-url" label="URL" error={errors.url?.message}>
						<Input
							{...register('url')}
							id="bookmark-url"
							type="url"
							inputMode="url"
							disabled={isPending}
							aria-invalid={Boolean(errors.url)}
						/>
					</FormField>
					<FormField
						id="bookmark-description"
						label="설명(메모)"
						error={errors.description?.message}
					>
						<Textarea
							{...register('description')}
							id="bookmark-description"
							maxLength={2000}
							disabled={isPending}
							aria-invalid={Boolean(errors.description)}
							className="min-h-20 resize-none"
						/>
					</FormField>
					<FormField
						id="bookmark-site-name"
						label="사이트 이름"
						error={errors.siteName?.message}
					>
						<Input
							{...register('siteName')}
							id="bookmark-site-name"
							disabled={isPending}
						/>
					</FormField>
					{showMediaUrlFields ? (
						<>
							<FormField
								id="bookmark-favicon-url"
								label="Favicon URL"
								error={errors.faviconUrl?.message}
							>
								<Input
									{...register('faviconUrl')}
									id="bookmark-favicon-url"
									type="url"
									inputMode="url"
									disabled={isPending}
									placeholder="https://example.com/favicon.ico"
									aria-invalid={Boolean(errors.faviconUrl)}
								/>
							</FormField>
							<FormField
								id="bookmark-image-url"
								label="대표 이미지 URL"
								error={errors.imageUrl?.message}
							>
								<Input
									{...register('imageUrl')}
									id="bookmark-image-url"
									type="url"
									inputMode="url"
									disabled={isPending}
									placeholder="https://example.com/og-image.jpg"
									aria-invalid={Boolean(errors.imageUrl)}
								/>
							</FormField>
						</>
					) : null}
				</div>
			</div>
			{serverError ? (
				<p role="alert" className="text-sm text-destructive">
					{serverError}
				</p>
			) : null}
			<div className="flex justify-end">
				<Button type="submit" disabled={isPending}>
					{isPending ? pendingLabel : submitLabel}
				</Button>
			</div>
		</form>
	);
}

function FolderField({
	register,
}: {
	register: UseFormRegister<BookmarkFormInput>;
}) {
	const folders = useFolders();
	const options = folders.data ? flattenFolders(folders.data.payload) : [];

	return (
		<FormField id="bookmark-folder" label="저장 위치">
			<select
				{...register('folderId', {
					setValueAs: (value) => (value === '' ? null : Number(value)),
				})}
				id="bookmark-folder"
				disabled={folders.isLoading}
				className={cn(
					'h-8 w-full min-w-0 rounded-md border border-input/50 bg-neutral-150 px-2.5 py-1 text-sm outline-none transition-colors focus:border-input disabled:pointer-events-none disabled:opacity-50 dark:bg-input/10',
				)}
			>
				<option value="">최상위</option>
				{options.map(({ folder, depth }) => (
					<option key={folder.id} value={folder.id}>
						{'　'.repeat(depth)}
						{folder.name}
					</option>
				))}
			</select>
		</FormField>
	);
}

function flattenFolders(
	folders: FolderTree[],
	depth = 0,
): Array<{ folder: FolderTree; depth: number }> {
	return folders.flatMap((folder) => [
		{ folder, depth },
		...flattenFolders(folder.children, depth + 1),
	]);
}

function BookmarkMediaPreview({
	title,
	siteName,
	imageUrl,
	faviconUrl,
}: {
	title: string;
	siteName: string | null;
	imageUrl: string | null;
	faviconUrl: string | null;
}) {
	const [isFaviconVisible, setIsFaviconVisible] = useState(Boolean(faviconUrl));

	return (
		<div className="self-start overflow-hidden rounded-lg border border-border-accent bg-muted/30">
			<BookmarkPreviewImage
				imageUrl={imageUrl}
				alt={`${title} 사이트 미리보기`}
				className="aspect-4/3 w-full"
			/>
			{isFaviconVisible ? (
				<div className="flex items-center gap-2 border-t border-border-accent px-3 py-2.5">
					<img
						src={faviconUrl ?? undefined}
						alt=""
						referrerPolicy="no-referrer"
						onError={() => setIsFaviconVisible(false)}
						className="size-5 shrink-0 rounded-sm object-contain"
					/>
					<span className="truncate text-sm text-muted-foreground">
						{siteName || title}
					</span>
				</div>
			) : null}
		</div>
	);
}

function FormField({
	id,
	label,
	error,
	children,
}: {
	id: string;
	label: string;
	error?: string;
	children: React.ReactNode;
}) {
	return (
		<label htmlFor={id} className="grid gap-1.5">
			<span className="text-sm font-medium">{label}</span>
			{children}
			{error ? <span className="text-xs text-destructive">{error}</span> : null}
		</label>
	);
}
