export const prerender = true;
import { error } from '@sveltejs/kit';
import { asMarkdown, get, list } from '$lib/server/content';
import type { EntryGenerator, RequestHandler } from './$types';

export const entries: EntryGenerator = () => list('article').map((e) => ({ slug: e.slug }));

export const GET: RequestHandler = ({ params }) => {
	const e = get('article', params.slug);
	if (!e) error(404, 'Not found');
	return new Response(asMarkdown(e), {
		headers: { 'content-type': 'text/markdown; charset=utf-8' }
	});
};
