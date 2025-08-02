<script lang="ts">
  import type { Route } from '$lib/types';
  
  interface Props {
    route: Route;
    showDetails?: boolean;
    interactive?: boolean;
  }
  
  let { route, showDetails = true, interactive = false }: Props = $props();
  
  // Calculate additional elevation metrics
  const elevationAnalysis = $derived(() => {
    if (!route.elevation) return null;
    
    const { gain, loss, max, min } = route.elevation;
    const netElevation = gain - loss;
    const averageGradient = route.distance > 0 ? (netElevation / (route.distance * 5280)) * 100 : 0; // Convert to percentage
    
    // Difficulty assessment based on elevation changes
    let difficulty: 'easy' | 'moderate' | 'challenging' | 'extreme';
    if (gain > 5000 || max > 8000) {
      difficulty = 'extreme';
    } else if (gain > 3000 || max > 6000) {
      difficulty = 'challenging';
    } else if (gain > 1500 || max > 4000) {
      difficulty = 'moderate';
    } else {
      difficulty = 'easy';
    }
    
    return {
      netElevation,
      averageGradient,
      difficulty,
      altitudeWarning: max > 7000,
      steepSections: gain > 2000
    };
  });
  
  // Generate SVG path for elevation profile
  const elevationPath = $derived(() => {
    if (!route.elevation) return '';
    
    const { min, max } = route.elevation;
    const width = 400;
    const height = 120;
    const padding = 10;
    
    // Simple elevation profile simulation based on route data
    const points = 50;
    const elevationRange = max - min;
    
    if (elevationRange === 0) return '';
    
    let path = `M ${padding} ${height - padding}`;
    
    for (let i = 0; i <= points; i++) {
      const x = padding + (i / points) * (width - padding * 2);
      
      // Simulate elevation changes (in production, use actual elevation data)
      let elevation;
      if (i < points * 0.3) {
        // Gradual ascent
        elevation = min + (elevationRange * 0.3 * (i / (points * 0.3)));
      } else if (i < points * 0.7) {
        // Maintain high elevation
        elevation = min + elevationRange * 0.3 + (elevationRange * 0.4) * Math.sin((i - points * 0.3) / (points * 0.4) * Math.PI);
      } else {
        // Descent
        elevation = max - (elevationRange * 0.3 * ((i - points * 0.7) / (points * 0.3)));
      }
      
      const y = height - padding - ((elevation - min) / elevationRange) * (height - padding * 2);
      path += ` L ${x} ${y}`;
    }
    
    return path;
  });
  
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'text-green-400';
      case 'moderate': return 'text-yellow-400';
      case 'challenging': return 'text-orange-400';
      case 'extreme': return 'text-red-400';
      default: return 'text-gray-400';
    }
  };
  
  const formatElevation = (feet: number) => {
    return feet >= 1000 ? `${(feet / 1000).toFixed(1)}k ft` : `${feet} ft`;
  };
</script>

<div 
  class="rounded-2xl shadow-2xl ring-1 ring-amber-500/20 backdrop-blur-lg"
  style="background-color: rgba(255,255,255,0.1);"
