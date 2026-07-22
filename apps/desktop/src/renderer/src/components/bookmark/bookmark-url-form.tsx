import { zodResolver } from '@hookform/resolvers/zod';
import { Input } from '@renderer/components/ui/input';
import { useBookmarkPreview } from '@renderer/hooks/mutations/use-bookmark-preview';
import { extractError } from '@renderer/lib/api/error';
import { cn } from '@renderer/lib/utils';
import { type PreviewBookmark, previewBookmarkUrlSchema } from '@shelf/shared';
import { LoaderCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import type { z } from 'zod';

type BookmarkUrlInput = z.input<typeof previewBookmarkUrlSchema>;

type BookmarkUrlFormProps = {
	onPreview: (result: { url: string; preview: PreviewBookmark }) => void;
	className?: string;
	inputClassName?: string;
	errorClassName?: string;
	loadingSpinnerClassName?: string;
	placeholder?: string;
};

export function BookmarkUrlForm({
	onPreview,
	className,
	inputClassName,
	errorClassName,
	loadingSpinnerClassName,
	placeholder = 'https://example.com',
}: BookmarkUrlFormProps) {
	const previewBookmark = useBookmarkPreview();
	const {
		register,
		handleSubmit,
		formState: { errors },
	} = useForm<BookmarkUrlInput>({
		resolver: zodResolver(previewBookmarkUrlSchema),
		defaultValues: { url: '' },
	});

	const onSubmit = handleSubmit(async ({ url }) => {
		try {
			const response = await previewBookmark.mutateAsync(url);
			onPreview({ url, preview: response.payload });
		} catch {
			// Mutation state renders the API error below the input.
		}
	});

	const serverError = previewBookmark.error
		? extractError(previewBookmark.error).message
		: null;
	const errorMessage = errors.url?.message ?? serverError;

	return (
		<form onSubmit={onSubmit} className={className} noValidate>
			<div className="relative">
				<Input
					{...register('url')}
					autoFocus
					type="url"
					inputMode="url"
					autoComplete="url"
					disabled={previewBookmark.isPending}
					placeholder={placeholder}
					aria-label="북마크 URL"
					aria-invalid={Boolean(errorMessage)}
					aria-describedby={errorMessage ? 'bookmark-url-error' : undefined}
					className={cn(
						'h-9 bg-sidebar! border-border-accent pr-9',
						inputClassName,
					)}
				/>
				{previewBookmark.isPending ? (
					<LoaderCircle
						className={cn(
							'absolute right-2.5 top-2.5 size-4 animate-spin text-muted-foreground',
							loadingSpinnerClassName,
						)}
					/>
				) : null}
				{errorMessage ? (
					<div
						className={cn(
							'absolute right-2.5 top-0 h-8 flex items-center',
							errorClassName,
						)}
					>
						<p
							id="bookmark-url-error"
							role="alert"
							className="px-1 pt-1.5 text-xs text-destructive"
						>
							{errorMessage}
						</p>
					</div>
				) : null}
			</div>
		</form>
	);
}
