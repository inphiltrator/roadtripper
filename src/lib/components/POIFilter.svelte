<script lang="ts">
  import type { POI } from '$lib/types';
  
  interface Props {
    selectedCategories: POI['category'][];
    onCategoryToggle: (category: POI['category']) => void;
    onApplyFilters: () => void;
    radius: number;
    onRadiusChange: (radius: number) => void;
    loading?: boolean;
    class?: string;
  }
  
  let { 
    selectedCategories = [], 
    onCategoryToggle, 
    onApplyFilters,
    radius = 10000,
    onRadiusChange,
    loading = false,
    class: className = ''
  }: Props = $props();
  
  const categories: { value: POI['category']; label: string; icon: string; description: string }[] = [
    { value: 'national_park', label: 'National Parks', icon: '🏜️', description: 'Grand Canyon, Zion, etc.' },
    { value: 'state_park', label: 'State Parks', icon: '🏞️', description: 'Valley of Fire, Red Rock' },
    { value: 'camping', label: 'Camping', icon: '🏕️', description: 'Campgrounds, RV Parks' },
    { value: 'dining', label: 'Dining', icon: '🍽️', description: 'Restaurants, Cafes' },
    { value: 'attraction', label: 'Attractions', icon: '📍', description: 'Viewpoints, Museums' },
    { value: 'lodging', label: 'Lodging', icon: '🏨', description: 'Hotels, Motels' },
    { value: 'fuel', label: 'Fuel & Charging', icon: '⛽', description: 'Gas, EV Charging' }
  ];
  
  const radiusOptions = [
    { value: 5000, label: '5 km', miles: '3 mi' },
    { value: 10000, label: '10 km', miles: '6 mi' },
    { value: 25000, label: '25 km', miles: '15 mi' },
    { value: 50000, label: '50 km', miles: '31 mi' }
  ];
  
  function toggleAll(select: boolean) {
    const newCategories = select ? categories.map(c => c.value) : [];
    selectedCategories.forEach(cat => onCategoryToggle(cat)); // Clear current
    if (select) {
      categories.forEach(cat => {
        if (!selectedCategories.includes(cat.value)) {
          onCategoryToggle(cat.value);
        }
      });
    }
  }
</script>

<div class="p-4 {className}" style="background-color: rgba(255, 255, 255, 0.1); backdrop-filter: blur(12px); border: 1px solid rgba(255, 255, 255, 0.2); box-shadow: 0 8px 32px 0 rgba(255, 255, 255, 0.05); border-radius: 1rem;">
  <div class="flex items-center justify-between mb-4">
    <h3 class="text-lg font-bold text-white">POI Filters</h3>
    <div class="text-xs space-x-2">
      <button 
        onclick={() => toggleAll(true)}
        class="text-amber-300 hover:text-amber-200 hover:underline transition-colors"
        disabled={loading}
      >
        Select All
      </button>
      <span class="text-gray-400">|</span>
      <button 
        onclick={() => toggleAll(false)}
        class="text-red-300 hover:text-red-200 hover:underline transition-colors"
        disabled={loading}
      >
        Clear All
      </button>
    </div>
  </div>
  
  <!-- Categories -->
  <div class="mb-4 space-y-2">
    {#each categories as category}
      <label class="flex items-start space-x-3 cursor-pointer p-2 rounded-lg hover:bg-white/20 transition-colors {loading ? 'opacity-50' : ''}">
        <input
          type="checkbox"
          checked={selectedCategories.includes(category.value)}
          onchange={() => onCategoryToggle(category.value)}
          class="mt-1 rounded border-gray-300 text-amber-500 focus:ring-amber-500 focus:ring-2"
          disabled={loading}
        />
        <div class="flex-1">
          <div class="flex items-center space-x-2">
            <span class="text-lg">{category.icon}</span>
            <span class="font-medium text-sm text-white">{category.label}</span>
          </div>
          <div class="text-xs text-white/70 mt-0.5">{category.description}</div>
        </div>
      </label>
    {/each}
  </div>
  
  <!-- Radius -->
  <div class="mb-4">
    <h4 class="mb-2 text-sm font-semibold text-white/90">Search Radius</h4>
    <select
      value={radius}
      onchange={(e) => onRadiusChange(Number(e.currentTarget.value))}
      class="w-full rounded-lg border border-white/20 bg-white/10 backdrop-blur-sm px-3 py-2 text-sm text-white focus:border-amber-400 focus:ring-2 focus:ring-amber-400/50 focus:outline-none transition-colors"
      disabled={loading}
    >
      {#each radiusOptions as option}
        <option value={option.value} class="bg-gray-800 text-white">{option.miles} ({option.label})</option>
      {/each}
    </select>
  </div>
  
  <button 
    class="w-full px-4 py-3 rounded-lg font-medium text-white transition-all duration-200 {loading || selectedCategories.length === 0 
      ? 'bg-gray-600 cursor-not-allowed opacity-50' 
      : 'bg-amber-600 hover:bg-amber-500 focus:ring-2 focus:ring-amber-400/50 focus:outline-none transform hover:scale-[1.02]'}"
    onclick={onApplyFilters}
    disabled={loading || selectedCategories.length === 0}
  >
    {#if loading}
      <span class="flex items-center justify-center">
        <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        Searching...
      </span>
    {:else}
      Apply Filters ({selectedCategories.length} selected)
    {/if}
  </button>
</div>