>
  <div class="p-6">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold text-white">Elevation Profile</h3>
      {#if elevationAnalysis}
        <span class="px-3 py-1 rounded-full text-sm font-medium {getDifficultyColor(elevationAnalysis.difficulty)} bg-black/20">
          {elevationAnalysis.difficulty.charAt(0).toUpperCase() + elevationAnalysis.difficulty.slice(1)}
        </span>
      {/if}
    </div>
    
    {#if route.elevation}
      <!-- SVG Elevation Chart -->
      <div class="mb-6 bg-black/20 rounded-lg p-4">
        <svg 
          width="100%" 
          height="140" 
          viewBox="0 0 400 140"
          class="overflow-visible"
        >
          <!-- Grid lines -->
          <defs>
            <pattern id="grid" width="40" height="20" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.1)" stroke-width="0.5"/>
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#grid)" />
          
          <!-- Elevation path -->
          {#if elevationPath}
            <!-- Fill area under curve -->
            <path 
              d="{elevationPath} L 390 130 L 10 130 Z"
              fill="rgba(34, 197, 94, 0.2)"
              stroke="none"
            />
            <!-- Elevation line -->
            <path 
              d="{elevationPath}"
              fill="none" 
              stroke="rgb(34, 197, 94)" 
              stroke-width="2"
              class="drop-shadow-sm"
            />
          {/if}
          
          <!-- Elevation markers -->
          <text x="10" y="25" fill="rgba(255,255,255,0.7)" font-size="10">
            {formatElevation(route.elevation.max)}
          </text>
          <text x="10" y="125" fill="rgba(255,255,255,0.7)" font-size="10">
            {formatElevation(route.elevation.min)}
          </text>
        </svg>
      </div>
      
      <!-- Elevation Statistics -->
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div class="text-center">
          <div class="text-2xl font-bold text-green-400">
            ↗️ {formatElevation(route.elevation.gain)}
          </div>
          <div class="text-sm text-gray-300">Elevation Gain</div>
        </div>
        
        <div class="text-center">
          <div class="text-2xl font-bold text-red-400">
            ↘️ {formatElevation(route.elevation.loss)}
          </div>
          <div class="text-sm text-gray-300">Elevation Loss</div>
        </div>
      </div>
      
      <div class="grid grid-cols-2 gap-4 mb-4">
        <div class="text-center">
          <div class="text-xl font-semibold text-blue-400">
            🏔️ {formatElevation(route.elevation.max)}
          </div>
          <div class="text-sm text-gray-300">Highest Point</div>
        </div>
        
        <div class="text-center">
          <div class="text-xl font-semibold text-orange-400">
            🏜️ {formatElevation(route.elevation.min)}
          </div>
          <div class="text-sm text-gray-300">Lowest Point</div>
        </div>
      </div>
      
      {#if showDetails && elevationAnalysis}
        <!-- Additional Analysis -->
        <div class="border-t border-white/20 pt-4 space-y-3">
          <div class="flex justify-between items-center">
            <span class="text-gray-300">Net Elevation:</span>
            <span class="font-semibold text-white">
              {elevationAnalysis.netElevation > 0 ? '+' : ''}{formatElevation(Math.abs(elevationAnalysis.netElevation))}
            </span>
          </div>
          
          <div class="flex justify-between items-center">
            <span class="text-gray-300">Average Gradient:</span>
            <span class="font-semibold text-white">
              {elevationAnalysis.averageGradient.toFixed(1)}%
            </span>
          </div>
          
          <!-- Warnings -->
          {#if elevationAnalysis.altitudeWarning}
            <div class="flex items-center gap-2 p-3 bg-yellow-500/20 rounded-lg border border-yellow-500/30">
              <span class="text-yellow-400">⚠️</span>
              <span class="text-sm text-yellow-100">High altitude route - check vehicle performance and carry extra water</span>
            </div>
          {/if}
          
          {#if elevationAnalysis.steepSections}
            <div class="flex items-center gap-2 p-3 bg-orange-500/20 rounded-lg border border-orange-500/30">
              <span class="text-orange-400">🏔️</span>
              <span class="text-sm text-orange-100">Steep sections - check brakes and use lower gears</span>
            </div>
          {/if}
        </div>
      {/if}
      
    {:else}
      <div class="text-center py-8 text-gray-400">
        <div class="text-4xl mb-2">📈</div>
        <div>Elevation data not available</div>
        <div class="text-sm mt-1">Route profile will be calculated during navigation</div>
      </div>
    {/if}
  </div>
</div>

<style>
  /* Add subtle animations for interactive mode */
  svg path {
    transition: all 0.3s ease;
  }
  
  /* Responsive adjustments */
  @media (max-width: 640px) {
    .grid-cols-2 {
      grid-template-columns: 1fr;
    }
  }
</style>
