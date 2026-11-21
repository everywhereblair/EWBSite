export const prerender = true;
import { asMarkdown, get } from '$lib/server/content';

export const GET = () => {
	const e = get('page', 'about');
	return new Response(e ? asMarkdown(e) : '', {
		headers: { 'content-type': 'text/markdown; charset=utf-8' }
	});
};
