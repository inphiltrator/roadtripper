<script lang="ts">
  import SouthwestMap from '$lib/components/SouthwestMap.svelte';
  import GlassRouteCard from '$lib/components/GlassRouteCard.svelte';
  import GlassWeatherAlert from '$lib/components/GlassWeatherAlert.svelte';
  import GlassPOIPanel from '$lib/components/GlassPOIPanel.svelte';
  import GlassElevationProfile from '$lib/components/GlassElevationProfile.svelte';
  import { SOUTHWEST_REGION } from '$lib/config/region';
  
  // Demo state
  let selectedRoute: any = null;
  let currentLocation = { lat: 36.1699, lng: -115.1398, name: 'Las Vegas, NV' };
  let showWeatherAlert = true;
  let showPOIPanel = true;
  let showElevationProfile = false;
  let selectedCategories: string[] = [];
  
  // Demo route data
  const demoRoute = {
    start: { lat: 34.0522, lng: -118.2437, name: 'Los Angeles, CA' },
    end: { lat: 36.1699, lng: -115.1398, name: 'Las Vegas, NV' },
    distance: 270,
    duration: 4.5,
    elevationProfile: [
      { distance: 0, elevation: 285 },
      { distance: 50, elevation: 1200 },
      { distance: 100, elevation: 2800 },
      { distance: 150, elevation: 3200 },
      { distance: 200, elevation: 2800 },
      { distance: 250, elevation: 2100 },
      { distance: 270, elevation: 2100 }
    ],
    warnings: ['Desert heat warning', 'Carry extra water'],
    highlights: ['Mojave Desert', 'Cajon Pass', 'Barstow']
  };
  
  function handleRouteSelect(route: any) {
    selectedRoute = route;
    showElevationProfile = true;
  }
  
  function handlePOISelect(poi: any) {
    console.log('Selected POI:', poi);
    // In a real app, this would center the map on the POI
  }
  
  function handleLocationClick(coordinates: [number, number]) {
    currentLocation = {
      lat: coordinates[1],
      lng: coordinates[0],
      name: `Location (${coordinates[1].toFixed(4)}, ${coordinates[0].toFixed(4)})`
    };
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
          <!-- Quick Actions -->
          <button 
            class="glass-button text-sm px-4 py-2"
            onclick={() => showWeatherAlert = !showWeatherAlert}
          >
            🌡️ Weather
          </button>
          <button 
            class="glass-button text-sm px-4 py-2"
            onclick={() => showPOIPanel = !showPOIPanel}
          >
            🗺️ POIs
          </button>
          <button 
            class="glass-button text-sm px-4 py-2"
            onclick={() => handleRouteSelect(demoRoute)}
          >
            🛣️ Demo Route
          </button>
        </div>
      </div>
    </div>
  </header>

  <div class="container mx-auto p-4 space-y-6">
    <!-- Map Section -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main Map -->
      <div class="lg:col-span-2">
        <SouthwestMap 
          onLocationClick={handleLocationClick}
          class="h-96 lg:h-[600px]"
        />
      </div>
      
      <!-- Side Panel -->
      <div class="space-y-4">
        <!-- Weather Alert -->
        {#if showWeatherAlert}
          <GlassWeatherAlert 
            location={currentLocation}
            onClose={() => showWeatherAlert = false}
          />
        {/if}
        
        <!-- POI Panel -->
        {#if showPOIPanel}
          <GlassPOIPanel 
            currentLocation={currentLocation}
            selectedCategories={selectedCategories}
            onPOISelect={handlePOISelect}
            onCategoryFilter={(categories) => selectedCategories = categories}
            maxItems={6}
            compact={true}
          />
        {/if}
      </div>
    </div>
    
    <!-- Route Information -->
    {#if selectedRoute}
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Route Card -->
        <GlassRouteCard 
          route={selectedRoute}
          showElevationPreview={true}
          onRouteSelect={() => {}}
        />
        
        <!-- Elevation Profile -->
        {#if showElevationProfile}
          <GlassElevationProfile 
            routeName="{selectedRoute.start.name} → {selectedRoute.end.name}"
            onPointHover={(point) => console.log('Hovered:', point)}
          />
        {/if}
      </div>
    {/if}
    
    <!-- Full POI Panel (when expanded) -->
    {#if !showPOIPanel}
      <div class="mt-8">
        <GlassPOIPanel 
          currentLocation={currentLocation}
          selectedCategories={selectedCategories}
          onPOISelect={handlePOISelect}
          onCategoryFilter={(categories) => selectedCategories = categories}
          compact={false}
        />
      </div>
    {/if}
  </div>
  
  <!-- Footer -->
  <footer class="glass-panel-dark border-t border-amber-500/20 p-6 mt-12">
    <div class="container mx-auto">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 class="font-bold text-white mb-2">Southwest USA Coverage</h3>
          <div class="space-y-1 text-sm text-white/70">
            <div>🌴 California - Coastal & Desert</div>
            <div>🎰 Nevada - Desert & Mountains</div>
            <div>⛰️ Utah - Canyons & National Parks</div>
            <div>🏜️ Arizona - Grand Canyon & Sonoran</div>
          </div>
        </div>
        
        <div>
          <h3 class="font-bold text-white mb-2">Popular Routes</h3>
          <div class="space-y-1 text-sm text-white/70">
            <div>🛣️ Historic Route 66</div>
            <div>🏞️ National Parks Circuit</div>
            <div>🏖️ California Coast</div>
            <div>⛰️ Utah Mighty Five</div>
          </div>
        </div>
        
        <div>
          <h3 class="font-bold text-white mb-2">Features</h3>
          <div class="space-y-1 text-sm text-white/70">
            <div>🌡️ Real-time Weather Alerts</div>
            <div>⛰️ Elevation Profiles</div>
            <div>📍 Curated POIs</div>
            <div>🗺️ Terrain-aware Navigation</div>
          </div>
        </div>
      </div>
      
      <div class="border-t border-white/10 pt-6 mt-6 text-center">
        <p class="text-sm text-white/60">
          © 2024 Southwest USA Roadtripper • Built for the American Southwest
        </p>
      </div>
    </div>
  </footer>
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
  
  .glass-button {
    @apply bg-white/10 backdrop-blur-lg 
           ring-1 ring-amber-500/20
           shadow-lg rounded-lg
           text-white hover:bg-white/20
           transition-all duration-200;
  }
</style>
