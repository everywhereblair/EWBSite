<script lang="ts">
	interface BlogPost {
		title: string;
		date: string;
		excerpt?: string;
		tags: string[];
		related?: Array<{ title: string; url: string }>;
	}

	let post: BlogPost = {
		title: 'Sample Post',
		date: '2026-09-13',
		tags: ['writing', 'sample'],
		related: [
			{ title: 'Related Post 1', url: '/posts/related-1' },
			{ title: 'Related Post 2', url: '/posts/related-2' }
		]
	};
</script>

<svelte:head>
	<title>{post.title} — EverywhereBlair</title>
</svelte:head>

<article class="max-w-7xl mx-auto px-6 py-16">
	<div class="grid grid-cols-1 md:grid-cols-4 gap-8">
		<!-- Left rail: author blurb -->
		<aside class="md:col-span-1 md:sticky md:top-20 md:h-fit">
			<div class="bg-bg-surface rounded p-4 ui-sans">
				<div class="text-sm font-semibold text-text-primary mb-2">Written by</div>
				<div class="text-text-secondary text-sm mb-4">Blair Williams</div>
				<div class="text-text-muted text-xs mb-4">{post.date}</div>
				<div class="flex gap-3 text-xs">
					<a href="https://twitter.com" class="external text-link-external-color hover:underline">Twitter</a>
					<a href="https://github.com" class="external text-link-external-color hover:underline">GitHub</a>
				</div>
			</div>
		</aside>

		<!-- Center: article content -->
		<main class="md:col-span-2 prose prose-invert max-w-none">
			<h1>{post.title}</h1>
			<p class="text-text-secondary text-lg">{post.excerpt || '[PLACEHOLDER] Article content goes here.'}</p>
			<!-- Article body will render here via slot or MDsveX -->
		</main>

		<!-- Right rail: tags and related posts -->
		<aside class="md:col-span-1 md:sticky md:top-20 md:h-fit">
			{#if post.tags.length > 0}
				<div class="mb-8">
					<h3 class="text-sm font-semibold text-text-primary mb-3 ui-sans">Tags</h3>
					<div class="flex flex-wrap gap-2">
						{#each post.tags as tag}
							<a href="/posts/tag/{tag}" class="inline-block px-2 py-1 bg-bg-surface text-text-secondary text-xs rounded hover:bg-accent hover:text-bg-base transition-colors ui-sans">
								{tag}
							</a>
						{/each}
					</div>
				</div>
			{/if}

			{#if post.related && post.related.length > 0}
				<div>
					<h3 class="text-sm font-semibold text-text-primary mb-3 ui-sans">Related work</h3>
					<ul class="space-y-2">
						{#each post.related as item}
							<li>
								<a href={item.url} class="text-accent hover:text-accent-hover text-sm">{item.title}</a>
							</li>
						{/each}
					</ul>
				</div>
			{/if}
		</aside>
	</div>
</article>

<style>
	:global(.prose) {
		--prose-body: var(--color-text-primary);
		--prose-headings: var(--h1-color);
		--prose-links: var(--color-accent);
	}
</style>
