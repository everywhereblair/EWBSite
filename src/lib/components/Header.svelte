<script lang="ts">
	import { page } from '$app/state';
	import { SITE } from '$lib/site';

	const nav = [
		{ href: '/writing', label: 'Writing' },
		{ href: '/projects', label: 'Projects' },
		{ href: '/about', label: 'About' }
	];
	const isActive = (href: string) =>
		page.url.pathname === href || page.url.pathname.startsWith(href + '/');
</script>

<header class="border-b sticky top-0 z-40 ui-sans">
	<nav
		class="max-w-4xl mx-auto px-6 py-4 flex flex-wrap items-center justify-between gap-y-2"
		aria-label="Main"
	>
		<a href="/" class="brand text-2xl font-semibold">{SITE.name}</a>
		<ul class="flex gap-6">
			{#each nav as item}
				<li>
					<a
						href={item.href}
						class:active={isActive(item.href)}
						aria-current={isActive(item.href) ? 'page' : undefined}>{item.label}</a
					>
				</li>
			{/each}
		</ul>
	</nav>
</header>

<style>
	header {
		background-color: var(--color-bg-base);
		border-color: var(--color-border);
	}
	a {
		color: var(--color-text-primary);
		text-decoration: none;
	}
	a:hover,
	a.active,
	.brand {
		color: var(--color-accent);
	}
	.brand:hover {
		color: var(--color-accent-hover);
	}
	a.active {
		text-decoration: underline;
		text-underline-offset: 6px;
		text-decoration-color: var(--color-accent-edge-strong);
	}
</style>
