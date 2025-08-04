<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  
let mapboxgl: any;
let Map: any, NavigationControl: any;
  
  import { SOUTHWEST_MAP_CONFIG, getSeasonalConfig, MAPBOX_MAPS_CONFIG } from '$lib/map/config';
  import { isInSouthwestRegion } from '$lib/config/region';
  import { config } from '$lib/config/env';
  
  interface Props {
    class?: string;
    onMapClick?: (coords: { lat: number; lng: number }) => void;
    onMapLoad?: (map: Map) => void;
    waypoints?: Array<{ lat: number; lng: number; name: string; icon?: string }>;
    route?: GeoJSON.Feature<GeoJSON.LineString>;
    pois?: Array<{ lat: number; lng: number; name: string; category: string }>;
  }
  
  let {
    class: className = '',
    onMapClick,
    onMapLoad,
    waypoints = [],
    route,
    pois = []
  }: Props = $props();
  
  let mapContainer: HTMLDivElement;
  let map: Map | null = null;
  
  // Reactive state using Svelte 5 runes
  let center = $state(SOUTHWEST_MAP_CONFIG.defaults.center as [number, number]);
  let zoom = $state(SOUTHWEST_MAP_CONFIG.defaults.zoom!);
  let pitch = $state(0);
  let bearing = $state(0);
  
  // Lock mechanism to prevent reactivity loops
  let isUpdatingFromSvelte = false;
  
  // Get current seasonal configuration
  const seasonalConfig = getSeasonalConfig(new Date().getMonth());

  onMount(async () => {
    if (!browser) return;

    mapboxgl = await import('mapbox-gl');
    await import('mapbox-gl/dist/mapbox-gl.css');

    const accessToken = "pk.eyJ1IjoiaW5waGlsdHJhdGlvbiIsImEiOiJjbWR3M29xMm8xd25mMm1zNjJzMm9nYTh0In0.-nsVR925zw7hNjISo-QB6Q";
    console.log('🔑 Access Token from env:', accessToken ? 'Available' : 'Missing');

    if (!accessToken) {
      console.error('❌ No MapBox access token found!');
      return;
    }

    mapboxgl.default.accessToken = accessToken;

    map = new mapboxgl.default.Map({
      container: mapContainer,
      style: 'mapbox://styles/mapbox/outdoors-v11',
      center: [-115.0, 36.0], // Las Vegas center
      zoom: 6,
      antialias: true
    });

    console.log('🗺️ Simple test map initialized');

    map.addControl(new mapboxgl.default.NavigationControl(), 'top-right');
    
    map.on('load', () => {
      console.log('✅ Simple test map loaded successfully');
    });

    map.on('error', (e) => {
      console.error('❌ Simple test map error:', e);
    });

    if (onMapLoad) onMapLoad(map);

    map.on('click', (e) => {
      const { lat, lng } = e.lngLat;

      if (isInSouthwestRegion(lat, lng)) {
        if (onMapClick) onMapClick({ lat, lng });
      } else {
        console.warn('Clicked outside the southwest region');
      }
    });
  });

  onDestroy(() => {
    if (map) {
      map.remove();
      map = null;
    }
  });

  $effect(() => {
    if (!map) return;

    isUpdatingFromSvelte = true;

    map.flyTo({
      center: center,
      zoom: zoom,
      pitch: pitch,
      bearing: bearing,
      duration: 1500
    });

    setTimeout(() => {
      isUpdatingFromSvelte = false;
    }, 1600);
  });
  
  // Reactive updates for waypoints and route
  $effect(() => {
    if (map && waypoints.length > 0) {
      updateWaypoints();
    }
  });
  
  $effect(() => {
    if (map && route) {
      updateRoute();
    }
  });
  
  function updateWaypoints() {
    if (!map) return;
    
    // Remove existing waypoint markers
    if (map.getSource('waypoints')) {
      map.removeLayer('waypoints');
      map.removeSource('waypoints');
    }
    
    // Add waypoint markers
    const waypointFeatures = waypoints.map((wp, index) => ({
      type: 'Feature' as const,
      geometry: {
        type: 'Point' as const,
        coordinates: [wp.lng, wp.lat]
      },
      properties: {
        name: wp.name,
        icon: wp.icon || '📍',
        order: index
      }
    }));
    
    map.addSource('waypoints', {
      type: 'geojson',
      data: {
        type: 'FeatureCollection',
        features: waypointFeatures
      }
    });
    
    map.addLayer({
      id: 'waypoints',
      type: 'circle',
      source: 'waypoints',
      paint: {
        'circle-radius': 8,
        'circle-color': '#FF6B35',
        'circle-stroke-color': '#ffffff',
        'circle-stroke-width': 2
      }
    });
  }
  
  function updateRoute() {
    if (!map || !route) return;
    
    // Remove existing route
    if (map.getSource('route')) {
      map.removeLayer('route');
      map.removeSource('route');
    }
    
    // Add route line
    map.addSource('route', {
      type: 'geojson',
      data: route
    });
    
    map.addLayer({
      id: 'route',
      type: 'line',
      source: 'route',
      paint: {
        'line-color': '#FF6B35',
        'line-width': 4,
        'line-opacity': 0.8
      }
    });
  }
