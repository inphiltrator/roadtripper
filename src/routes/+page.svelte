<script lang="ts">
  import { onMount } from 'svelte';
  import SouthwestMap from '$lib/components/SouthwestMap.svelte';
  import GlassPOIPanel from '$lib/components/GlassPOIPanel.svelte';
  import POIFilter from '$lib/components/POIFilter.svelte';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();

  let mapComponent: SouthwestMap;
  let mapReady = $state(false);
  let mapboxgl = $state(null as any);
  let mapInstance = $state(null as any);
  
  // POI State Management  
  let selectedCategories = $state(['restaurant', 'gas_station', 'hotel']); // Default to MapBox categories
  let poiRadius = $state(10000); // 10km in meters
  let showPOIPanel = $state(true); // Always show POI panel
  let poiMarkers: any[] = [];
  let loadingPOIs = $state(false);
  let hasLoadedInitialPOIs = $state(false); // Prevent infinite loop
  
  // Extract POIs from form data or default to Kanab-area POIs
  let availablePOIs = $derived(form?.pois || []);
  
  // Filter POIs based on selected categories
  let filteredPOIs = $derived(availablePOIs.filter((poi: any) => {
    // If no categories selected, show all POIs
    if (selectedCategories.length === 0) return true;
    
    // Debug logging for first POI to understand structure
    if (availablePOIs.length > 0 && poi === availablePOIs[0]) {
      console.log('🔍 POI structure for filtering:', {
        name: poi.name,
        category: poi.category,
        categories: poi.categories,
        poi_category: poi.poi_category,
        selectedCategories
      });
    }
    
    // Check various category formats
    return selectedCategories.some(cat => {
      // Check if category is a string that matches exactly
      if (typeof poi.category === 'string' && poi.category === cat) return true;
      
      // Check if category is an array that includes the selected category
      if (Array.isArray(poi.category) && poi.category.includes(cat)) return true;
      
      // Check categories array (for MapBox API)
      if (Array.isArray(poi.categories) && poi.categories.includes(cat)) return true;
      
      // Check poi_category array (for MapBox API)
      if (Array.isArray(poi.poi_category) && poi.poi_category.includes(cat)) return true;
      
      // Check poi_category as string
      if (typeof poi.poi_category === 'string' && poi.poi_category === cat) return true;
      
      return false;
    });
  }));
  
  // Load default POIs around Kanab ONLY ONCE when first loading
  $effect(() => {
    if (availablePOIs.length === 0 && !loadingPOIs && !hasLoadedInitialPOIs) {
      loadDefaultPOIs();
    }
  });
  
  // Load POIs around Kanab, UT as default
  async function loadDefaultPOIs() {
    loadingPOIs = true;
    hasLoadedInitialPOIs = true; // Mark as loaded to prevent infinite loop
    try {
      const response = await fetch('/api/pois/around-location', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          location: 'Kanab, UT',
          radius: poiRadius,
          categories: selectedCategories,
          limit: 10
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        // Update form data to include default POIs
        if (form) {
          form.pois = data.pois || [];
        }
      }
    } catch (error) {
      console.error('Error loading default POIs:', error);
    } finally {
      loadingPOIs = false;
    }
  }

  onMount(async () => {
    if (typeof window !== 'undefined') {
      mapboxgl = await import('mapbox-gl');
    }
  });

  function onMapLoad(map: any) {
    console.log('🗺️ Map loaded and ready');
    mapInstance = map;
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
  
  // Effect for POI markers
  $effect(() => {
    console.log('🗺️ Marker effect triggered:', { 
      mapInstance: !!mapInstance, 
      mapboxgl: !!mapboxgl, 
      filteredPOIsLength: filteredPOIs.length,
      firstPOI: filteredPOIs[0] ? { name: filteredPOIs[0].name, coordinates: filteredPOIs[0].coordinates } : 'none'
    });
    
    if (mapInstance && mapboxgl && filteredPOIs.length > 0) {
      console.log(`🎯 Adding ${filteredPOIs.length} POI markers to map`);
      
      // Clear existing POI markers
      poiMarkers.forEach(marker => marker.remove());
      poiMarkers = [];
      
      // Add new POI markers
      for (const poi of filteredPOIs) {
        const [lng, lat] = poi.coordinates;
        
        // Create POI marker
        const marker = new mapboxgl.default.Marker({
          color: getCategoryColor(poi.category),
          scale: 0.8
        })
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.default.Popup({ offset: 25 })
            .setHTML(
              `<div class="p-2">
                <h3 class="font-semibold text-sm">${poi.name}</h3>
                <p class="text-xs text-gray-600 mt-1">${poi.description}</p>
                <div class="text-xs text-gray-500 mt-1">
                  <span class="inline-block bg-blue-100 px-2 py-1 rounded">${poi.category}</span>
                  ${poi.distance ? `<span class="ml-2">${(poi.distance/1000).toFixed(1)}km from route</span>` : ''}
                </div>
              </div>`
            )
        )
        .addTo(mapInstance);
        
        poiMarkers.push(marker);
      }
    }
  });
  
  // Helper function to get color for POI category
  function getCategoryColor(category: string): string {
    const colors = {
      'restaurant': '#ef4444',     // red
      'gas_station': '#6b7280',    // gray  
      'hotel': '#06b6d4',          // cyan
      'park': '#22c55e',          // green
      'museum': '#8b5cf6',        // violet
      'casino': '#f59e0b',        // amber
      'national_park': '#22c55e', // green
      'state_park': '#84cc16',    // lime
      'camping': '#f59e0b',       // amber
      'dining': '#ef4444',        // red
      'attraction': '#8b5cf6',    // violet
      'lodging': '#06b6d4',       // cyan
      'fuel': '#6b7280'          // gray
    };
    return colors[category as keyof typeof colors] || '#8b5cf6';
  }
  
  // Helper function to get display name for categories
  function getCategoryDisplayName(category: string): string {
    const displayNames = {
      'restaurant': '🍽️ Restaurants',
      'gas_station': '⛽ Gas Stations', 
      'hotel': '🏨 Hotels',
      'park': '🏞️ Parks',
      'museum': '🏛️ Museums',
      'casino': '🎰 Casinos'
    };
    return displayNames[category as keyof typeof displayNames] || category;
  }
  
  // POI Event Handlers
  function handleCategoryToggle(category: string) {
    if (selectedCategories.includes(category)) {
      selectedCategories = selectedCategories.filter(c => c !== category);
    } else {
      selectedCategories = [...selectedCategories, category];
    }
  }
  
  function handleRadiusChange(newRadius: number) {
    poiRadius = newRadius;
    // TODO: Re-fetch POIs with new radius
  }
  
  function handleApplyFilters() {
    // Filters are applied automatically via reactive statements
    console.log('Filters applied:', { selectedCategories, poiRadius });
  }
  
  function handlePOISelect(poi: any) {
    if (mapInstance) {
      // Fly to POI location
      mapInstance.flyTo({
        center: poi.coordinates,
        zoom: 14,
        duration: 1000
      });
      
      // Find and open the corresponding marker popup
      const marker = poiMarkers.find(m => {
        const markerLngLat = m.getLngLat();
        return Math.abs(markerLngLat.lng - poi.coordinates[0]) < 0.001 && 
               Math.abs(markerLngLat.lat - poi.coordinates[1]) < 0.001;
      });
      
      if (marker && marker.getPopup()) {
        marker.togglePopup();
      }
    }
  }

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

  <!-- Route Planning Section -->
  <div class="container mx-auto p-4">
    <div class="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                  placeholder="e.g., Kanab, UT"
                />
              </div>
              <div>
                <label for="end" class="block text-sm font-medium text-white/80 mb-1">End</label>
                <input
                  type="text"
                  name="end"
                  id="end"
                  class="w-full bg-black/20 text-white border border-white/20 rounded-lg p-2 focus:ring-amber-500 focus:border-amber-500"
                  placeholder="e.g., Fredonia, AZ"
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
      
      <!-- Map Section -->
      <div class="lg:col-span-3 relative">
        <SouthwestMap
          bind:this={mapComponent}
          onMapLoad={onMapLoad}
          onLocationClick={handleLocationClick}
          route={form?.route}
          class="h-96 lg:h-[500px]"
        />
        
        <!-- Success Notification -->
        {#if form?.success}
          <div class="absolute top-4 right-4 z-30 animate-fade-in">
            <div class="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
              ✅ Found {availablePOIs.length} POIs {form?.route ? 'along your route!' : 'around Kanab!'}
            </div>
          </div>
        {/if}
      </div>
    </div>
  </div>
  
  <!-- POI Section - Always Visible -->
  <div class="container mx-auto px-4 pb-4">
    <!-- Horizontal POI Filters -->
    <div class="glass-panel p-4 mb-4">
      <div class="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div class="flex items-center gap-2">
          <h3 class="text-lg font-semibold text-white">POI Filters</h3>
          <span class="text-sm text-white/60">({filteredPOIs.length} locations)</span>
        </div>
        
        <!-- Horizontal Category Filters -->
        <div class="flex flex-wrap gap-2">
          {#each ['restaurant', 'gas_station', 'hotel', 'park', 'museum', 'casino'] as category}
            <button
              type="button"
              class="px-3 py-1 rounded-full text-sm transition-all duration-200 {
                selectedCategories.includes(category) 
                  ? 'bg-amber-500/80 text-white ring-2 ring-amber-400' 
                  : 'bg-white/10 text-white/70 hover:bg-white/20'
              }"
              onclick={() => handleCategoryToggle(category)}
            >
              {getCategoryDisplayName(category)}
            </button>
          {/each}
        </div>
        
        <!-- Radius Selector -->
        <div class="flex items-center gap-2">
          <span class="text-sm text-white/70">Radius:</span>
          <select
            bind:value={poiRadius}
            class="bg-black/20 text-white text-sm border border-white/20 rounded px-2 py-1"
          >
            <option value={5000}>5km</option>
            <option value={10000}>10km</option>
            <option value={20000}>20km</option>
            <option value={50000}>50km</option>
          </select>
        </div>
      </div>
    </div>
    
    <!-- POI Results Panel -->
    <div class="glass-panel p-4">
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-lg font-semibold text-white">Points of Interest</h2>
        <div class="text-sm text-white/70">
          {#if loadingPOIs}
            Loading POIs...
          {:else}
            {filteredPOIs.length} of {availablePOIs.length} locations 
            {#if form?.route}
              along your route
            {:else}
              around Kanab, UT
            {/if}
          {/if}
        </div>
      </div>
      
      {#if loadingPOIs}
        <div class="flex items-center justify-center h-32">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-500"></div>
          <span class="ml-3 text-white/70">Loading POIs...</span>
        </div>
      {:else if filteredPOIs.length > 0}
        <div class="max-h-80 overflow-y-auto">
          <GlassPOIPanel
            pois={filteredPOIs.slice(0, 10).map(poi => ({
              id: poi.id,
              name: poi.name,
              description: poi.description || poi.address,
              coordinates: poi.coordinates,
              category: Array.isArray(poi.category) ? poi.category : [poi.category],
              rating: poi.rating || 0,
              distance: poi.distance ? poi.distance / 1000 : 0, // Convert to km
              tags: poi.poi_category || [poi.category]
            }))}
            onPOISelect={handlePOISelect}
            selectedCategories={selectedCategories}
            onCategoryFilter={(cats) => { selectedCategories = cats; }}
            compact={true}
            maxItems={10}
            class="h-full"
          />
        </div>
      {:else}
        <div class="text-center py-8 text-white/60">
          <span class="text-4xl mb-2 block">🔍</span>
          <p>No POIs found for the selected categories.</p>
          <p class="text-sm mt-2">Try selecting different categories or increasing the search radius.</p>
        </div>
      {/if}
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
  
  .animate-fade-in {
    animation: fadeIn 0.5s ease-in-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
</style>
