export const prerender = true;
// https://llmstxt.org — a plain-text map of the site for AI agents.
import { get, list } from '$lib/server/content';
import { SITE } from '$lib/site';

export const GET = () => {
	const section = (title: string, items: ReturnType<typeof list>) =>
		items.length
			? [`## ${title}`, '', ...items.map((e) => `- [${e.title}](${e.url}.md): ${e.summary}`), '']
			: [];
	const about = get('page', 'about');
	const body = [
		`# ${SITE.name}`,
		'',
		`> ${SITE.description}`,
		'',
		'Every page is also available as plain markdown: append `.md` to its URL.',
		`The full text of everything is at ${SITE.url}/llms-full.txt.`,
		'',
		...section('Writing', list('article')),
		...section('Projects', list('project')),
		'## About',
		'',
		`- [About ${SITE.author}](${SITE.url}/about.md): ${about?.summary ?? ''}`,
		`- [RSS feed](${SITE.url}/rss.xml)`,
		''
	].join('\n');
	return new Response(body, { headers: { 'content-type': 'text/plain; charset=utf-8' } });
};
