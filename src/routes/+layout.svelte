<script lang="ts">
	import '../app.css';
	import favicon from '$lib/assets/favicon.svg';
	import { onMount } from 'svelte';

	let { children } = $props();

	// Regional configuration
	const APP_NAME = 'Southwest USA Roadtripper';

	onMount(() => {
		// Add desert background gradient based on time of day
		const hour = new Date().getHours();
		const isDaytime = hour >= 6 && hour < 18;
		
		document.documentElement.style.setProperty(
			'--bg-opacity', 
			isDaytime ? '0.1' : '0.05'
		);
	});
</script>

<svelte:head>
	<link rel="icon" href={favicon} />
	<title>{APP_NAME}</title>
</svelte:head>

<div class="h-full relative overflow-hidden">
	<!-- Desert Background Pattern -->
	<div class="absolute inset-0 pointer-events-none opacity-5">
		<div class="absolute inset-0" 
			style="background-image: radial-gradient(circle at 20% 50%, rgba(238, 124, 21, 0.1) 0%, transparent 50%), radial-gradient(circle at 80% 20%, rgba(220, 38, 38, 0.08) 0%, transparent 50%), radial-gradient(circle at 40% 80%, rgba(249, 115, 22, 0.06) 0%, transparent 50%);"
		></div>
	</div>

	<!-- Main Content -->
	<main class="h-full relative z-10">
		{@render children?.()}
	</main>

	<!-- Regional Status Indicator -->
	<div class="fixed bottom-4 right-4 z-50 glass-panel p-2 text-xs text-white/70">
		<div class="flex items-center gap-2">
			<div class="status-online"></div>
			Southwest USA Region Active
		</div>
	</div>
</div>
