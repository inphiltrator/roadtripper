<script lang="ts">
  import type { PageData } from './$types';

  export let data: PageData;
</script>

<svelte:head>
  <title>My Trips</title>
</svelte:head>

<div class="min-h-screen desert-background p-8">
  <div class="max-w-4xl mx-auto">
    <div class="flex justify-between items-center mb-8">
      <h1 class="text-4xl font-bold text-white">My Trips</h1>
      <a href="/" class="glass-button px-4 py-2">+ New Trip</a>
    </div>

    <div class="space-y-4">
      {#if data.trips.length === 0}
        <div class="text-center glass-panel p-12">
          <h3 class="text-xl text-white">No trips planned yet.</h3>
          <p class="text-white/70">Let's plan your next adventure!</p>
        </div>
      {:else}
        {#each data.trips as trip}
          <div class="glass-panel p-6 rounded-xl flex justify-between items-center">
            <div>
              <h2 class="text-2xl font-bold text-white">{trip.name}</h2>
              <p class="text-sm text-white/60">
                Created on: {new Date(trip.createdAt).toLocaleDateString()}
              </p>
            </div>
            <a href="/trip/{trip.id}" class="glass-button px-4 py-2 text-sm">View Details</a>
          </div>
        {/each}
      {/if}
    </div>
  </div>
</div>

<style>
  .desert-background {
    background: linear-gradient(135deg, #1a1a2e 0%, #16213e 25%, #0f3460 75%, #533a2c 100%);
  }
  .glass-panel {
    @apply bg-white/10 backdrop-blur-lg ring-1 ring-amber-500/20 shadow-2xl rounded-2xl;
  }
  .glass-button {
    @apply bg-white/10 backdrop-blur-lg ring-1 ring-amber-500/20 shadow-lg rounded-lg text-white hover:bg-white/20 transition-all duration-200;
  }
</style>

