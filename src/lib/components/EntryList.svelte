<script lang="ts">
	import type { Card } from '$lib/server/content';

	let {
		entries,
		groupByYear = false,
		empty = 'Nothing here yet.'
	}: { entries: Card[]; groupByYear?: boolean; empty?: string } = $props();

	const groups = $derived.by(() => {
		if (!groupByYear) return [{ year: '', items: entries }];
		const map = new Map<string, Card[]>();
		for (const e of entries) {
			const y = e.published.slice(0, 4) || 'Undated';
			map.set(y, [...(map.get(y) ?? []), e]);
		}
		return [...map].map(([year, items]) => ({ year, items }));
	});

	const fmt = (d: string) =>
		d
			? new Date(d + 'T12:00:00').toLocaleDateString('en-US', {
					month: 'short',
					day: 'numeric',
					year: groupByYear ? undefined : 'numeric'
				})
			: '';
</script>

{#if entries.length === 0}
	<p class="text-lg text-text-muted">{empty}</p>
{:else}
	{#each groups as g}
		{#if g.year}<h2 class="year ui-sans">{g.year}</h2>{/if}
		<ul class="entries">
			{#each g.items as e}
				<li>
					<a href={e.path} class="title">{e.title}</a>
					<div class="meta ui-sans">
						{#if e.published}<time datetime={e.published}>{fmt(e.published)}</time> · {/if}{e.readingMinutes} min read
					</div>
					{#if e.summary}<p class="summary">{e.summary}</p>{/if}
				</li>
			{/each}
		</ul>
	{/each}
{/if}

<style>
	.year {
		display: block;
		border: 0;
		padding: 0;
		margin: 2.5rem 0 0.75rem;
		font-size: 0.85rem;
		letter-spacing: 0.08em;
		color: var(--color-text-muted);
	}
	.entries {
		list-style: none;
		padding: 0;
		display: grid;
		gap: 1.75rem;
	}
	.title {
		font-family: var(--font-display);
		font-size: 1.4rem;
		text-decoration: none;
		color: var(--h2-color);
	}
	.title:hover {
		color: var(--color-accent-hover);
		text-decoration: underline;
	}
	.meta {
		font-size: 0.85rem;
		color: var(--color-text-muted);
		margin-top: 0.15rem;
	}
	.summary {
		margin-top: 0.4rem;
		color: var(--color-text-secondary);
		max-width: 68ch;
		line-height: 1.6;
	}
</style>
