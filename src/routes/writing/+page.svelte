<script lang="ts">
	import EntryList from '$lib/components/EntryList.svelte';
	import Seo from '$lib/components/Seo.svelte';
	let { data } = $props();
</script>

<Seo title="Writing" description="Articles on how Blair Williams uses LLMs to solve problems." path="/writing" />

<div class="max-w-3xl mx-auto px-6 py-16">
	<h1 class="text-5xl mb-4">Writing</h1>
	<p class="text-lg text-text-secondary mb-6">
		Case studies and workflows: the problem, what I tried, what broke, and what you can reuse.
	</p>
	<EntryList entries={data.entries} groupByYear empty="The first articles are on the way." />
</div>
