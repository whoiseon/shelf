import {
	AlertDialog,
	AlertDialogAction,
	AlertDialogCancel,
	AlertDialogContent,
	AlertDialogDescription,
	AlertDialogFooter,
	AlertDialogHeader,
	AlertDialogTitle,
} from '@renderer/components/ui/alert-dialog';

type DestructiveConfirmDialogProps = {
	open: boolean;
	onOpenChange: (open: boolean) => void;
	title: string;
	description: string;
	actionLabel: string;
	isPending?: boolean;
	onConfirm: () => void;
};

export function DestructiveConfirmDialog({
	open,
	onOpenChange,
	title,
	description,
	actionLabel,
	isPending = false,
	onConfirm,
}: DestructiveConfirmDialogProps) {
	return (
		<AlertDialog open={open} onOpenChange={onOpenChange}>
			<AlertDialogContent className="border-border-accent bg-sidebar/80 shadow-xl backdrop-blur-md">
				<AlertDialogHeader>
					<AlertDialogTitle>{title}</AlertDialogTitle>
					<AlertDialogDescription>{description}</AlertDialogDescription>
				</AlertDialogHeader>
				<AlertDialogFooter className="bg-muted/30">
					<AlertDialogCancel disabled={isPending}>취소</AlertDialogCancel>
					<AlertDialogAction
						variant="destructive"
						disabled={isPending}
						onClick={onConfirm}
					>
						{isPending ? '처리 중...' : actionLabel}
					</AlertDialogAction>
				</AlertDialogFooter>
			</AlertDialogContent>
		</AlertDialog>
	);
}
