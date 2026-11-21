export const prerender = true;
import { asMarkdown, get, listings } from '$lib/server/content';
import { SITE } from '$lib/site';

export const GET = () => {
	const about = get('page', 'about');
	const docs = [...(about ? [about] : []), ...listings()].map(asMarkdown);
	const body = [`# ${SITE.name}: full text`, '', `> ${SITE.description}`, '', ...docs].join('\n---\n\n');
	return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
