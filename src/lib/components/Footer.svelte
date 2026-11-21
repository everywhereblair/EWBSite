<script lang="ts">
	import { SITE } from '$lib/site';
</script>

<footer class="border-t mt-12 ui-sans">
	<div class="max-w-4xl mx-auto px-6 py-8 flex flex-wrap gap-x-6 gap-y-2 text-sm justify-between">
		<p>© {new Date().getFullYear()} {SITE.author}</p>
		<ul class="flex flex-wrap gap-x-5 gap-y-2">
			<li><a href={SITE.links.bluesky} class="external">Bluesky</a></li>
			<li><a href={SITE.links.github} class="external">GitHub</a></li>
			<li><a href="/rss.xml">RSS</a></li>
			<li><a href="/llms.txt" title="Plain-text index for AI agents">llms.txt</a></li>
		</ul>
	</div>
</footer>

<style>
	footer {
		background-color: var(--color-bg-surface);
		border-color: var(--color-border);
	}
	p,
	a {
		color: var(--color-text-secondary);
	}
</style>
