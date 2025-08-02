<script lang="ts">
  import { categorizePOI, SOUTHWEST_REGION } from '$lib/config/region';
  
  interface POI {
    id: string;
    name: string;
    description?: string;
    coordinates: [number, number]; // [lng, lat]
    category: string[];
    rating?: number;
    visitDuration?: string; // e.g., "2-3 hours"
    bestTimeToVisit?: string;
    tags?: string[];
    distance?: number; // in miles from current location
    website?: string;
    phone?: string;
    admission?: {
      adult?: number;
      child?: number;
      senior?: number;
      free?: boolean;
    };
  }
  
  interface Props {
    pois?: POI[];
    currentLocation?: { lat: number; lng: number };
    selectedCategories?: string[];
    onPOISelect?: (poi: POI) => void;
    onCategoryFilter?: (categories: string[]) => void;
    class?: string;
    compact?: boolean;
    maxItems?: number;
  }
  
  let {
    pois = [],
    currentLocation,
    selectedCategories = [],
    onPOISelect,
    onCategoryFilter,
    class: className = '',
    compact = false,
    maxItems = 20
  }: Props = $props();
  
  // Generate sample Southwest POIs if none provided
  const samplePOIs: POI[] = [
    {
      id: 'grand-canyon',
      name: 'Grand Canyon National Park',
      description: 'One of the most spectacular natural wonders in the world',
      coordinates: [-112.1129, 36.1069],
      category: ['National Park', 'Desert/Canyon'],
      rating: 4.8,
      visitDuration: '4-8 hours',
      bestTimeToVisit: 'Spring/Fall',
      tags: ['hiking', 'photography', 'scenic'],
      admission: { adult: 35, child: 0, senior: 35 }
    },
    {
      id: 'joshua-tree',
      name: 'Joshua Tree National Park',
      description: 'Unique desert landscape with iconic Joshua trees',
      coordinates: [-116.0713, 33.8734],
      category: ['National Park', 'Desert/Canyon'],
      rating: 4.6,
      visitDuration: '3-6 hours',
      bestTimeToVisit: 'Winter/Spring',
      tags: ['hiking', 'rock climbing', 'stargazing'],
      admission: { adult: 30, child: 0 }
    },
    {
      id: 'antelope-canyon',
      name: 'Antelope Canyon',
      description: 'Famous slot canyon with incredible light beams',
      coordinates: [-111.3743, 36.8619],
      category: ['Desert/Canyon', 'Photography'],
      rating: 4.7,
      visitDuration: '1-2 hours',
      bestTimeToVisit: 'Late morning',
      tags: ['photography', 'guided tours', 'slot canyon']
    },
    {
      id: 'route66-seligman',
      name: 'Historic Route 66 - Seligman',
      description: 'Birthplace of Historic Route 66',
      coordinates: [-112.8747, 35.3256],
      category: ['Scenic Route', 'Historic'],
      rating: 4.3,
      visitDuration: '1-2 hours',
      bestTimeToVisit: 'Year-round',
      tags: ['historic', 'americana', 'photos']
    },
    {
      id: 'death-valley',
      name: 'Death Valley National Park',
      description: 'Hottest, driest, and lowest national park',
      coordinates: [-117.0794, 36.5054],
      category: ['National Park', 'Desert/Canyon'],
      rating: 4.5,
      visitDuration: '6+ hours',
      bestTimeToVisit: 'Winter/Spring',
      tags: ['extreme weather', 'photography', 'geology'],
      admission: { adult: 30, child: 0 }
    },
    {
      id: 'zion-national-park',
      name: 'Zion National Park',
      description: 'Stunning red cliffs and narrow canyons',
      coordinates: [-113.0263, 37.2982],
      category: ['National Park', 'Desert/Canyon'],
      rating: 4.9,
      visitDuration: '6+ hours',
      bestTimeToVisit: 'Spring/Fall',
      tags: ['hiking', 'canyoneering', 'scenic'],
      admission: { adult: 35, child: 0 }
    }
  ];
  
  const allPOIs = pois.length > 0 ? pois : samplePOIs;
  
  // Calculate distances if current location is provided
  const poisWithDistance = allPOIs.map(poi => {
    if (currentLocation) {
      const distance = calculateDistance(
        currentLocation.lat, 
        currentLocation.lng, 
        poi.coordinates[1], 
        poi.coordinates[0]
      );
      return { ...poi, distance };
    }
    return poi;
  });
  
  // Get all available categories
  const allCategories = Array.from(
    new Set(allPOIs.flatMap(poi => poi.category))
  );
  
  // Filter POIs based on selected categories
  const filteredPOIs = poisWithDistance
    .filter(poi => {
      if (selectedCategories.length === 0) return true;
      return poi.category.some(cat => selectedCategories.includes(cat));
    })
    .sort((a, b) => {
      // Sort by distance if available, otherwise by rating
      if (a.distance !== undefined && b.distance !== undefined) {
        return a.distance - b.distance;
      }
      return (b.rating || 0) - (a.rating || 0);
    })
    .slice(0, maxItems);
  
  function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 3959; // Earth's radius in miles
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }
  
  function toRad(value: number): number {
    return value * Math.PI / 180;
  }
  
  function getCategoryIcon(category: string): string {
    switch (category) {
      case 'National Park': return '🏞️';
      case 'Desert/Canyon': return '🏜️';
      case 'Scenic Route': return '🛣️';
      case 'Historic': return '🏛️';
      case 'Coastal': return '🏖️';
      case 'Photography': return '📸';
      case 'Entertainment': return '🎭';
      default: return '📍';
    }
  }
  
  function getRatingStars(rating: number): string {
    const fullStars = Math.floor(rating);
    const hasHalf = rating % 1 >= 0.5;
    return '★'.repeat(fullStars) + (hasHalf ? '½' : '') + '☆'.repeat(5 - fullStars - (hasHalf ? 1 : 0));
  }
  
  function formatDistance(distance: number): string {
    if (distance < 1) {
      return `${(distance * 5280).toFixed(0)} ft`;
    }
    return `${distance.toFixed(1)} mi`;
  }
  
  function handleCategoryToggle(category: string) {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category];
    
    onCategoryFilter?.(newCategories);
  }
  
  function handlePOIClick(poi: POI) {
    onPOISelect?.(poi);
  }
