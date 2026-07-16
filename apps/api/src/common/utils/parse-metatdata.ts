import * as cheerio from 'cheerio';

export async function parseMetadata(url: string) {
	const response = await fetch(url, {
		headers: {
			'User-Agent': 'ShelfParser/1.0',
			Accept: 'text/html',
		},
		signal: AbortSignal.timeout(5_000),
	});

	if (!response.ok) {
		return {
			payload: null,
			message: `페이지 요청 실패: ${response.status}`,
		};
	}

	const html = await response.text();
	const $ = cheerio.load(html);

	const title =
		$('meta[property="og:title"]').attr('content') ??
		$('title').first().text().trim() ??
		'';

	const description =
		$('meta[property="og:description"]').attr('content') ??
		$('meta[name="description"]').attr('content') ??
		'null';

	const siteName = $('meta[property="og:site_name"]').attr('content') ?? '';

	const imageUrl =
		$('meta[property="og:image"]').attr('content') ??
		$('meta[name="twitter:image"]').attr('content') ??
		'';

	const faviconUrl =
		$('link[rel="icon"]').attr('href') ??
		$('link[rel="shortcut icon"]').attr('href') ??
		'';

	return {
		payload: {
			title,
			description,
			siteName,
			imageUrl: resolveUrl(imageUrl, url),
			faviconUrl: resolveUrl(faviconUrl, url),
		},
	};
}

function resolveUrl(value: string | null, pageUrl: string) {
	if (!value) return '';

	try {
		return new URL(value, pageUrl).href;
	} catch {
		return '';
	}
}
