#!/usr/bin/env node
// upload / unpublish: move one finished note from the Obsidian vault to the live site.
//
//   npm run upload -- "Title or slug"             validate, transform, build, commit, push, confirm live
//   npm run upload -- "Title" --dry-run           everything except writing to the repo / git / vault
//   npm run upload -- "Title" --no-push           commit locally, don't push
//   npm run unpublish -- "Title or slug"          remove from site, push, set vault status back to draft
//   npm run upload -- --list                      show every note in Website/ and its status
//
// Deterministic on purpose: no LLM in this path. Config: scripts/publish.local.json (gitignored),
// see scripts/publish.example.json.
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import matter from 'gray-matter';
import {
	TYPE_DIR,
	buildPublicFile,
	guardHits,
	isoDate,
	parseGuard,
	setFields,
	sitePath,
	today,
	transformBody,
	validate
} from './lib/transform.mjs';

const REPO = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const NOTE_DIRS = ['Writing', 'Projects', 'Pages'];

// ---------- tiny helpers ----------
const c = (code) => (s) => (process.stdout.isTTY ? `\x1b[${code}m${s}\x1b[0m` : s);
const red = c(31), green = c(32), yellow = c(33), dim = c(2), bold = c(1);
function die(msg, extra = []) {
	console.error(red(`✗ ${msg}`));
	for (const l of extra) console.error(`  ${l}`);
	process.exit(1);
}
const git = (...args) => execFileSync('git', args, { cwd: REPO, encoding: 'utf8' }).trim();
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function loadConfig() {
	const file = path.join(REPO, 'scripts/publish.local.json');
	let cfg = {};
	if (fs.existsSync(file)) cfg = JSON.parse(fs.readFileSync(file, 'utf8'));
	const website = process.env.EWB_WEBSITE_DIR || cfg.websiteDir;
	if (!website) die('No vault folder configured.', ['Copy scripts/publish.example.json to scripts/publish.local.json and set "websiteDir".']);
	const dir = website.replace(/^~(?=\/)/, os.homedir());
	if (!fs.existsSync(dir)) die(`Vault folder not found: ${dir}`);
	return { websiteDir: dir, siteUrl: (cfg.siteUrl || 'https://everywhereblair.com').replace(/\/$/, '') };
}

/** iCloud may evict files to ".Name.md.icloud" placeholders. Download them first. */
function materialize(dir) {
	if (!fs.existsSync(dir)) return;
	const stubs = fs.readdirSync(dir).filter((f) => /^\..+\.md\.icloud$/.test(f));
	for (const stub of stubs) {
		const real = path.join(dir, stub.slice(1, -'.icloud'.length));
		spawnSync('brctl', ['download', real]);
	}
	if (stubs.length) {
		const deadline = Date.now() + 30_000;
		while (Date.now() < deadline && fs.readdirSync(dir).some((f) => f.endsWith('.md.icloud'))) {
			Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, 500);
		}
	}
}

function loadNotes(websiteDir) {
	const notes = [];
	for (const d of NOTE_DIRS) {
		const dir = path.join(websiteDir, d);
		materialize(dir);
		if (!fs.existsSync(dir)) continue;
		for (const f of fs.readdirSync(dir).filter((f) => f.endsWith('.md') && !f.startsWith('.'))) {
			const file = path.join(dir, f);
			const raw = fs.readFileSync(file, 'utf8');
			try {
				const { data, content } = matter(raw);
				notes.push({ file, rel: `${d}/${f}`, name: f.replace(/\.md$/, ''), raw, data, content });
			} catch (e) {
				console.warn(yellow(`! Skipping ${d}/${f}: frontmatter doesn't parse (${e.message.split('\n')[0]})`));
			}
		}
	}
	return notes;
}

function findNote(notes, query) {
	const q = query.trim().toLowerCase();
	const exact = notes.filter(
		(n) => [n.name, n.data.title, n.data.slug].some((v) => v && String(v).toLowerCase() === q)
	);
	if (exact.length === 1) return exact[0];
	const fuzzy = exact.length ? exact : notes.filter((n) => `${n.name} ${n.data.title ?? ''} ${n.data.slug ?? ''}`.toLowerCase().includes(q));
	if (fuzzy.length === 1) return fuzzy[0];
	if (!fuzzy.length)
		die(`No note in Website/ matches "${query}".`, notes.length ? ['Notes available:', ...notes.map((n) => `- ${n.data.title ?? n.name} ${dim(`[${n.data.status ?? 'no status'}]`)}`)] : []);
	die(`"${query}" matches ${fuzzy.length} notes. Be more specific:`, fuzzy.map((n) => `- ${n.data.title ?? n.name} ${dim(n.rel)}`));
}

