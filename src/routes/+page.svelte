<script lang="ts">
	import EntryList from '$lib/components/EntryList.svelte';
	import Seo from '$lib/components/Seo.svelte';
	let { data } = $props();
</script>

<Seo path="" />

<div class="max-w-3xl mx-auto px-6 py-16">
	<section class="mb-16 flex flex-col sm:flex-row gap-10 items-start sm:items-center">
		<img
			src="/blair-headshot.JPG"
			alt="Blair Williams"
			width="192"
			height="192"
			class="w-40 h-40 sm:w-48 sm:h-48 rounded-full object-cover ring-2 ring-accent ring-offset-4 ring-offset-bg-base flex-shrink-0"
		/>
		<div>
			<h1 class="text-5xl mb-5">Blair Williams</h1>
			<p class="text-xl text-text-secondary mb-3">Technical Writer. Problem Solver. Historian.</p>
			<p class="text-lg text-text-secondary">
				I write about how I use LLMs to work through complex, unfamiliar systems, and the
				workflows anyone can reuse. <a href="/about">More about me</a>.
			</p>
		</div>
	</section>

	<section class="mb-16">
		<h2 class="text-3xl mb-6">Recent writing</h2>
		<EntryList entries={data.writing} empty="The first articles are on the way." />
		{#if data.totalWriting > data.writing.length}
			<p class="mt-8 ui-sans"><a href="/writing">All {data.totalWriting} articles →</a></p>
		{/if}
	</section>

	{#if data.projects.length}
		<section>
			<h2 class="text-3xl mb-6">Projects</h2>
			<EntryList entries={data.projects} />
			<p class="mt-8 ui-sans"><a href="/projects">All projects →</a></p>
		</section>
	{/if}
</div>
