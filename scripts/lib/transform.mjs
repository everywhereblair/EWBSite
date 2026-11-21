// Pure functions that turn an Obsidian note into a sanitized site file.
// No filesystem, no git: everything here is unit-tested in scripts/transform.test.mjs.
import matter from 'gray-matter';

export const TYPE_DIR = { article: 'writing', project: 'projects', page: 'pages' };
export const SECTION = { article: '/writing', project: '/projects', page: '' };
export const ALLOWED_PAGES = ['about'];
/** Only these frontmatter fields ever reach the public repo. */
export const PUBLIC_FIELDS = ['title', 'slug', 'type', 'summary', 'tags', 'published', 'updated'];
const IMAGE_EXT = /\.(png|jpe?g|gif|webp|svg|avif)$/i;

export function isoDate(v) {
	if (v instanceof Date) return v.toISOString().slice(0, 10);
	if (typeof v === 'string' && v.trim()) return v.trim().slice(0, 10);
	return '';
}

export function today() {
	const d = new Date();
	return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Parse the guard file: one term per line, '#' comments and blank lines ignored. */
export function parseGuard(text) {
	return (text || '')
		.split('\n')
		.map((l) => l.replace(/#.*/, '').trim())
		.filter(Boolean);
}

/** Return [{term, line}] for every guard term found (case-insensitive). */
export function guardHits(text, terms) {
	const lines = text.split('\n');
	const hits = [];
	for (const term of terms) {
		const t = term.toLowerCase();
		const i = lines.findIndex((l) => l.toLowerCase().includes(t));
		if (i !== -1) hits.push({ term, line: lines[i].trim() });
	}
	return hits;
}

/**
 * Validate frontmatter. Returns a list of human-readable problems (empty = OK).
 * `others` is [{slug, file}] for every other note in Website/, for uniqueness.
 */
export function validate(data, { others = [], file = '' } = {}) {
	const problems = [];
	const status = String(data.status || '');
	if (!['ready', 'published'].includes(status))
		problems.push(`status is "${status || '(empty)'}". Set it to "ready" to publish.`);
	if (!data.title) problems.push('title is missing.');
	if (!data.slug) problems.push('slug is missing.');
	else if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(String(data.slug)))
		problems.push(`slug "${data.slug}" must be lowercase-kebab-case (a-z, 0-9, hyphens).`);
	if (!TYPE_DIR[data.type]) problems.push(`type "${data.type}" must be article, project, or page.`);
	if (data.type === 'page' && !ALLOWED_PAGES.includes(data.slug))
		problems.push(`only these pages are supported: ${ALLOWED_PAGES.join(', ')}.`);
	if (data.type !== 'page' && !String(data.summary || '').trim())
		problems.push('summary is empty. It is the TL;DR at the top and in every listing.');
	const tags = Array.isArray(data.tags) ? data.tags.map((t) => String(t).toLowerCase()) : [];
	if (tags.includes('private')) problems.push('note is tagged "private".');
	const dupe = others.find((o) => o.slug === data.slug && o.file !== file);
	if (dupe) problems.push(`slug "${data.slug}" is also used by ${dupe.file}.`);
	// Slug lock: once published, the URL must not change.
	if (data.url) {
		const lockedSlug = String(data.url).split('/').pop();
		if (lockedSlug && lockedSlug !== data.slug)
			problems.push(
				`slug changed from "${lockedSlug}" to "${data.slug}" after publishing, which would break shared links. Change it back, or clear "url" if you really mean it.`
			);
	}
	return problems;
}

/**
 * Transform an Obsidian markdown body into plain site markdown.
 * `resolve(name)` returns a site path for a published note title/filename, or null.
 * Returns { body, images: [filename], warnings: [string] }.
 */
export function transformBody(body, { slug, resolve = () => null }) {
	const warnings = [];
	const images = [];
	const imgPath = (name) => {
		const file = name.split('/').pop();
		images.push(file);
		return `/img/${slug}/${encodeURI(file)}`;
	};

	let out = body;

	// 1. Obsidian comments %% ... %% (inline or multi-line) never leave the vault.
	out = out.replace(/%%[\s\S]*?%%/g, '');

	// 2. Embeds: ![[image.png|alt or width]] -> image; ![[Note]] -> dropped with warning.
	out = out.replace(/!\[\[([^\]|#]+)(?:#[^\]|]*)?(?:\|([^\]]*))?\]\]/g, (_m, target, alias) => {
		target = target.trim();
		if (IMAGE_EXT.test(target)) {
			const alt = alias && !/^\d+(x\d+)?$/.test(alias.trim()) ? alias.trim() : '';
			return `![${alt}](${imgPath(target)})`;
		}
		warnings.push(`Removed embedded note "![[${target}]]" (embeds can't be published).`);
		return '';
	});

	// 3. Standard markdown images with local paths -> /img/<slug>/file.
	out = out.replace(/!\[([^\]]*)\]\(([^)\s]+)(\s+"[^"]*")?\)/g, (m, alt, src, title = '') => {
		if (/^(https?:|\/)/.test(src)) return m;
		return `![${alt}](${imgPath(decodeURI(src))}${title})`;
	});

	// 4. Wikilinks [[Target#heading|alias]] -> site link if published, else plain text.
	out = out.replace(/\[\[([^\]|#]+)(#[^\]|]*)?(?:\|([^\]]*))?\]\]/g, (_m, target, _h, alias) => {
		target = target.trim();
		const text = (alias || target).trim();
		const href = resolve(target);
		if (href) return `[${text}](${href})`;
		warnings.push(`Link to "${target}" became plain text (not a published Website note).`);
		return text;
	});

	// 5. Callouts: "> [!note] Title" -> "> **Title**" (or the callout type).
	out = out.replace(/^(>\s*)\[!(\w+)\][+-]?[ \t]*(.*)$/gm, (_m, q, kind, title) => {
		const label = title.trim() || kind.charAt(0).toUpperCase() + kind.slice(1);
		return `${q}**${label}**`;
	});

	// 6. Tidy: no runs of 3+ blank lines left behind by removals.
	out = out.replace(/\n{3,}/g, '\n\n').trim() + '\n';

	return { body: out, images: [...new Set(images)], warnings };
}

/** Build the public frontmatter (whitelist only) and the final file text. */
export function buildPublicFile(data, body, now = today()) {
	const fm = {
		title: String(data.title),
		slug: String(data.slug),
		type: data.type,
		summary: String(data.summary || ''),
		tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
		published: isoDate(data.published) || now,
		updated: now
	};
	for (const k of Object.keys(fm)) if (!PUBLIC_FIELDS.includes(k)) delete fm[k];
	return { frontmatter: fm, text: matter.stringify(body, fm) };
}

export function sitePath(type, slug) {
	return `${SECTION[type]}/${slug}`;
}

/**
 * Set frontmatter fields in a raw note without reformatting anything else
 * (keeps Blair's YAML layout, comments, and Obsidian properties intact).
 */
export function setFields(raw, fields) {
	const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/);
	if (!m) {
		const lines = Object.entries(fields).map(([k, v]) => `${k}: ${v}`);
		return `---\n${lines.join('\n')}\n---\n${raw}`;
	}
	let fm = m[1];
	for (const [k, v] of Object.entries(fields)) {
		const line = `${k}: ${v}`;
		const re = new RegExp(`^${k}:.*$`, 'm');
		fm = re.test(fm) ? fm.replace(re, line) : `${fm}\n${line}`;
	}
	return raw.replace(m[0], `---\n${fm}\n---`);
}
