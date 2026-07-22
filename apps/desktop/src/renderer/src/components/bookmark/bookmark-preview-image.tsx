import { cn } from '@renderer/lib/utils';
import { ImageOff } from 'lucide-react';
import { useState } from 'react';

type BookmarkPreviewImageProps = {
	imageUrl: string | null;
	alt?: string;
	className?: string;
	imageClassName?: string;
};

export function BookmarkPreviewImage({
	imageUrl,
	alt = '',
	className,
	imageClassName,
}: BookmarkPreviewImageProps) {
	const [failedUrl, setFailedUrl] = useState<string | null>(null);
	const showImage = Boolean(imageUrl && failedUrl !== imageUrl);

	return (
		<div
			className={cn(
				'overflow-hidden bg-neutral-200 dark:bg-neutral-800',
				className,
			)}
		>
			{showImage && imageUrl ? (
				<img
					src={imageUrl}
					alt={alt}
					draggable={false}
					referrerPolicy="no-referrer"
					onError={() => setFailedUrl(imageUrl)}
					className={cn('size-full object-cover object-center', imageClassName)}
				/>
			) : (
				<div className="flex size-full flex-col items-center justify-center gap-1.5 text-muted-foreground">
					<ImageOff className="size-5" />
					<span className="text-[11px] font-medium">이미지 없음</span>
				</div>
			)}
		</div>
	);
}
