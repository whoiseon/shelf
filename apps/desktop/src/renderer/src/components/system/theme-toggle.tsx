'use client';

import { useTheme } from '@renderer/components/providers/theme-provider';
import { Button } from '@renderer/components/ui/button';
import { MoonIcon, SunIcon } from 'lucide-react';

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const onToggle = () => {
		if (theme === 'light') {
			setTheme('dark');
		} else {
			setTheme('light');
		}
	};

	return (
		<Button
			type="button"
			onClick={onToggle}
			variant="ghost"
			size="icon-sm"
			className="text-muted-foreground app-no-drag-region"
		>
			{theme === 'dark' ? (
				<SunIcon className="size-4" />
			) : (
				<MoonIcon className="size-4" />
			)}
		</Button>
	);
}