</script>

<div class="p-4 space-y-4 {className}" style="background-color: rgba(255, 255, 255, 0.1); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 8px 32px 0 rgba(255, 255, 255, 0.05); border-radius: 1rem;">
  <!-- Header -->
  <div class="flex items-center justify-between">
    <div class="flex items-center space-x-3">
      <span class="text-2xl">🗺️</span>
      <div>
        <h3 class="font-bold text-white text-lg">Points of Interest</h3>
        <p class="text-xs text-white/70">
          {filteredPOIs.length} of {allPOIs.length} locations
          {currentLocation ? ' • Sorted by distance' : ' • Sorted by rating'}
        </p>
      </div>
    </div>
  </div>

  <!-- Category Filters -->
  {#if !compact}
    <div class="space-y-2">
      <div class="flex items-center space-x-2">
        <span class="text-sm font-medium text-white/80">Categories:</span>
      </div>
      <div class="flex flex-wrap gap-2">
        {#each allCategories as category}
          <button
            onclick={() => handleCategoryToggle(category)}
            class="flex items-center space-x-1 px-3 py-1 rounded-full text-xs transition-all duration-200
                   {selectedCategories.includes(category) 
                     ? 'bg-amber-500/30 text-amber-100 ring-1 ring-amber-400/50' 
                     : 'bg-white/10 text-white/70 hover:bg-white/20'}"
          >
            <span>{getCategoryIcon(category)}</span>
            <span>{category}</span>
          </button>
        {/each}
        
        {#if selectedCategories.length > 0}
          <button
            onclick={() => onCategoryFilter?.([])}
            class="px-3 py-1 rounded-full text-xs bg-red-500/20 text-red-200 hover:bg-red-500/30 transition-colors"
          >
            Clear All
          </button>
        {/if}
      </div>
    </div>
  {/if}

  <!-- POI List -->
  <div class="space-y-3 max-h-96 overflow-y-auto custom-scrollbar">
    {#each filteredPOIs as poi}
      <div 
        class="p-3 space-y-2 cursor-pointer transition-all duration-200 hover:bg-white/20 group" style="background-color: rgba(0, 0, 0, 0.1); backdrop-filter: blur(12px); border: 1px solid rgba(0, 0, 0, 0.2); box-shadow: 0 25px 50px -12px rgba(255, 255, 255, 0.08); border-radius: 1rem;"
        onclick={() => handlePOIClick(poi)}
      >
        <!-- POI Header -->
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <div class="flex items-center space-x-2">
              <span class="text-lg">{getCategoryIcon(poi.category[0])}</span>
              <h4 class="font-semibold text-white text-sm group-hover:text-amber-200 transition-colors">
                {poi.name}
              </h4>
            </div>
            
            {#if poi.rating}
              <div class="flex items-center space-x-2 mt-1">
                <span class="text-xs text-amber-300">{getRatingStars(poi.rating)}</span>
                <span class="text-xs text-white/70">({poi.rating})</span>
              </div>
            {/if}
          </div>
          
          <div class="text-right">
            {#if poi.distance !== undefined}
              <div class="text-xs text-white/70">{formatDistance(poi.distance)}</div>
            {/if}
            {#if poi.visitDuration}
              <div class="text-xs text-white/50">{poi.visitDuration}</div>
            {/if}
          </div>
        </div>

        <!-- Description -->
        {#if poi.description && !compact}
          <p class="text-xs text-white/80 leading-relaxed">
            {poi.description}
          </p>
        {/if}

        <!-- Tags and Details -->
        <div class="flex flex-wrap items-center gap-2">
          <!-- Categories -->
          {#each poi.category as category}
            <span class="text-xs bg-white/20 rounded px-2 py-1 text-white/80">
              {category}
            </span>
          {/each}
          
          <!-- Best time to visit -->
          {#if poi.bestTimeToVisit}
            <span class="text-xs bg-blue-500/20 rounded px-2 py-1 text-blue-200">
              🕒 {poi.bestTimeToVisit}
            </span>
          {/if}
          
          <!-- Admission -->
          {#if poi.admission?.free}
            <span class="text-xs bg-green-500/20 rounded px-2 py-1 text-green-200">
              💚 Free
            </span>
          {:else if poi.admission?.adult}
            <span class="text-xs bg-yellow-500/20 rounded px-2 py-1 text-yellow-200">
              💰 ${poi.admission.adult}
            </span>
          {/if}
        </div>

        <!-- Tags -->
        {#if poi.tags && poi.tags.length > 0 && !compact}
          <div class="flex flex-wrap gap-1">
            {#each poi.tags as tag}
              <span class="text-xs bg-white/10 rounded px-2 py-1 text-white/60">
                #{tag}
              </span>
            {/each}
          </div>
        {/if}
      </div>
    {/each}
    
    <!-- Empty State -->
    {#if filteredPOIs.length === 0}
      <div class="text-center py-8 text-white/60">
        <span class="text-4xl block mb-2">🔍</span>
        <p class="text-sm">No POIs found for selected categories</p>
        <button 
          onclick={() => onCategoryFilter?.([])}
          class="mt-2 text-xs text-amber-300 hover:text-amber-200 underline"
        >
          Clear filters to see all locations
        </button>
      </div>
    {/if}
  </div>

  <!-- Quick Actions -->
  {#if !compact && filteredPOIs.length > 0}
    <div class="border-t border-white/10 pt-3">
      <div class="flex flex-wrap gap-2">
        <button class="text-xs bg-white/20 hover:bg-white/30 rounded px-3 py-2 transition-colors">
          📍 Show All on Map
        </button>
        <button class="text-xs bg-white/20 hover:bg-white/30 rounded px-3 py-2 transition-colors">
          🛣️ Plan Route
        </button>
        <button class="text-xs bg-white/20 hover:bg-white/30 rounded px-3 py-2 transition-colors">
          📤 Export List
        </button>
      </div>
    </div>
  {/if}
</div>

<style>
  .custom-scrollbar {
    scrollbar-width: thin;
    scrollbar-color: rgba(255, 255, 255, 0.3) transparent;
  }
  
  .custom-scrollbar::-webkit-scrollbar {
    width: 6px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-track {
    background: rgba(255, 255, 255, 0.1);
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(255, 255, 255, 0.3);
    border-radius: 3px;
  }
  
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: rgba(255, 255, 255, 0.5);
  }
</style>
