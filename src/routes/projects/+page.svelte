<script lang="ts">
	import EntryList from '$lib/components/EntryList.svelte';
	import Seo from '$lib/components/Seo.svelte';
	let { data } = $props();
</script>

<Seo title="Projects" description="Systems and tools Blair Williams has built, many with LLMs in the loop." path="/projects" />

<div class="max-w-3xl mx-auto px-6 py-16">
	<h1 class="text-5xl mb-4">Projects</h1>
	<p class="text-lg text-text-secondary mb-10">Things I've built, and how they work.</p>
	<EntryList entries={data.entries} empty="Project write-ups are on the way." />
</div>
