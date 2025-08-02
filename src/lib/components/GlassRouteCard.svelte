<script lang="ts">
  import { getSeasonalWarnings } from '$lib/config/region';
  
  interface RouteData {
    id: string;
    name: string;
    distance: number; // in miles
    duration: number; // in minutes
    elevation: {
      gain: number; // in feet
      loss: number; // in feet
      max: number; // in feet
      min: number; // in feet
    };
    waypoints: Array<{
      lat: number;
      lng: number;
      name: string;
      elevation?: number;
    }>;
    warnings?: string[];
    routeType?: 'interstate' | 'scenic' | 'backcountry';
    difficulty?: 'easy' | 'moderate' | 'challenging';
  }
  
  interface Props {
    route: RouteData;
    isSelected?: boolean;
    onSelect?: () => void;
    showElevation?: boolean;
    class?: string;
  }
  
  let {
    route,
    isSelected = false,
    onSelect,
    showElevation = true,
    class: className = ''
  }: Props = $props();
  
  // Calculate sunset/sunrise times for Southwest region
  const currentDate = new Date();
  const { sunriseTime, sunsetTime } = calculateSunTimes(currentDate);
  
  // Get seasonal warnings for route waypoints
  const routeWarnings = route.waypoints.flatMap(wp => 
    getSeasonalWarnings(wp.lat, wp.lng, currentDate)
  );
  
  function formatDuration(minutes: number): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins} min`;
  }
  
  function formatElevation(feet: number): string {
    return `${feet.toLocaleString()}ft`;
  }
  
  function getRouteTypeIcon(type: string): string {
    switch (type) {
      case 'interstate': return '🛣️';
      case 'scenic': return '🏞️';
      case 'backcountry': return '🏜️';
      default: return '📍';
    }
  }
  
  function getDifficultyColor(difficulty: string): string {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'challenging': return 'text-red-400';
      default: return 'text-gray-400';
    }
  }
  
  function calculateSunTimes(date: Date) {
    // Simplified calculation for Southwest USA (~36°N)
    // In production, use a proper solar calculation library
    const dayOfYear = Math.floor((date.getTime() - new Date(date.getFullYear(), 0, 0).getTime()) / (1000 * 60 * 60 * 24));
    
    // Approximate sunrise/sunset for Las Vegas area
    const sunrise = 6 + Math.sin((dayOfYear - 81) * 2 * Math.PI / 365) * 1.5;
    const sunset = 18 + Math.sin((dayOfYear - 81) * 2 * Math.PI / 365) * 1.5;
    
    return {
      sunriseTime: `${Math.floor(sunrise)}:${String(Math.floor((sunrise % 1) * 60)).padStart(2, '0')}`,
      sunsetTime: `${Math.floor(sunset)}:${String(Math.floor((sunset % 1) * 60)).padStart(2, '0')}`
    };
  }
  
  function getElevationGradient(elevation: RouteData['elevation']): string {
    const range = elevation.max - elevation.min;
    if (range < 1000) return 'bg-gradient-to-r from-desert-200 to-desert-300';
    if (range < 3000) return 'bg-gradient-to-r from-desert-300 to-canyon-400';
    return 'bg-gradient-to-r from-canyon-400 to-sunset-500';
  }
</script>

<div 
  class="glass-card cursor-pointer transition-all duration-300 hover:scale-[1.02] {className} {isSelected ? 'ring-2 ring-desert-400 bg-white/20' : ''}"
  onclick={onSelect}
  role="button"
  tabindex="0"
>
  <!-- Route Header -->
  <div class="flex items-start justify-between mb-4">
    <div class="flex items-center space-x-3">
      <span class="text-2xl">{getRouteTypeIcon(route.routeType || 'scenic')}</span>
      <div>
        <h3 class="font-bold text-white text-lg">{route.name}</h3>
        {#if route.difficulty}
          <span class="text-xs font-medium {getDifficultyColor(route.difficulty)} uppercase tracking-wide">
            {route.difficulty}
          </span>
        {/if}
      </div>
    </div>
    
    {#if isSelected}
      <div class="flex items-center space-x-1 text-desert-400">
        <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
        </svg>
        <span class="text-xs font-medium">Selected</span>
      </div>
    {/if}
  </div>

  <!-- Route Stats -->
  <div class="grid grid-cols-2 gap-4 mb-4">
    <!-- Distance & Time -->
    <div class="space-y-2">
      <div class="flex items-center space-x-2">
        <svg class="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"></path>
        </svg>
        <span class="text-sm text-white/80">Distance</span>
      </div>
      <div class="text-xl font-bold text-white">{route.distance.toFixed(1)} mi</div>
    </div>
    
    <div class="space-y-2">
      <div class="flex items-center space-x-2">
        <svg class="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span class="text-sm text-white/80">Time</span>
      </div>
      <div class="text-xl font-bold text-white">{formatDuration(route.duration)}</div>
    </div>
  </div>

  <!-- Elevation Profile -->
  {#if showElevation}
    <div class="mb-4">
      <div class="flex items-center space-x-2 mb-2">
        <svg class="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z"></path>
        </svg>
        <span class="text-sm text-white/80">Elevation Profile</span>
      </div>
      
      <!-- Elevation Visualization -->
      <div class="relative h-16 rounded-lg overflow-hidden {getElevationGradient(route.elevation)}">
        <div class="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
        
        <!-- Elevation Stats -->
        <div class="absolute inset-0 flex items-end justify-between p-2 text-xs text-white/90">
          <div class="text-center">
            <div class="font-medium">{formatElevation(route.elevation.min)}</div>
            <div class="text-white/60">Min</div>
          </div>
          <div class="text-center">
            <div class="font-medium">+{formatElevation(route.elevation.gain)}</div>
            <div class="text-white/60">Gain</div>
          </div>
          <div class="text-center">
            <div class="font-medium">{formatElevation(route.elevation.max)}</div>
            <div class="text-white/60">Max</div>
          </div>
        </div>
      </div>
    </div>
  {/if}

  <!-- Sunrise/Sunset Times -->
  <div class="mb-4 p-3 rounded-lg bg-gradient-to-r from-orange-500/20 to-purple-500/20">
    <div class="flex items-center justify-between">
      <div class="flex items-center space-x-2">
        <span class="text-lg">🌅</span>
        <div>
          <div class="text-xs text-white/70">Sunrise</div>
          <div class="text-sm font-medium text-white">{sunriseTime}</div>
        </div>
      </div>
      
      <div class="flex items-center space-x-2">
        <span class="text-lg">🌅</span>
        <div class="text-right">
          <div class="text-xs text-white/70">Sunset</div>
          <div class="text-sm font-medium text-white">{sunsetTime}</div>
        </div>
      </div>
    </div>
  </div>

  <!-- Warnings -->
  {#if routeWarnings.length > 0 || (route.warnings && route.warnings.length > 0)}
    <div class="border-t border-white/10 pt-3">
      <div class="flex items-center space-x-2 mb-2">
        <svg class="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>
        </svg>
        <span class="text-sm font-medium text-yellow-400">Travel Advisories</span>
      </div>
      
      <div class="space-y-1">
        {#each [...routeWarnings, ...(route.warnings || [])] as warning}
          <div class="text-xs text-yellow-200 bg-yellow-500/20 rounded px-2 py-1">
            {warning}
          </div>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Waypoints Preview -->
  <div class="border-t border-white/10 pt-3 mt-3">
    <div class="flex items-center space-x-2 mb-2">
      <svg class="w-4 h-4 text-white/60" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path>
        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path>
      </svg>
      <span class="text-sm text-white/80">Route ({route.waypoints.length} stops)</span>
    </div>
    
    <div class="flex items-center space-x-2 overflow-x-auto">
      {#each route.waypoints.slice(0, 4) as waypoint, i}
        <div class="flex items-center space-x-1 text-xs text-white/70 rounded-full px-2 py-1 whitespace-nowrap" style="background-color: rgba(255, 255, 255, 0.1);">
          {#if i === 0}
            <span class="text-green-400">🚩</span>
          {:else if i === route.waypoints.length - 1}
            <span class="text-red-400">🏁</span>
          {:else}
            <span class="text-blue-400">📍</span>
          {/if}
          <span class="truncate max-w-20">{waypoint.name}</span>
        </div>
      {/each}
      
      {#if route.waypoints.length > 4}
        <div class="text-xs text-white/50 px-2">
          +{route.waypoints.length - 4} more
        </div>
      {/if}
    </div>
  </div>
</div>