function repoTargets(type, slug) {
	return {
		md: path.join(REPO, 'src/content', TYPE_DIR[type], `${slug}.md`),
		imgDir: path.join(REPO, 'static/img', slug)
	};
}

function ensureGitReady({ push }) {
	const branch = git('rev-parse', '--abbrev-ref', 'HEAD');
	if (branch !== 'main') die(`Repo is on branch "${branch}". Switch to main first.`);
	if (push) {
		try {
			git('pull', '--ff-only', '--quiet');
		} catch {
			die('git pull failed (local and remote main have diverged). Resolve that first.');
		}
	}
}

function commitAndPush(paths, message, { push }) {
	git('add', '-A', '--', ...paths);
	const staged = git('diff', '--cached', '--name-only', '--', ...paths);
	if (!staged) {
		console.log(dim('• No changes to commit; the site already has this version.'));
		return false;
	}
	git('commit', '--quiet', '-m', message, '--', ...paths);
	console.log(green(`✓ Committed: ${message}`));
	if (push) {
		git('push', '--quiet', 'origin', 'main');
		console.log(green('✓ Pushed to main. Cloudflare is deploying.'));
	}
	return true;
}

async function waitForLive(url, expectStatus, timeoutMs = 180_000) {
	console.log(dim(`• Waiting for ${url} to return ${expectStatus} (up to ${timeoutMs / 60000} min)…`));
	const deadline = Date.now() + timeoutMs;
	while (Date.now() < deadline) {
		try {
			const res = await fetch(`${url}?v=${Date.now()}`, { redirect: 'follow', cache: 'no-store' });
			if (res.status === expectStatus) return true;
		} catch {
			/* DNS/network hiccup: keep polling */
		}
		await sleep(10_000);
	}
	return false;
}

function build() {
	console.log(dim('• Building the site (catches broken links and bad markdown)…'));
	const r = spawnSync('npm', ['run', 'build'], { cwd: REPO, encoding: 'utf8' });
	if (r.status !== 0) {
		const tail = `${r.stdout}\n${r.stderr}`.trim().split('\n').slice(-25);
		return { ok: false, tail };
	}
	return { ok: true };
}

/** Put files back the way git has them (or delete them if they were new). */
function restore(paths) {
	for (const p of paths) {
		const rel = path.relative(REPO, p);
		const tracked = spawnSync('git', ['ls-files', '--error-unmatch', rel], { cwd: REPO }).status === 0;
		if (tracked) spawnSync('git', ['checkout', '--', rel], { cwd: REPO });
		else fs.rmSync(p, { recursive: true, force: true });
	}
}

// ---------- commands ----------
function list(notes) {
	if (!notes.length) return console.log('No notes in Website/Writing, Projects, or Pages yet.');
	for (const n of notes) console.log(`${(n.data.status ?? '—').padEnd(10)} ${n.data.title ?? n.name} ${dim(n.rel)}`);
}

