<script lang="ts">
	import favicon from '$lib/assets/favicon.svg';
	import Header from '$lib/components/Header.svelte';
	import Footer from '$lib/components/Footer.svelte';
	import JsonLd from '$lib/components/JsonLd.svelte';
	import { SITE } from '$lib/site';
	import '../app.css';

	let { children } = $props();
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<link rel="alternate" type="application/rss+xml" title="{SITE.name} RSS" href="/rss.xml" />
	<link rel="alternate" type="text/plain" title="LLM-readable index" href="/llms.txt" />
</svelte:head>

<JsonLd
	data={{
		'@context': 'https://schema.org',
		'@type': 'Person',
		name: SITE.author,
		url: SITE.url,
		jobTitle: 'Technical Writer',
		sameAs: [SITE.links.bluesky, SITE.links.github]
	}}
/>

<a href="#content" class="skip-link ui-sans">Skip to content</a>
<div class="min-h-screen flex flex-col bg-bg-base text-text-primary">
	<Header />
	<main id="content" class="flex-1">
		{@render children()}
	</main>
	<Footer />
</div>
