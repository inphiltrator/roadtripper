<script lang="ts">
  import SouthwestMap from '$lib/components/SouthwestMap.svelte';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();

  let mapComponent: SouthwestMap;
  let mapReady = $state(false);

  function onMapLoad() {
    console.log('🗺️ Map loaded and ready');
    mapReady = true;
  }

  // Use $effect instead of afterUpdate in Svelte 5
  $effect(() => {
    if (form?.success && form.route && mapComponent && mapReady) {
      console.log('🗺️ Route data received:', form.route);
      console.log('🗺️ Route coordinates:', form.route.geometry?.coordinates);
      
      if (form.route.geometry?.coordinates) {
        console.log('🗺️ Drawing route with coordinates:', form.route.geometry.coordinates.length, 'points');
        // Small delay to ensure everything is ready
        setTimeout(() => {
          mapComponent.drawRoute(form.route.geometry.coordinates);
        }, 100);
      } else {
        console.warn('⚠️ No coordinates found in route data');
      }
    }
  });

  function handleLocationClick(coordinates: [number, number]) {
    console.log(`Map clicked at: ${coordinates}`);
  }
</script>

<svelte:head>
  <title>Southwest USA Roadtripper</title>
  <meta name="description" content="Plan your perfect road trip through California, Nevada, Utah, and Arizona" />
</svelte:head>

<main class="min-h-screen desert-background">
  <!-- Header -->
  <header class="glass-panel-dark border-b border-amber-500/20 p-4">
    <div class="container mx-auto">
      <div class="flex items-center justify-between">
        <div class="flex items-center space-x-4">
          <span class="text-3xl">🏜️</span>
          <div>
            <h1 class="text-2xl font-bold text-white">Southwest USA Roadtripper</h1>
            <p class="text-sm text-white/70">Explore California • Nevada • Utah • Arizona</p>
          </div>
        </div>
        <div class="flex items-center space-x-4">
          <a href="/dashboard" class="glass-button px-4 py-2 text-sm">My Trips</a>
        </div>
      </div>
    </div>
  </header>

  <div class="container mx-auto p-4">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div class="lg:col-span-1 space-y-4">
        <div class="glass-panel p-4">
          <h2 class="text-xl font-bold text-white mb-4">Plan Your Route</h2>
          <form method="POST" action="?/calculateRoute">
            <div class="space-y-4">
              <div>
                <label for="start" class="block text-sm font-medium text-white/80 mb-1">Start</label>
                <input
                  type="text"
                  name="start"
                  id="start"
                  class="w-full bg-black/20 text-white border border-white/20 rounded-lg p-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="e.g., Los Angeles, CA"
                />
              </div>
              <div>
                <label for="end" class="block text-sm font-medium text-white/80 mb-1">End</label>
                <input
                  type="text"
                  name="end"
                  id="end"
                  class="w-full bg-black/20 text-white border border-white/20 rounded-lg p-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="e.g., Las Vegas, NV"
                />
              </div>
              <button
                type="submit"
                id="calculate-route"
                class="w-full glass-button px-4 py-2 font-bold"
              >
                Show Route
              </button>
            </div>
          </form>
          {#if form?.success}
            <div class="mt-4 p-3 bg-green-500/20 text-white rounded-lg">
              Trip saved successfully! (ID: {form.tripId})
            </div>
          {/if}
          {#if form?.error}
            <div class="mt-4 p-3 bg-red-500/20 text-white rounded-lg">
              Error: {form.error}
            </div>
          {/if}
        </div>
      </div>
      <div class="lg:col-span-2">
        <SouthwestMap
          bind:this={mapComponent}
          onMapLoad={onMapLoad}
          onLocationClick={handleLocationClick}
          route={form?.route}
          class="h-96 lg:h-[600px]"
        />
      </div>
    </div>
  </div>
</main>

<style>
  .desert-background {
    background: linear-gradient(
      135deg,
      #1a1a2e 0%,
      #16213e 25%,
      #0f3460 75%,
      #533a2c 100%
    );
    min-height: 100vh;
  }

  .glass-panel {
    @apply bg-white/10 backdrop-blur-lg 
           ring-1 ring-amber-500/20
           shadow-2xl rounded-2xl;
  }

  .glass-panel-dark {
    @apply bg-black/20 backdrop-blur-lg 
           ring-1 ring-amber-500/20
           shadow-2xl rounded-2xl;
  }

  .glass-button {
    @apply bg-white/10 backdrop-blur-lg 
           ring-1 ring-amber-500/20
           shadow-lg rounded-lg
           text-white hover:bg-white/20
           transition-all duration-200;
  }
</style>
