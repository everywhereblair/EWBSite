export const prerender = true;
import { listings } from '$lib/server/content';
import { SITE } from '$lib/site';

const esc = (s: string) =>
	s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

export const GET = () => {
	const items = listings()
		.slice(0, 50)
		.map(
			(e) => `
    <item>
      <title>${esc(e.title)}</title>
      <link>${e.url}</link>
      <guid isPermaLink="true">${e.url}</guid>
      ${e.published ? `<pubDate>${new Date(e.published + 'T12:00:00Z').toUTCString()}</pubDate>` : ''}
      <description>${esc(e.summary)}</description>
      ${e.tags.map((t) => `<category>${esc(t)}</category>`).join('')}
    </item>`
		)
		.join('');
	const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(SITE.name)}</title>
    <link>${SITE.url}</link>
    <description>${esc(SITE.description)}</description>
    <language>en-us</language>
    <atom:link href="${SITE.url}/rss.xml" rel="self" type="application/rss+xml"/>${items}
  </channel>
</rss>
`;
	return new Response(xml, { headers: { 'content-type': 'application/rss+xml; charset=utf-8' } });
};
