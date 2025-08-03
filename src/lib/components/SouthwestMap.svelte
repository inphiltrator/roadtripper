<script lang="ts">
  import { onMount, onDestroy } from 'svelte';
  import { browser } from '$app/environment';
  
  let maplibregl: any;
  let Map: any, NavigationControl: any, ScaleControl: any, GeolocateControl: any;
  
  import { SOUTHWEST_MAP_CONFIG, getSeasonalConfig } from '$lib/map/config';
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
  
  // Reactive state using Svelte 5 runes (as recommended in docs)
  let center = $state(SOUTHWEST_MAP_CONFIG.defaults.center as [number, number]);
  let zoom = $state(SOUTHWEST_MAP_CONFIG.defaults.zoom!);
  let pitch = $state(0);
  let bearing = $state(0);
  
  // Lock mechanism to prevent reactivity loops (critical per docs section 3.3)
  let isUpdatingFromSvelte = false;
  
  // Get current seasonal configuration
  const seasonalConfig = getSeasonalConfig(new Date().getMonth());

  // Transform MapBox URLs for MapLibre GL JS compatibility
  const transformRequest = (url: string, resourceType: string) => {
    const accessToken = config.mapbox.accessToken;
    
    // Only transform mapbox:// URLs if we have an access token
    if (url.startsWith('mapbox://') && accessToken) {
      const path = url.replace('mapbox://', '');
      
      // Handle different resource types
      if (resourceType === 'Style') {
        // For styles, remove the 'styles/' prefix if present to avoid duplication
        const stylePath = path.startsWith('styles/') ? path.replace('styles/', '') : path;
        return {
          url: `https://api.mapbox.com/styles/v1/${stylePath}?access_token=${accessToken}`
        };
      } else if (resourceType === 'Source') {
        return {
          url: `https://api.mapbox.com/v4/${path}.json?access_token=${accessToken}`
        };
      } else if (resourceType === 'Tile') {
        return {
          url: `${url.replace('mapbox://', 'https://api.mapbox.com/v4/')}?access_token=${accessToken}`
        };
      } else if (resourceType === 'Glyphs') {
        return {
          url: `https://api.mapbox.com/fonts/v1/${path}?access_token=${accessToken}`
        };
      } else if (resourceType === 'SpriteImage') {
        return {
          url: `https://api.mapbox.com/styles/v1/${path.replace('/sprite', '')}/sprite.png?access_token=${accessToken}`
        };
      } else if (resourceType === 'SpriteJSON') {
        return {
          url: `https://api.mapbox.com/styles/v1/${path.replace('/sprite', '')}/sprite.json?access_token=${accessToken}`
        };
      }
    }
    
    return { url };
  };
  
  // Critical $effect for unidirectional data flow: Svelte -> Mapbox (docs section 3.1)
  $effect(() => {
    if (!map) return;
    
    // Get current values from map to avoid unnecessary updates
    const currentCenter = map.getCenter();
    const currentZoom = map.getZoom();
    const currentPitch = map.getPitch();
    const currentBearing = map.getBearing();
    
    // Compare and update only if there's a deviation (performance optimization)
    if (currentCenter.lng !== center[0] || currentCenter.lat !== center[1] ||
        currentZoom !== zoom || currentPitch !== pitch || currentBearing !== bearing) {
      
      isUpdatingFromSvelte = true; // Activate lock
      
      map.flyTo({
        center: center,
        zoom: zoom,
        pitch: pitch,
        bearing: bearing,
        duration: 1500 // Smooth animation
      });
      
      // Release lock after animation duration + buffer
      setTimeout(() => {
        isUpdatingFromSvelte = false;
      }, 1600); // Slightly longer than flyTo duration
    }
  });
  
  onMount(async () => {
    if (!browser) return; // Only run in browser
    
    // Dynamic import to avoid SSR issues
    maplibregl = await import('maplibre-gl');
    await import('maplibre-gl/dist/maplibre-gl.css');
    
    // Extract the classes we need
    ({ Map, NavigationControl, ScaleControl, GeolocateControl } = maplibregl.default);
    
    initializeMap();
  });
  
  onDestroy(() => {
    if (map) {
      map.remove();
      map = null;
    }
  });
  
  function initializeMap() {
    if (!mapContainer) return;
    
    // Validate center is within Southwest bounds
    if (!isInSouthwestRegion(center[1], center[0])) {
      console.warn('Map center outside Southwest region, using default Las Vegas center');
      center = [-115.0, 36.0];
    }
    
    // Initialize MapLibre with Southwest configuration
    try {
      const accessToken = config.mapbox.accessToken;
      
      // Debug environment variables
      console.log('🔍 Debug - config.mapbox.styleUrl:', config.mapbox.styleUrl);
      console.log('🔍 Debug - SOUTHWEST_MAP_CONFIG.mapbox.outdoors.url:', SOUTHWEST_MAP_CONFIG.mapbox.outdoors.url);
      
      // Use the configured style URL from environment variable
      let styleUrl = config.mapbox.styleUrl;
      
      // If no style URL configured, use default from config
      if (!styleUrl) {
        console.log('🔍 No styleUrl in config, using SOUTHWEST_MAP_CONFIG default');
        styleUrl = SOUTHWEST_MAP_CONFIG.mapbox.outdoors.url;
      }
      
      // If no MapBox token, use MapLibre demo style as fallback
      if (!accessToken) {
        console.warn('⚠️ No MapBox access token found, using fallback style');
        styleUrl = 'https://demotiles.maplibre.org/style.json';
      }
      
      console.log('🗺️ Initializing map with style:', styleUrl);
      console.log('🔐 Access token available:', !!accessToken);
      
      const mapConfig = {
        container: mapContainer,
        style: styleUrl,
        center,
        zoom,
        minZoom: SOUTHWEST_MAP_CONFIG.defaults.minZoom,
        maxZoom: SOUTHWEST_MAP_CONFIG.defaults.maxZoom,
        maxBounds: SOUTHWEST_MAP_CONFIG.bounds,
        attributionControl: false
      };
      
      // Only use transformRequest for mapbox:// protocol URLs with access tokens
      // For direct HTTPS URLs (from .env), MapLibre handles them directly
      if (accessToken && styleUrl.startsWith('mapbox://')) {
        console.log('🔄 Using transformRequest for mapbox:// protocol');
        mapConfig.transformRequest = transformRequest;
      } else if (styleUrl.startsWith('https://') && styleUrl.includes('mapbox.com')) {
        console.log('✅ Using direct HTTPS MapBox style URL (no transform needed)');
      } else {
        console.log('🔄 Using fallback style or other provider');
      }
      
      map = new Map(mapConfig);
      
    } catch (error) {
      console.error('❌ Map initialization failed:', error);
      
      // Fallback to basic MapLibre style
      console.log('🔄 Attempting fallback initialization...');
      try {
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
      } catch (fallbackError) {
        console.error('❌ Fallback initialization also failed:', fallbackError);
        throw fallbackError;
      }
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
      // Attach zoom listener after style is fully loaded to avoid "Style is not done loading" errors
      map.on('zoom', () => {
        if (!map.isStyleLoaded()) return;
        const currentZoom = map.getZoom();
        updateTerrainVisualization(currentZoom);
      });
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
    
    // Bidirectional data flow: Mapbox -> Svelte (critical per docs section 3.2)
    map.on('move', () => {
      if (isUpdatingFromSvelte) {
        // If movement was triggered by Svelte, ignore the event to prevent loops
        return;
      }
      // Otherwise update Svelte state
      const newCenter = map.getCenter();
      center = [newCenter.lng, newCenter.lat];
      zoom = map.getZoom();
      pitch = map.getPitch();
      bearing = map.getBearing();
    });
    
    return () => {
      if (map) {
        map.remove();
        map = null;
      }
    };
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
