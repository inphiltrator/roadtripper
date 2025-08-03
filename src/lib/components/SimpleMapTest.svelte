<script lang="ts">
  import { onMount } from 'svelte';
  import { browser } from '$app/environment';
  
  let mapContainer: HTMLDivElement;
  let map: any;

  onMount(async () => {
    if (!browser) return; // Only run in browser
    
    // Dynamic import to avoid SSR issues
    const mapboxgl = await import('mapbox-gl');
    await import('mapbox-gl/dist/mapbox-gl.css');
    
    // Set access token directly (using new token)
    const accessToken = "pk.eyJ1IjoiaW5waGlsdHJhdGlvbiIsImEiOiJjbWR3M29xMm8xd25mMm1zNjJzMm9nYTh0In0.-nsVR925zw7hNjISo-QB6Q";
    console.log('🔑 Access Token from env:', accessToken ? 'Available' : 'Missing');
    
    if (!accessToken) {
      console.error('❌ No MapBox access token found!');
      return;
    }

    mapboxgl.default.accessToken = accessToken;

    // Initialize map instance exactly as in docs
    map = new mapboxgl.default.Map({
      container: mapContainer, // Pass DOM element reference
      style: 'mapbox://styles/mapbox/outdoors-v11', // Use stable outdoors style
      center: [-115.0, 36.0], // Las Vegas center
      zoom: 6, // Start zoom level
      antialias: true // Improves rendering of custom layers
    });

    console.log('🗺️ Simple test map initialized');

    // Add basic controls
    map.addControl(new mapboxgl.default.NavigationControl(), 'top-right');
    
    map.on('load', () => {
      console.log('✅ Simple test map loaded successfully');
    });

    map.on('error', (e) => {
      console.error('❌ Simple test map error:', e);
    });

    // Cleanup function returned
    return () => {
      if (map) {
        map.remove();
      }
    };
  });
</script>

<div class="simple-map-test">
  <h3 style="color: white; margin-bottom: 1rem;">Simple MapBox Test (from docs)</h3>
  <div class="map-container" bind:this={mapContainer}></div>
</div>

<style>
  .simple-map-test {
    margin: 2rem 0;
    padding: 1rem;
    border: 2px solid #ff6b35;
    border-radius: 8px;
    background: rgba(0, 0, 0, 0.3);
  }
  
  .map-container {
    width: 100%;
    height: 400px;
    border-radius: 8px;
  }
</style>
