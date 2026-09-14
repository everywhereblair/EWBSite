<script lang="ts">
	import { page } from '$app/stores';
</script>

<header class="bg-bg-base border-b border-border sticky top-0 z-40 ui-sans">
	<nav class="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
		<a href="/" class="text-2xl font-semibold text-accent hover:text-accent-hover transition-colors">
			EverywhereBlair
		</a>
		<ul class="flex gap-6">
			<li>
				<a
					href="/"
					class="text-text-primary hover:text-accent transition-colors"
					class:text-accent={$page.url.pathname === '/'}
				>
					Home
				</a>
			</li>
			<li>
				<a
					href="/writing"
					class="text-text-primary hover:text-accent transition-colors"
					class:text-accent={$page.url.pathname === '/writing'}
				>
					Writing
				</a>
			</li>
			<li>
				<a
					href="/about"
					class="text-text-primary hover:text-accent transition-colors"
					class:text-accent={$page.url.pathname === '/about'}
				>
					About
				</a>
			</li>
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
	}

	a:hover {
		color: var(--color-accent);
	}

	.text-accent {
		color: var(--color-accent);
	}
</style>
