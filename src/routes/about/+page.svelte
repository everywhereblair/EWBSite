<script lang="ts">
	import Seo from '$lib/components/Seo.svelte';
	let { data } = $props();
</script>

<Seo title="About" description={data.entry.summary} path="/about" markdown="/about.md" />

<div class="mx-auto px-6 py-16" style="max-width: 72ch">
	<h1 class="text-5xl mb-8">About</h1>
	<div class="prose-body">
		{@html data.html}
	</div>
</div>