async function upload(note, notes, cfg, flags) {
	const { data } = note;
	const others = notes.map((n) => ({ slug: n.data.slug, file: n.rel }));
	const problems = validate(data, { others, file: note.rel });
	if (problems.length) die(`Can't publish "${data.title ?? note.name}":`, problems.map((p) => `- ${p}`));

	// Guard list (confidential terms). Lives in the vault, never in the repo.
	const guardFile = path.join(cfg.websiteDir, '_guard.txt');
	const guard = parseGuard(fs.existsSync(guardFile) ? fs.readFileSync(guardFile, 'utf8') : '');
	if (!guard.length) console.warn(yellow('! _guard.txt is empty, so no confidential-term check ran.'));

	// Links to other published Website notes become site links.
	const published = new Map();
	for (const n of notes) {
		const isLive = n === note || n.data.status === 'published';
		if (!isLive || !n.data.slug || !TYPE_DIR[n.data.type]) continue;
		const href = sitePath(n.data.type, n.data.slug);
		for (const k of [n.name, n.data.title]) if (k) published.set(String(k).toLowerCase(), href);
	}
	const { body, images, warnings } = transformBody(note.content, {
		slug: data.slug,
		resolve: (t) => published.get(t.toLowerCase()) ?? null
	});
	const now = today();
	const { text } = buildPublicFile(data, body, now);

	const hits = guardHits(`${text}\n${images.join('\n')}`, guard);
	if (hits.length) die('Blocked by _guard.txt (confidential terms found):', hits.map((h) => `- "${h.term}" in: ${h.line.slice(0, 120)}`));

	// Images must exist in _assets/<slug>/ (or _assets/).
	const assetSrc = images.map((img) => {
		const candidates = [path.join(cfg.websiteDir, '_assets', data.slug, img), path.join(cfg.websiteDir, '_assets', img)];
		const found = candidates.find((p) => fs.existsSync(p));
		if (!found) die(`Image not found: ${img}`, [`Put it in Website/_assets/${data.slug}/`]);
		return found;
	});

	for (const w of warnings) console.warn(yellow(`! ${w}`));
	const url = cfg.siteUrl + sitePath(data.type, data.slug);

	if (flags.dryRun) {
		console.log(bold(`\nDry run: "${data.title}" → ${url}`));
		console.log(dim(`(${text.length} chars, ${images.length} image(s), ${warnings.length} warning(s))`));
		console.log('\n' + text);
		return;
	}

	ensureGitReady({ push: flags.push });
	const target = repoTargets(data.type, data.slug);
	fs.mkdirSync(path.dirname(target.md), { recursive: true });
	fs.writeFileSync(target.md, text);
	if (assetSrc.length) {
		fs.rmSync(target.imgDir, { recursive: true, force: true });
		fs.mkdirSync(target.imgDir, { recursive: true });
		for (const src of assetSrc) fs.copyFileSync(src, path.join(target.imgDir, path.basename(src)));
	}
	const paths = [target.md, ...(assetSrc.length ? [target.imgDir] : [])];

	const b = build();
	if (!b.ok) {
		restore(paths);
		die('Build failed, so nothing was committed. Last lines:', b.tail);
	}
	console.log(green('✓ Build passed.'));

	const verb = data.status === 'published' ? 'update' : 'publish';
	const changed = commitAndPush(paths, `${verb}: ${data.title}`, flags);

	// Write the result back to the vault note.
	const firstPublished = isoDate(data.published) || now;
	fs.writeFileSync(note.file, setFields(note.raw, { status: 'published', published: firstPublished, updated: now, url }));
	console.log(green(`✓ Vault note updated: status published, url ${url}`));

	if (changed && flags.push) {
		const live = await waitForLive(url, 200);
		console.log(live ? green(bold(`\n✓ Live: ${url}`)) : yellow(`\n! Not confirmed live after 3 min. Check the Cloudflare dashboard. URL: ${url}`));
	} else {
		console.log(bold(`\nURL: ${url}`));
	}
}

async function unpublish(note, cfg, flags) {
	const { data } = note;
	if (!data.slug || !TYPE_DIR[data.type]) die('Note has no valid slug/type, so there is nothing to unpublish.');
	if (data.type === 'page') die('Pages (about) can be replaced with upload, but not unpublished.');
	const target = repoTargets(data.type, data.slug);
	if (!fs.existsSync(target.md)) die(`Not on the site: ${path.relative(REPO, target.md)} doesn't exist.`);
	if (flags.dryRun) return console.log(`Dry run: would remove ${path.relative(REPO, target.md)} and static/img/${data.slug}/`);

	ensureGitReady({ push: flags.push });
	const paths = [target.md, target.imgDir].filter((p) => fs.existsSync(p));
	for (const p of paths) fs.rmSync(p, { recursive: true, force: true });
	const b = build();
	if (!b.ok) {
		restore(paths);
		die('Build failed after removal (another page probably links to it). Nothing committed. Last lines:', b.tail);
	}
	const changed = commitAndPush(paths, `unpublish: ${data.title}`, flags);
	fs.writeFileSync(note.file, setFields(note.raw, { status: 'draft', url: '""' }));
	console.log(green('✓ Vault note set back to status: draft'));
	const url = cfg.siteUrl + sitePath(data.type, data.slug);
	if (changed && flags.push) {
		const gone = await waitForLive(url, 404);
		console.log(gone ? green(`✓ Removed from the live site: ${url}`) : yellow('! Still reachable after 3 min. Check Cloudflare.'));
	}
}

// ---------- main ----------
const args = process.argv.slice(2);
const flags = {
	dryRun: args.includes('--dry-run'),
	push: !args.includes('--no-push'),
	unpublish: args.includes('--unpublish'),
	list: args.includes('--list')
};
const query = args.filter((a) => !a.startsWith('--')).join(' ');
const cfg = loadConfig();
const notes = loadNotes(cfg.websiteDir);

if (flags.list) list(notes);
else if (!query) die('Usage: npm run upload -- "Title"   |   npm run unpublish -- "Title"   |   npm run upload -- --list');
else {
	const note = findNote(notes, query);
	await (flags.unpublish ? unpublish(note, cfg, flags) : upload(note, notes, cfg, flags));
}
