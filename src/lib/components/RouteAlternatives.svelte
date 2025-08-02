<script lang="ts">
  import type { Route } from '$lib/types';
  
  interface Props {
    routes: Route[];
    selectedRoute: Route | null;
    onSelectRoute: (route: Route) => void;
    loading?: boolean;
    class?: string;
  }
  
  let { routes = [], selectedRoute, onSelectRoute, loading = false, class: className = '' }: Props = $props();
  
  function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
  }
  
  function getRouteLabel(index: number): { name: string; description: string; color: string } {
    const labels = [
      { name: 'Fastest Route', description: 'Via Interstate highways', color: 'text-blue-300' },
      { name: 'Scenic Route', description: 'Through state highways', color: 'text-green-300' },
      { name: 'Avoid Tolls', description: 'No toll roads', color: 'text-purple-300' }
    ];
    return labels[index] || { name: `Route ${index + 1}`, description: 'Alternative route', color: 'text-gray-300' };
  }
  
  function getDifficultyColor(difficulty?: Route['difficulty']): string {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'challenging': return 'text-red-400';
      default: return 'text-gray-400';
    }
  }
  
  function getDifficultyIcon(difficulty?: Route['difficulty']): string {
    switch (difficulty) {
      case 'easy': return '🟢';
      case 'moderate': return '🟡';
      case 'challenging': return '🔴';
      default: return '⚪';
    }
  }
  
  function getRouteTypeIcon(routeType?: Route['routeType']): string {
    switch (routeType) {
      case 'interstate': return '🛣️';
      case 'scenic': return '🌄';
      case 'backcountry': return '🏞️';
      default: return '📍';
    }
  }
</script>

<div class="p-4 {className}" style="background-color: rgba(255, 255, 255, 0.1); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 8px 32px 0 rgba(255, 255, 255, 0.05); border-radius: 1rem;">
  <h3 class="mb-4 text-lg font-bold text-white">Route Options</h3>
  
  {#if loading}
    <div class="flex items-center justify-center py-8">
      <div class="text-center">
        <svg class="animate-spin h-8 w-8 text-amber-500 mx-auto mb-2" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <p class="text-sm text-white/70">Calculating routes...</p>
      </div>
    </div>
  {:else if routes.length === 0}
    <div class="text-center py-6">
      <span class="text-4xl block mb-2">🗺️</span>
      <p class="text-white/70 text-sm">Add waypoints to calculate routes</p>
    </div>
  {:else}
    <div class="space-y-3">
      {#each routes as route, index}
        {@const routeInfo = getRouteLabel(index)}
        <button
          onclick={() => onSelectRoute(route)}
          class="w-full text-left p-4 rounded-lg transition-all duration-200 hover:scale-[1.02]
                 {selectedRoute?.id === route.id 
                   ? 'bg-amber-500/20 ring-2 ring-amber-400 shadow-lg' 
                   : 'bg-white/10 hover:bg-white/20 hover:shadow-md'}"
        >
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center space-x-2 mb-1">
                <span class="text-lg">{getRouteTypeIcon(route.routeType)}</span>
                <h4 class="font-semibold {routeInfo.color}">{routeInfo.name}</h4>
                {#if route.difficulty}
                  <span class="text-xs {getDifficultyColor(route.difficulty)} flex items-center space-x-1">
                    <span>{getDifficultyIcon(route.difficulty)}</span>
                    <span class="capitalize">{route.difficulty}</span>
                  </span>
                {/if}
              </div>
              <p class="text-xs text-white/60 mb-3">{routeInfo.description}</p>
              
              <div class="flex items-center space-x-4 text-sm">
                <span class="flex items-center space-x-1">
                  <svg class="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
                  </svg>
                  <span class="font-medium text-white">{route.distance} mi</span>
                </span>
                <span class="flex items-center space-x-1">
                  <svg class="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                  </svg>
                  <span class="font-medium text-white">{formatDuration(route.duration)}</span>
                </span>
                {#if route.elevation}
                  <span class="flex items-center space-x-1">
                    <svg class="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
                    </svg>
                    <span class="font-medium text-white">+{Math.round(route.elevation.gain)}ft</span>
                  </span>
                {/if}
              </div>
              
              <!-- Warnings -->
              {#if route.warnings && route.warnings.length > 0}
                <div class="mt-2">
                  {#each route.warnings.slice(0, 2) as warning}
                    <div class="text-xs text-yellow-300 bg-yellow-500/20 rounded px-2 py-1 mb-1">
                      ⚠️ {warning}
                    </div>
                  {/each}
                  {#if route.warnings.length > 2}
                    <div class="text-xs text-white/50">
                      +{route.warnings.length - 2} more warnings
                    </div>
                  {/if}
                </div>
              {/if}
            </div>
            
            <div class="ml-3 flex flex-col items-center">
              {#if selectedRoute?.id === route.id}
                <div class="mb-1">
                  <svg class="w-5 h-5 text-amber-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                  </svg>
                </div>
              {/if}
              <div class="text-right">
                <div class="text-xs text-white/50">#{index + 1}</div>
              </div>
            </div>
          </div>
        </button>
      {/each}
    </div>
    
    <!-- Route Summary -->
    {#if selectedRoute}
      <div class="mt-4 pt-4 border-t border-white/10">
        <div class="text-xs text-white/70 mb-2">Selected: {selectedRoute.name}</div>
        <div class="flex items-center justify-between">
          <div class="flex items-center space-x-4 text-xs">
            <span class="text-white/80">{selectedRoute.distance} miles</span>
            <span class="text-white/80">{formatDuration(selectedRoute.duration)}</span>
            {#if selectedRoute.elevation}
              <span class="text-white/80">+{Math.round(selectedRoute.elevation.gain)}ft elevation</span>
            {/if}
          </div>
          <div class="text-xs text-white/60">
            {selectedRoute.waypoints.length} stops
          </div>
        </div>
      </div>
    {/if}
  {/if}
</div>
