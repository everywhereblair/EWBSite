<script lang="ts">
	import { SITE } from '$lib/site';

	let {
		title,
		description = SITE.description,
		path,
		type = 'website',
		markdown
	}: {
		title?: string;
		description?: string;
		path: string;
		type?: 'website' | 'article';
		markdown?: string; // path to the raw .md version, if any
	} = $props();

	const fullTitle = $derived(title ? `${title} — ${SITE.name}` : `${SITE.author} — ${SITE.name}`);
	const url = $derived(SITE.url + path);
</script>

<svelte:head>
	<title>{fullTitle}</title>
	<meta name="description" content={description} />
	<link rel="canonical" href={url} />
	{#if markdown}<link rel="alternate" type="text/markdown" href={markdown} />{/if}
	<meta property="og:title" content={title ?? SITE.author} />
	<meta property="og:description" content={description} />
	<meta property="og:url" content={url} />
	<meta property="og:type" content={type} />
	<meta property="og:site_name" content={SITE.name} />
	<meta name="twitter:card" content="summary" />
</svelte:head>
