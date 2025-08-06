<script lang="ts">
  import { onMount } from 'svelte';
  import SouthwestMap from '$lib/components/SouthwestMap.svelte';
  import GlassPOIPanel from '$lib/components/GlassPOIPanel.svelte';
  import POIFilter from '$lib/components/POIFilter.svelte';
  import type { ActionData } from './$types';

  let { form }: { form: ActionData } = $props();

  let mapComponent: SouthwestMap;
  let mapReady = $state(false);
  let mapboxgl: any;
  let mapInstance: any;
  
  // POI State Management
  let selectedCategories: string[] = ['national_park', 'attraction', 'camping'];
  let poiRadius = 10000; // 10km in meters
  let showPOIPanel = $state(false);
  let poiMarkers: any[] = [];
  
  // Extract POIs from form data (using $derived for Svelte 5 runes)
  let availablePOIs = $derived(form?.pois || []);
  
  // Filter POIs based on selected categories
  let filteredPOIs = $derived(availablePOIs.filter((poi: any) => 
    selectedCategories.length === 0 || selectedCategories.includes(poi.category)
  ));
  
  // Show POI panel when POIs are available
  $effect(() => {
    showPOIPanel = availablePOIs.length > 0;
  });

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
    if (mapInstance && mapboxgl && filteredPOIs.length > 0) {
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
      <div class="lg:col-span-2 relative">
        <SouthwestMap
          bind:this={mapComponent}
          onMapLoad={onMapLoad}
          onLocationClick={handleLocationClick}
          route={form?.route}
          class="h-96 lg:h-[600px]"
        />
        
        <!-- POI Filter Overlay (when POIs are available) -->
        {#if showPOIPanel}
          <div class="absolute top-4 left-4 right-4 lg:right-auto lg:w-80 z-20">
            <POIFilter
              selectedCategories={selectedCategories}
              onCategoryToggle={handleCategoryToggle}
              radius={poiRadius}
              onRadiusChange={handleRadiusChange}
              onApplyFilters={handleApplyFilters}
              class="mb-4"
            />
          </div>
        {/if}
      </div>
    </div>
    
    <!-- POI Panel (when POIs are available) -->
    {#if showPOIPanel}
      <div class="container mx-auto p-4 pt-0">
        <div class="glass-panel p-4">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-lg font-semibold text-white">Points of Interest</h2>
            <div class="text-sm text-white/70">
              {filteredPOIs.length} locations found along your route
            </div>
          </div>
          
          <div class="max-h-64 overflow-y-auto">
            <GlassPOIPanel
              pois={filteredPOIs.map(poi => ({
                id: poi.id,
                name: poi.name,
                description: poi.description,
                coordinates: poi.coordinates,
                category: [poi.category],
                rating: poi.rating,
                distance: poi.distance / 1000, // Convert to km
                tags: poi.properties?.isNationalPark ? ['national park'] : ['attraction']
              }))}
              onPOISelect={handlePOISelect}
              selectedCategories={selectedCategories}
              onCategoryFilter={(cats) => { selectedCategories = cats; }}
              compact={true}
              maxItems={20}
              class="h-full"
            />
          </div>
        </div>
      </div>
      
      <!-- Success Notification -->
      <div class="fixed top-20 right-4 z-30 animate-fade-in">
        <div class="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
          ✅ Found {availablePOIs.length} POIs along your route!
        </div>
      </div>
    {/if}
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
