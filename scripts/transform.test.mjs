// Run: npm run test:publish
import assert from 'node:assert/strict';
import fs from 'node:fs';
import test from 'node:test';
import matter from 'gray-matter';
import { buildPublicFile, guardHits, parseGuard, setFields, transformBody, validate } from './lib/transform.mjs';

const fixture = fs.readFileSync(new URL('./fixtures/kitchen-sink.md', import.meta.url), 'utf8');
const { data, content } = matter(fixture);
const resolve = (t) => (t.toLowerCase() === 'published sibling' ? '/writing/published-sibling' : null);

test('guard blocks a confidential term, case-insensitively, and reports the line', () => {
	const hits = guardHits(content, parseGuard('# comment\n\nACME Widget\n'));
	assert.equal(hits.length, 1);
	assert.match(hits[0].line, /acme widget/i);
});

test('transform strips private material and converts Obsidian syntax', () => {
	const { body, images, warnings } = transformBody(content, { slug: data.slug, resolve });
	assert.doesNotMatch(body, /%%|SECRET REVIEW NOTE|multi-line secret/);
	assert.doesNotMatch(body, /\[\[/);
	assert.match(body, /\[the sibling\]\(\/writing\/published-sibling\)/);
	assert.match(body, /Manager Feedback 2026/); // private link -> plain text only
	assert.doesNotMatch(body, /\]\([^)]*Manager/);
	assert.match(body, /!\[\]\(\/img\/kitchen-sink\/diagram\.png\)/);
	assert.match(body, /!\[A chart\]\(\/img\/kitchen-sink\/chart%20one\.png\)/);
	assert.match(body, /!\[local\]\(\/img\/kitchen-sink\/photo\.jpg\)/);
	assert.match(body, /!\[remote\]\(https:\/\/example\.com\/x\.png\)/);
	assert.match(body, /> \*\*Heads up\*\*/);
	assert.match(body, /> \*\*Tip\*\*/);
	assert.deepEqual(images.sort(), ['chart one.png', 'diagram.png', 'photo.jpg']);
	assert.ok(warnings.some((w) => w.includes('Manager Feedback 2026')));
	assert.ok(warnings.some((w) => w.includes('Some Embedded Note')));
});

test('public frontmatter is whitelisted', () => {
	const { frontmatter, text } = buildPublicFile(data, 'body\n', '2026-11-21');
	assert.deepEqual(Object.keys(frontmatter).sort(), ['published', 'slug', 'summary', 'tags', 'title', 'type', 'updated']);
	assert.doesNotMatch(text, /model:|log_ref|status:|agent_notes/);
	assert.equal(frontmatter.updated, '2026-11-21');
});

test('validation catches status, slug format, duplicates, private tag, and slug changes', () => {
	assert.deepEqual(validate(data), []);
	assert.match(validate({ ...data, status: 'draft' })[0], /status/);
	assert.ok(validate({ ...data, slug: 'Bad Slug' }).some((p) => /kebab/.test(p)));
	assert.ok(validate(data, { others: [{ slug: 'kitchen-sink', file: 'Writing/Other.md' }], file: 'Writing/Kitchen.md' }).some((p) => /also used/.test(p)));
	assert.ok(validate({ ...data, tags: ['Private'] }).some((p) => /private/.test(p)));
	assert.ok(validate({ ...data, url: 'https://everywhereblair.com/writing/old-slug' }).some((p) => /slug changed/.test(p)));
	assert.ok(validate({ ...data, summary: '' }).some((p) => /summary/.test(p)));
});

test('setFields updates frontmatter without disturbing the rest', () => {
	const raw = '---\ntitle: X\nstatus: ready # keep me\ncustom: [a, b]\n---\n\nBody %% stays in vault %%\n';
	const out = setFields(raw, { status: 'published', url: 'https://e.com/writing/x' });
	assert.match(out, /^status: published$/m);
	assert.match(out, /^url: https:\/\/e\.com\/writing\/x$/m);
	assert.match(out, /custom: \[a, b\]/);
	assert.match(out, /Body %% stays in vault %%/);
});
