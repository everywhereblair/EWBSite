<script lang="ts">
	import ArticleView from '$lib/components/ArticleView.svelte';
	let { data } = $props();
</script>

<ArticleView {...data} indexHref="/writing" indexLabel="Writing" />
