<script lang="ts">
	import Seo from './Seo.svelte';
	import JsonLd from './JsonLd.svelte';
	import { SITE } from '$lib/site';
	import type { Card, TocEntry } from '$lib/server/content';

	let {
		entry,
		html,
		toc,
		newer,
		older,
		indexHref,
		indexLabel
	}: {
		entry: Card;
		html: string;
		toc: TocEntry[];
		newer: Card | null;
		older: Card | null;
		indexHref: string;
		indexLabel: string;
	} = $props();

	const fmt = (d: string) =>
		new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
			month: 'long',
			day: 'numeric',
			year: 'numeric'
		});
</script>

<Seo
	title={entry.title}
	description={entry.summary || undefined}
	path={entry.path}
	type="article"
	markdown="{entry.path}.md"
/>
<JsonLd
	data={{
		'@context': 'https://schema.org',
		'@type': entry.type === 'project' ? 'CreativeWork' : 'Article',
		headline: entry.title,
		description: entry.summary,
		datePublished: entry.published,
		dateModified: entry.updated,
		url: entry.url,
		keywords: entry.tags.join(', '),
		author: { '@type': 'Person', name: SITE.author, url: SITE.url },
		encoding: { '@type': 'MediaObject', encodingFormat: 'text/markdown', contentUrl: entry.url + '.md' }
	}}
/>

<article class="mx-auto px-6 py-14" style="max-width: 72ch">
	<a href={indexHref} class="back ui-sans">← {indexLabel}</a>
	<header class="mb-10 mt-4">
		<h1 class="page-title text-4xl sm:text-5xl leading-tight">{entry.title}</h1>
		<p class="meta ui-sans">
			{SITE.author}
			{#if entry.published}· <time datetime={entry.published}>{fmt(entry.published)}</time>{/if}
			· {entry.readingMinutes} min read
			{#if entry.updated && entry.updated !== entry.published}· updated {fmt(entry.updated)}{/if}
		</p>
		{#if entry.summary}<p class="tldr"><span class="ui-sans">TL;DR</span> {entry.summary}</p>{/if}
	</header>

	{#if toc.length}
		<nav class="toc ui-sans" aria-label="On this page">
			<div class="toc-title">On this page</div>
			<ul>
				{#each toc as t}
					<li class:sub={t.depth === 3}><a href="#{t.id}">{t.text}</a></li>
				{/each}
			</ul>
		</nav>
	{/if}

	<div class="prose-body">
		{@html html}
	</div>

	<footer class="end ui-sans">
		<a href="{entry.path}.md" title="Plain markdown, handy for LLMs">View as markdown</a>
		<nav class="pager" aria-label="More">
			{#if newer}<a href={newer.path} class="newer">← {newer.title}</a>{:else}<span></span>{/if}
			{#if older}<a href={older.path} class="older">{older.title} →</a>{/if}
		</nav>
		<a href={indexHref}>All {indexLabel.toLowerCase()}</a>
	</footer>
</article>

<style>
	.back,
	.end a {
		font-size: 0.9rem;
		color: var(--color-text-secondary);
		text-decoration: none;
	}
	.back:hover,
	.end a:hover {
		color: var(--color-accent-hover);
	}
	.meta {
		margin-top: 1rem;
		font-size: 0.9rem;
		color: var(--color-text-muted);
	}
	.tldr {
		margin-top: 1.5rem;
		padding: 0.9rem 1.1rem;
		border-left: 3px solid var(--color-accent);
		background: var(--color-accent-soft);
		color: var(--color-text-primary);
		font-size: 1.1rem;
		line-height: 1.6;
	}
	.tldr span {
		font-size: 0.75rem;
		font-weight: 600;
		letter-spacing: 0.08em;
		color: var(--color-accent-hover);
		margin-right: 0.4rem;
	}
	.toc {
		margin-bottom: 2.5rem;
		padding: 1rem 1.25rem;
		background: var(--color-bg-surface);
		border-radius: 6px;
		font-size: 0.95rem;
	}
	.toc-title {
		font-weight: 600;
		color: var(--color-text-secondary);
		margin-bottom: 0.5rem;
	}
	.toc ul {
		list-style: none;
		padding-left: 0;
		display: grid;
		gap: 0.3rem;
	}
	.toc li.sub {
		margin-left: 1rem;
		font-size: 0.9em;
	}
	.toc a {
		text-decoration: none;
	}
	.end {
		margin-top: 4rem;
		padding-top: 1.5rem;
		border-top: 1px solid var(--color-border);
		display: grid;
		gap: 1.25rem;
	}
	.pager {
		display: flex;
		justify-content: space-between;
		gap: 1rem;
	}
	.pager .older {
		text-align: right;
	}
</style>