</script>

<div class="map-container {className}">
  <!-- Map Container -->
  <div 
    bind:this={mapContainer} 
    class="h-full w-full rounded-2xl overflow-hidden ring-1 ring-white/20"
    style="min-height: 400px; height: 100%; position: relative;"
  ></div>
  
  <!-- Southwest Region Indicator -->
  <div class="absolute top-4 left-4 z-10">
    <div class="p-3 space-y-2 glass-panel">
      <div class="flex items-center space-x-2">
        <span class="text-lg">🌵</span>
        <span class="text-sm font-semibold text-white">Southwest USA</span>
      </div>
      <div class="text-xs text-white/70">
        CA • NV • UT • AZ
      </div>
      {#if seasonalConfig.heatWarningColor}
        <div class="warning-heat p-2 rounded text-xs">
          ☀️ Summer Heat Advisory
        </div>
      {/if}
      {#if seasonalConfig.snowWarningColor}
        <div class="warning-snow p-2 rounded text-xs">
          ❄️ Winter Conditions
        </div>
      {/if}
    </div>
  </div>
  
  <!-- Terrain Legend -->
  <div class="absolute bottom-4 left-4 z-10">
    <div class="p-3 glass-panel">
      <div class="text-xs font-semibold text-white mb-2">Elevation</div>
      <div class="space-y-1">
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded" style="background-color: #F4E4C1"></div>
          <span class="text-xs text-white/70">Sea Level</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded" style="background-color: #DEB887"></div>
          <span class="text-xs text-white/70">Desert</span>
        </div>
        <div class="flex items-center space-x-2">
          <div class="w-3 h-3 rounded" style="background-color: #A0522D"></div>
          <span class="text-xs text-white/70">Mountains</span>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Performance Indicator -->
  <div class="absolute top-4 right-4 z-10">
    <div class="glass-panel p-2 text-xs text-white/70">
      <div class="flex items-center space-x-1">
        <div class="w-2 h-2 rounded-full bg-green-400"></div>
        <span>Terrain Active</span>
      </div>
    </div>
  </div>
</div>

<style>
  .map-container {
    position: relative;
    width: 100%;
    height: 100%;
    min-height: 400px;
    overflow: hidden;
    border-radius: 1rem;
    z-index: 1;
  }
  
  .glass-panel {
    background: rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(12px);
    border: 1px solid rgba(255, 255, 255, 0.2);
    border-radius: 1rem;
    box-shadow: 0 8px 32px 0 rgba(255, 255, 255, 0.05);
    z-index: 10;
  }
  
  :global(.mapboxgl-map) {
    font-family: 'Inter', system-ui, sans-serif;
    position: relative;
    height: 100%;
  }  
  :global(.mapboxgl-canvas) {
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: 100%;
    opacity: 1 !important;
    visibility: visible !important;
    z-index: 10;
    border-radius: 1rem;
  }
  
  :global(.mapboxgl-ctrl-group) {
    background: rgba(255, 255, 255, 0.1) !important;
    backdrop-filter: blur(12px) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 1rem !important;
    box-shadow: 0 8px 32px 0 rgba(255, 255, 255, 0.05) !important;
  }
  
  :global(.mapboxgl-ctrl button) {
    color: white !important;
    background-color: transparent !important;
  }
  
  :global(.mapboxgl-ctrl button:hover) {
    background-color: rgba(255, 255, 255, 0.2) !important;
  }
  
  :global(.mapboxgl-popup-content) {
    background: rgba(255, 255, 255, 0.1) !important;
    backdrop-filter: blur(12px) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 1rem !important;
    box-shadow: 0 8px 32px 0 rgba(255, 255, 255, 0.05) !important;
    color: white !important;
    padding: 1rem !important;
    font-size: 0.875rem !important;
    max-width: 18rem !important;
  }
</style>
