import { createContext, useContext, useEffect, useMemo, useState } from 'react';

type Theme = 'dark' | 'light' | 'system';

interface ThemeProviderProps {
	children: React.ReactNode;
	defaultTheme?: Theme;
	storageKey?: string;
}

interface ThemeContextValue {
	theme: Theme;
	setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
	children,
	defaultTheme = 'system',
	storageKey = 'shelf-theme',
}: ThemeProviderProps) {
	const [theme, setThemeState] = useState<Theme>(() => {
		return (localStorage.getItem(storageKey) as Theme | null) ?? defaultTheme;
	});

	useEffect(() => {
		const media = window.matchMedia('(prefers-color-scheme: dark)');

		const applyTheme = () => {
			const resolvedTheme =
				theme === 'system' ? (media.matches ? 'dark' : 'light') : theme;

			document.documentElement.classList.toggle(
				'dark',
				resolvedTheme === 'dark',
			);

			document.documentElement.style.colorScheme = resolvedTheme;
		};

		applyTheme();

		if (theme === 'system') {
			media.addEventListener('change', applyTheme);
			return () => media.removeEventListener('change', applyTheme);
		}
	}, [theme]);

	const value = useMemo(
		() => ({
			theme,
			setTheme(nextTheme: Theme) {
				localStorage.setItem(storageKey, nextTheme);
				setThemeState(nextTheme);
			},
		}),
		[storageKey, theme],
	);

	return (
		<ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
	);
}

export function useTheme(): ThemeContextValue {
	const context = useContext(ThemeContext);

	if (!context) {
		throw new Error('useTheme must be used within ThemeProvider');
	}

	return context;
}
