<script lang="ts">
  import { onMount, $effect } from 'svelte';
  import mapboxgl from 'mapbox-gl';
  import 'mapbox-gl/dist/mapbox-gl.css';
  import type { ActionData } from './$types';
  import { decodePolyline } from '$lib/utils/polyline';
  import GlassPOIPanel from '$lib/components/GlassPOIPanel.svelte';
  import POIFilter from '$lib/components/POIFilter.svelte';

  let { form }: { form: ActionData } = $props();

  let mapContainer: HTMLElement;
  let map: mapboxgl.Map;
  
  // POI State Management
  let selectedCategories: string[] = ['restaurant', 'gas_station', 'hotel'];
  let poiRadius = 10000; // 10km in meters
  let filteredPOIs: any[] = [];
  let showPOIPanel = false;
  let poiMarkers: mapboxgl.Marker[] = [];
  
  // Extract POIs from form data
  $: availablePOIs = form?.pois || [];
  
  // Filter POIs based on selected categories
  $: filteredPOIs = availablePOIs.filter((poi: any) => 
    selectedCategories.length === 0 || selectedCategories.includes(poi.category)
  );
  
  // Show POI panel when POIs are available
  $: showPOIPanel = availablePOIs.length > 0;

  onMount(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiaW5waGlsdHJhdGlvbiIsImEiOiJjbHcwdGFwZ2cwbWd3MmlvNW5zZGQ4M2NnIn0.n4w4o42n2EI4A4u6eArL6w'; // Token ist zu Demo zwecken hier und wird spaeter entfernt.

    map = new mapboxgl.Map({
      container: mapContainer,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-118.2437, 34.0522], // Los Angeles
      zoom: 6
    });

    return () => map.remove();
  });

  // Effect for route rendering
  $effect(() => {
    if (map && form?.success && form.route?.routes) {
      const googleRoute = form.route.routes[0];
      const coordinates = decodePolyline(googleRoute.polyline?.encodedPolyline || '');
      
      if (coordinates.length > 0) {
        const routeGeoJson: GeoJSON.Feature<GeoJSON.LineString> = {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates
          },
          properties: {}
        };

        const bounds = new mapboxgl.LngLatBounds();
        coordinates.forEach(point => bounds.extend(point));
        map.fitBounds(bounds, { padding: 50 });

        const source = map.getSource('route') as mapboxgl.GeoJSONSource;
        if (source) {
          source.setData(routeGeoJson);
        } else {
          map.addSource('route', {
            type: 'geojson',
            data: routeGeoJson
          });

          map.addLayer({
            id: 'route',
            type: 'line',
            source: 'route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': '#3887be',
              'line-width': 5,
              'line-opacity': 0.75
            }
          });
        }
      }
    }
  });
  
  // Effect for POI markers
  $effect(() => {
    if (map && filteredPOIs.length > 0) {
      // Clear existing POI markers
      poiMarkers.forEach(marker => marker.remove());
      poiMarkers = [];
      
      // Add new POI markers
      for (const poi of filteredPOIs) {
        const [lng, lat] = poi.coordinates;
        
        // Create POI marker
        const marker = new mapboxgl.Marker({
          color: getCategoryColor(poi.category),
          scale: 0.8
        })
        .setLngLat([lng, lat])
        .setPopup(
          new mapboxgl.Popup({ offset: 25 })
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
        .addTo(map);
        
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
      'national_park': '#22c55e',  // green
      'state_park': '#84cc16',     // lime
      'camping': '#f59e0b',        // amber
      'dining': '#ef4444',         // red
      'attraction': '#8b5cf6',     // violet
      'lodging': '#06b6d4',        // cyan
      'fuel': '#6b7280'           // gray
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
    if (map) {
      // Fly to POI location
      map.flyTo({
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
</script>

<svelte:head>
  <title>Trip Planner</title>
</svelte:head>

<div class="trip-planner h-screen w-screen flex flex-col relative">
  <!-- Header Controls -->
  <div class="controls p-4 bg-gray-100 z-10">
    <h1 class="text-xl font-bold mb-4">Southwest USA Roadtripper</h1>
    <form method="POST">
      <div class="flex space-x-4 mb-4">
        <input type="text" name="start" placeholder="Start (e.g. Los Angeles)" class="p-2 border rounded w-full" required>
        <input type="text" name="destination" placeholder="Destination (e.g. Las Vegas)" class="p-2 border rounded w-full" required>
        <button type="submit" class="bg-blue-500 text-white p-2 rounded whitespace-nowrap">Calculate Route</button>
      </div>
    </form>
    
    <!-- POI Filter - Always visible after first route calculation -->
    {#if form?.success}
      <div class="border-t pt-4">
        <POIFilter
          selectedCategories={selectedCategories}
          onCategoryToggle={handleCategoryToggle}
          radius={poiRadius}
          onRadiusChange={handleRadiusChange}
          onApplyFilters={handleApplyFilters}
          class="w-full"
        />
      </div>
    {/if}
  </div>
  
  <!-- Main Content Area -->
  <div class="flex-grow flex flex-col lg:flex-row relative">
    <!-- Map Container -->
    <div class="map-container flex-grow relative" bind:this={mapContainer}>
      <!-- Map displays route and POI markers -->
    </div>
    
    <!-- POI Panel (Desktop: Right sidebar, Mobile: Bottom) -->
    {#if showPOIPanel}
      <div class="poi-panel bg-gray-50 lg:w-96 lg:h-full h-64 lg:h-auto overflow-hidden flex flex-col">
        <div class="p-4 bg-gray-100 border-b">
          <h2 class="text-lg font-semibold text-gray-800">Points of Interest</h2>
          <p class="text-sm text-gray-600 mt-1">
            {filteredPOIs.length} locations found along your route
          </p>
        </div>
        <div class="flex-grow overflow-hidden">
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
    {/if}
  </div>
  
  <!-- Loading State -->
  {#if form?.success === false}
    <div class="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center z-30">
      <div class="bg-white rounded-lg p-6 max-w-sm mx-4">
        <div class="text-center">
          <div class="text-red-600 text-xl mb-2">⚠️</div>
          <h3 class="text-lg font-semibold mb-2">Route Calculation Failed</h3>
          <p class="text-sm text-gray-600 mb-4">
            {form?.error || 'Unable to calculate route. Please try different locations.'}
          </p>
          <button 
            onclick={() => { window.location.reload(); }}
            class="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  {/if}
  
  <!-- Success Notification -->
  {#if form?.success && availablePOIs.length > 0}
    <div class="absolute top-20 right-4 z-30 animate-fade-in">
      <div class="bg-green-500 text-white px-4 py-2 rounded-lg shadow-lg">
        ✅ Found {availablePOIs.length} POIs along your route!
      </div>
    </div>
  {/if}
</div>

<style>
  .animate-fade-in {
    animation: fadeIn 0.5s ease-in-out;
  }
  
  @keyframes fadeIn {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }
  
  @media (max-width: 1024px) {
    .poi-panel {
      order: 2;
    }
    .map-container {
      order: 1;
    }
  }
</style>

