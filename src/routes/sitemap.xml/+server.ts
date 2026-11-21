export const prerender = true;
import { listings } from '$lib/server/content';
import { SITE } from '$lib/site';

export const GET = () => {
	const urls = [
		{ loc: SITE.url, lastmod: '' },
		{ loc: `${SITE.url}/writing`, lastmod: '' },
		{ loc: `${SITE.url}/projects`, lastmod: '' },
		{ loc: `${SITE.url}/about`, lastmod: '' },
		...listings().map((e) => ({ loc: e.url, lastmod: e.updated }))
	];
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc>${u.lastmod ? `<lastmod>${u.lastmod}</lastmod>` : ''}</url>`).join('\n')}
</urlset>
`;
	return new Response(xml, { headers: { 'content-type': 'application/xml; charset=utf-8' } });
};
