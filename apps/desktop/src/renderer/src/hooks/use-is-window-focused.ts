import { useEffect, useState } from 'react';

export function useIsWindowFocused() {
	const [isWindowFocused, setIsWindowFocused] = useState(() =>
		document.hasFocus(),
	);

	useEffect(() => {
		const handleFocus = () => setIsWindowFocused(true);
		const handleBlur = () => setIsWindowFocused(false);

		window.addEventListener('focus', handleFocus);
		window.addEventListener('blur', handleBlur);

		return () => {
			window.removeEventListener('focus', handleFocus);
			window.removeEventListener('blur', handleBlur);
		};
	}, []);

	return [isWindowFocused, setIsWindowFocused] as const;
}
