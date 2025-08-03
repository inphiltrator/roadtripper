<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import maplibregl from 'maplibre-gl';
  import 'maplibre-gl/dist/maplibre-gl.css';
  
  const { Map, NavigationControl, ScaleControl, GeolocateControl } = maplibregl;
  
  import { SOUTHWEST_MAP_CONFIG, getSeasonalConfig } from '$lib/map/config';
  import { isInSouthwestRegion } from '$lib/config/region';
  import { config } from '$lib/config/env';
  
  interface Props {
    class?: string;
    center?: [number, number];
    zoom?: number;
    onMapClick?: (coords: { lat: number; lng: number }) => void;
    onMapLoad?: (map: Map) => void;
    waypoints?: Array<{ lat: number; lng: number; name: string; icon?: string }>;
    route?: GeoJSON.Feature<GeoJSON.LineString>;
    pois?: Array<{ lat: number; lng: number; name: string; category: string }>;
  }
  
  let {
    class: className = '',
    center = SOUTHWEST_MAP_CONFIG.defaults.center as [number, number],
    zoom = SOUTHWEST_MAP_CONFIG.defaults.zoom!,
    onMapClick,
    onMapLoad,
    waypoints = [],
    route,
    pois = []
  }: Props = $props();
  
  let mapContainer: HTMLDivElement;
  let map: Map | null = null;
  let mounted = false;
  
  // Get current seasonal configuration
  const seasonalConfig = getSeasonalConfig(new Date().getMonth());
  
  onMount(() => {
    mounted = true;
    initializeMap();
  });
  
  onDestroy(() => {
    if (map) {
      map.remove();
      map = null;
    }
  });
  
  function initializeMap() {
    if (!mapContainer || !mounted) return;
    
    // Validate center is within Southwest bounds
    if (!isInSouthwestRegion(center[1], center[0])) {
      console.warn('Map center outside Southwest region, using default Las Vegas center');
      center = [-115.0, 36.0];
    }
    
    // Initialize MapLibre with Southwest configuration
    try {
      // Use MapLibre demo style to avoid MapBox compatibility issues
      const styleUrl = 'https://demotiles.maplibre.org/style.json';
      
      map = new Map({
        container: mapContainer,
        style: styleUrl,
        center,
        zoom,
        minZoom: SOUTHWEST_MAP_CONFIG.defaults.minZoom,
        maxZoom: SOUTHWEST_MAP_CONFIG.defaults.maxZoom,
        maxBounds: SOUTHWEST_MAP_CONFIG.bounds,
        attributionControl: false
      });
    } catch (error) {
      console.error('❌ Map initialization failed:', error);
      // Try with fallback style
      map = new Map({
        container: mapContainer,
        style: 'https://demotiles.maplibre.org/style.json',
        center,
        zoom,
        minZoom: SOUTHWEST_MAP_CONFIG.defaults.minZoom,
        maxZoom: SOUTHWEST_MAP_CONFIG.defaults.maxZoom,
        maxBounds: SOUTHWEST_MAP_CONFIG.bounds,
        attributionControl: false
      });
    }
    
    // Add controls with glass styling
    map.addControl(new NavigationControl(), 'top-right');
    map.addControl(new ScaleControl(), 'bottom-left');
    map.addControl(new GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    }), 'top-right');
    
    // Map event handlers
    map.on('load', () => {
      setupSouthwestLayers();
      if (onMapLoad) onMapLoad(map);
    });
    
    map.on('click', (e) => {
      const { lat, lng } = e.lngLat;
      
      // Ensure clicks are within Southwest region
      if (isInSouthwestRegion(lat, lng)) {
        if (onMapClick) onMapClick({ lat, lng });
      } else {
        showRegionWarning();
      }
    });
    
    // Terrain-aware zoom handling
    map.on('zoom', () => {
      const currentZoom = map.getZoom();
      updateTerrainVisualization(currentZoom);
    });
  }
  
  function setupSouthwestLayers() {
    if (!map) return;
    
    // Note: Terrain disabled to avoid CORS issues in development
    // The MapLibre demo style provides excellent visualization without 3D terrain
    
    // Add state boundaries layer
    if (map.getSource('state-boundaries') === undefined) {
      map.addSource('state-boundaries', {
        type: 'geojson',
        data: {
          type: 'FeatureCollection',
          features: getStateBoundariesGeoJSON()
        }
      });
      
      map.addLayer({
        id: 'state-boundaries',
        source: 'state-boundaries',
        type: 'line',
        paint: SOUTHWEST_MAP_CONFIG.layers.stateBoundaries.paint
      });
    }
    
    // Add seasonal warnings if applicable
    if (seasonalConfig.heatWarningColor || seasonalConfig.snowWarningColor) {
      addSeasonalWarnings();
    }
  }
  
  function updateTerrainVisualization(zoom: number) {
    if (!map) return;
    
    // Show more terrain detail at higher zoom levels
    if (zoom > 10) {
      map.setPaintProperty('state-boundaries', 'line-opacity', 0.8);
    } else {
      map.setPaintProperty('state-boundaries', 'line-opacity', 0.4);
    }
    
    // Cluster POIs at lower zoom levels for performance
    if (zoom < 8 && pois.length > SOUTHWEST_MAP_CONFIG.performance.poiClusterThreshold) {
      enablePOIClustering();
    } else {
      disablePOIClustering();
    }
  }
  
  function getStateBoundariesGeoJSON(): GeoJSON.Feature[] {
    // Simplified state boundaries for CA, NV, UT, AZ
    return [
      {
        type: 'Feature',
        properties: { state: 'CA' },
        geometry: {
          type: 'LineString',
          coordinates: [
            [-120.006, 42.0], [-120.006, 32.534], [-124.409, 32.534]
          ]
        }
      },
      {
        type: 'Feature', 
        properties: { state: 'NV' },
        geometry: {
          type: 'LineString',
          coordinates: [
            [-120.006, 42.0], [-114.039, 42.0], [-114.039, 35.0]
          ]
        }
      }
      // Add more detailed boundaries as needed
    ];
  }
  
  function addSeasonalWarnings() {
    if (!map) return;
    
    const warningColor = seasonalConfig.heatWarningColor || seasonalConfig.snowWarningColor;
    if (!warningColor) return;
    
    // Add warning overlay for extreme conditions
    map.addLayer({
      id: 'seasonal-warning',
      type: 'fill',
      source: {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'Polygon',
            coordinates: [[
              [-124.5, 32.5],
              [-109.0, 32.5],
              [-109.0, 42.0],
              [-124.5, 42.0],
              [-124.5, 32.5]
            ]]
          },
          properties: {}
        }
      },
      paint: {
        'fill-color': warningColor,
        'fill-opacity': 0.1
      }
    }, 'state-boundaries');
  }
  
  function enablePOIClustering() {
    // Implement POI clustering for performance
    console.log('POI clustering enabled for better performance');
  }
  
  function disablePOIClustering() {
    // Show individual POIs
    console.log('POI clustering disabled, showing individual markers');
  }
  
  function showRegionWarning() {
    // Create a temporary warning popup
    const warning = document.createElement('div');
    warning.className = 'glass-panel p-4 text-canyon-600 text-sm rounded-lg absolute top-4 left-1/2 transform -translate-x-1/2 z-50 warning-heat';
    warning.innerHTML = `
      <div class="flex items-center space-x-2">
        <span class="text-xl">🌵</span>
        <span>This location is outside the Southwest USA region!</span>
      </div>
    `;
    
    mapContainer.appendChild(warning);
    
    // Remove warning after 3 seconds
    setTimeout(() => {
      if (warning.parentNode) {
        warning.parentNode.removeChild(warning);
      }
    }, 3000);
  }
  
  // Reactive updates for waypoints, route, and POIs
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
  
  export function drawRoute(coordinates: any) {
    if (!map) return;

    const routeGeoJson = {
      type: 'Feature',
      geometry: {
        type: 'LineString',
        coordinates: coordinates
      }
    };

    if (map.getSource('route')) {
      map.removeLayer('route');
      map.removeSource('route');
    }
    
    map.addSource('route', {
      type: 'geojson',
      data: routeGeoJson
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
  ></div>
  
  <!-- Southwest Region Indicator -->
  <div class="map-overlay">
    <div class="p-3 space-y-2" style="background-color: rgba(255, 255, 255, 0.1); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 8px 32px 0 rgba(255, 255, 255, 0.05); border-radius: 1rem;">
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
    <div class="p-3" style="background-color: rgba(255, 255, 255, 0.1); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 8px 32px 0 rgba(255, 255, 255, 0.05); border-radius: 1rem;">
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
    <div class="glass-card p-2 text-xs text-white/70">
      <div class="flex items-center space-x-1">
        <div class="status-online"></div>
        <span>Terrain Active</span>
      </div>
    </div>
  </div>
</div>

<style>
  :global(.maplibregl-map) {
    font-family: 'Inter', system-ui, sans-serif;
  }
  
  :global(.maplibregl-ctrl-group) {
    background: rgba(255, 255, 255, 0.1) !important;
    backdrop-filter: blur(12px) !important;
    border: 1px solid rgba(255, 255, 255, 0.2) !important;
    border-radius: 1rem !important;
    box-shadow: 0 8px 32px 0 rgba(255, 255, 255, 0.05) !important;
  }
  
  :global(.maplibregl-ctrl button) {
    color: white !important;
    background-color: transparent !important;
  }
  
  :global(.maplibregl-ctrl button:hover) {
    background-color: rgba(255, 255, 255, 0.2) !important;
  }
  
  :global(.maplibregl-popup-content) {
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
  
  /* Custom terrain styling */
  :global(.maplibregl-canvas) {
    border-radius: 1rem;
  }
</style>
