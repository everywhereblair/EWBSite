// Loads every markdown file under src/content at build time.
// Folder decides the type: writing/ -> article, projects/ -> project, pages/ -> page.
// Files are written here by scripts/publish.mjs (already sanitized); don't hand-edit
// unless you also update the vault copy.
import matter from 'gray-matter';
import { Marked, type Tokens } from 'marked';
import { SECTION, SITE, type ContentType } from '$lib/site';

export interface TocEntry {
	id: string;
	text: string;
	depth: number;
}

export interface Entry {
	type: ContentType;
	slug: string;
	title: string;
	summary: string;
	tags: string[];
	published: string; // YYYY-MM-DD
	updated: string; // YYYY-MM-DD
	path: string; // site path, e.g. /writing/foo
	url: string; // absolute URL
	markdown: string; // body only, no frontmatter
	readingMinutes: number;
}

const FOLDER_TYPE: Record<string, ContentType> = {
	writing: 'article',
	projects: 'project',
	pages: 'page'
};

const files = import.meta.glob('/src/content/**/*.md', {
	query: '?raw',
	import: 'default',
	eager: true
}) as Record<string, string>;

function isoDate(v: unknown): string {
	if (v instanceof Date) return v.toISOString().slice(0, 10);
	if (typeof v === 'string' && v) return v.slice(0, 10);
	return '';
}

function parse(file: string, raw: string): Entry {
	const [, , folder, name] = file.split('/').slice(1); // ['src','content',folder,name]
	const type = FOLDER_TYPE[folder];
	if (!type) throw new Error(`Unknown content folder in ${file}`);
	const { data, content } = matter(raw);
	const slug = String(data.slug || name.replace(/\.md$/, ''));
	const published = isoDate(data.published);
	const path = `${SECTION[type]}/${slug}`;
	const words = content.split(/\s+/).filter(Boolean).length;
	return {
		type,
		slug,
		title: String(data.title || slug),
		summary: String(data.summary || ''),
		tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
		published,
		updated: isoDate(data.updated) || published,
		path,
		url: SITE.url + path,
		markdown: content.trim(),
		readingMinutes: Math.max(1, Math.round(words / 230))
	};
}

const all: Entry[] = Object.entries(files)
	.map(([file, raw]) => parse(file, raw))
	.sort((a, b) => b.published.localeCompare(a.published) || a.title.localeCompare(b.title));

/** Newest first. */
export function list(type: ContentType): Entry[] {
	return all.filter((e) => e.type === type);
}

export function get(type: ContentType, slug: string): Entry | undefined {
	return all.find((e) => e.type === type && e.slug === slug);
}

/** Articles and projects, newest first (for RSS, sitemap, llms.txt). */
export function listings(): Entry[] {
	return all.filter((e) => e.type !== 'page');
}

/** List item without the body, so index pages don't ship every article. */
export type Card = Omit<Entry, 'markdown'>;
export function card({ markdown: _m, ...rest }: Entry): Card {
	return rest;
}

/** Everything an article/project/page view needs: rendered body, TOC, prev/next. */
export function view(type: ContentType, slug: string) {
	const entries = list(type);
	const i = entries.findIndex((e) => e.slug === slug);
	if (i === -1) return undefined;
	const entry = entries[i];
	const { html, toc } = render(entry.markdown);
	return {
		entry: card(entry),
		html,
		toc: toc.filter((t) => t.depth === 2).length >= 4 ? toc : [],
		newer: i > 0 ? card(entries[i - 1]) : null,
		older: i < entries.length - 1 ? card(entries[i + 1]) : null
	};
}

/** The raw, sanitized markdown served at /<section>/<slug>.md for agents. */
export function asMarkdown(e: Entry): string {
	const meta = [
		`# ${e.title}`,
		'',
		e.summary ? `> ${e.summary}` : '',
		'',
		`Author: ${SITE.author}  `,
		e.published ? `Published: ${e.published}  ` : '',
		e.updated && e.updated !== e.published ? `Updated: ${e.updated}  ` : '',
		`Canonical: ${e.url}`,
		''
	].filter((l, i, a) => l !== '' || a[i - 1] !== '');
	return meta.join('\n') + '\n' + e.markdown + '\n';
}

export function slugify(text: string): string {
	return text
		.toLowerCase()
		.replace(/<[^>]+>/g, '')
		.replace(/&[a-z]+;/g, '')
		.replace(/[^\w\s-]/g, '')
		.trim()
		.replace(/\s+/g, '-');
}

/** Markdown -> HTML, plus a table of contents built from H2/H3 headings. */
export function render(markdown: string): { html: string; toc: TocEntry[] } {
	const toc: TocEntry[] = [];
	const seen = new Map<string, number>();
	const md = new Marked({ gfm: true });
	md.use({
		renderer: {
			heading(this: { parser: { parseInline(t: Tokens.Generic[]): string } }, { tokens, depth }: Tokens.Heading) {
				const text = this.parser.parseInline(tokens);
				let id = slugify(text) || 'section';
				const n = seen.get(id) ?? 0;
				seen.set(id, n + 1);
				if (n) id = `${id}-${n}`;
				if (depth === 2 || depth === 3) toc.push({ id, text: text.replace(/<[^>]+>/g, ''), depth });
				return `<h${depth} id="${id}">${text}</h${depth}>\n`;
			},
			link({ href, title, tokens }: Tokens.Link) {
				const text = this.parser.parseInline(tokens);
				const external = /^https?:\/\//.test(href) && !href.startsWith(SITE.url);
				const t = title ? ` title="${title}"` : '';
				return external
					? `<a href="${href}"${t} class="external" rel="noopener">${text}</a>`
					: `<a href="${href}"${t}>${text}</a>`;
			}
		}
	});
	const html = md.parse(markdown, { async: false }) as string;
	return { html, toc };
}
