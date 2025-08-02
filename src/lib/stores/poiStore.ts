import { writable } from 'svelte/store';
import type { POI } from '$lib/types';
import { EnhancedPOIService, type LatLng } from '$lib/services/EnhancedPOIService';
import { config } from '$lib/config/env';

interface POIState {
  discoveredPOIs: POI[];
  loading: boolean;
  error: string | null;
  lastSearchLocation: LatLng | null;
  lastSearchRadius: number;
  lastSearchCategories: POI['category'][];
  cache: Map<string, { pois: POI[]; timestamp: number }>;
}

const initialState: POIState = {
  discoveredPOIs: [],
  loading: false,
  error: null,
  lastSearchLocation: null,
  lastSearchRadius: 10000,
  lastSearchCategories: [],
  cache: new Map()
};

// Create writable stores
export const discoveredPOIs = writable<POI[]>([]);
export const poiLoading = writable<boolean>(false);
export const poiError = writable<string | null>(null);

// POI Service instance
const poiService = new EnhancedPOIService(config.overpass.endpoint);

class POIStore {
  private state = $state(initialState);

  // Public reactive getters
  get pois() { return this.state.discoveredPOIs; }
  get loading() { return this.state.loading; }
  get error() { return this.state.error; }
  get lastSearch() { 
    return {
      location: this.state.lastSearchLocation,
      radius: this.state.lastSearchRadius,
      categories: this.state.lastSearchCategories
    };
  }

  async discoverPOIs(
    location: LatLng, 
    radius: number, 
    categories: POI['category'][]
  ): Promise<POI[]> {
    // Check cache first
    const cacheKey = this.getCacheKey(location, radius, categories);
    const cached = this.state.cache.get(cacheKey);
    
    if (cached && (Date.now() - cached.timestamp) < config.performance.cacheTimeout) {
      console.log('🗺️ Using cached POIs');
      this.updatePOIs(cached.pois);
      return cached.pois;
    }

    // Set loading state
    this.setLoading(true);
    this.setError(null);

    try {
      console.log(`🔍 Discovering POIs near (${location.lat}, ${location.lng}) within ${radius}m for categories:`, categories);
      
      const pois = await poiService.discoverPOIs(location, radius, categories);
      
      // Limit results for performance
      const limitedPOIs = pois.slice(0, config.performance.maxPOIsPerRequest);
      
      // Update state
      this.state.lastSearchLocation = location;
      this.state.lastSearchRadius = radius;
      this.state.lastSearchCategories = categories;
      
      // Cache results
      this.state.cache.set(cacheKey, {
        pois: limitedPOIs,
        timestamp: Date.now()
      });
      
      // Clean old cache entries
      this.cleanCache();
      
      this.updatePOIs(limitedPOIs);
      console.log(`✅ Found ${limitedPOIs.length} POIs`);
      
      return limitedPOIs;
    } catch (error) {
      console.error('POI discovery failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to discover POIs';
      this.setError(errorMessage);
      return [];
    } finally {
      this.setLoading(false);
    }
  }

  async refreshLastSearch(): Promise<POI[]> {
    if (!this.state.lastSearchLocation) {
      throw new Error('No previous search to refresh');
    }
    
    // Clear cache for this search
    const cacheKey = this.getCacheKey(
      this.state.lastSearchLocation,
      this.state.lastSearchRadius,
      this.state.lastSearchCategories
    );
    this.state.cache.delete(cacheKey);
    
    return this.discoverPOIs(
      this.state.lastSearchLocation,
      this.state.lastSearchRadius,
      this.state.lastSearchCategories
    );
  }

  selectPOI(poi: POI): void {
    // Add selection logic if needed
    console.log('🗺️ POI selected:', poi.name);
  }

  clearPOIs(): void {
    this.updatePOIs([]);
    this.setError(null);
  }

  clearCache(): void {
    this.state.cache.clear();
    console.log('🗺️ POI cache cleared');
  }

  private updatePOIs(pois: POI[]): void {
    this.state.discoveredPOIs = pois;
    discoveredPOIs.set(pois);
  }

  private setLoading(loading: boolean): void {
    this.state.loading = loading;
    poiLoading.set(loading);
  }

  private setError(error: string | null): void {
    this.state.error = error;
    poiError.set(error);
  }

  private getCacheKey(location: LatLng, radius: number, categories: POI['category'][]): string {
    return `${location.lat.toFixed(4)},${location.lng.toFixed(4)}_${radius}_${categories.sort().join(',')}`;
  }

  private cleanCache(): void {
    const now = Date.now();
    const expired = Array.from(this.state.cache.entries())
      .filter(([_, value]) => (now - value.timestamp) > config.performance.cacheTimeout)
      .map(([key, _]) => key);
    
    expired.forEach(key => this.state.cache.delete(key));
    
    if (expired.length > 0) {
      console.log(`🗑️ Cleaned ${expired.length} expired POI cache entries`);
    }
  }

  // Debug methods
  getCacheStats() {
    return {
      size: this.state.cache.size,
      entries: Array.from(this.state.cache.keys())
    };
  }
}

// Export singleton instance
export const poiStore = new POIStore();

// Export helper functions
export function calculateDistance(
  lat1: number, lng1: number, 
  lat2: number, lng2: number
): number {
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

export function addDistanceToPOIs(pois: POI[], userLocation: LatLng): POI[] {
  return pois.map(poi => ({
    ...poi,
    distance: calculateDistance(userLocation.lat, userLocation.lng, poi.lat, poi.lng)
  }));
}

export function filterPOIsByDistance(pois: POI[], maxDistance: number): POI[] {
  return pois.filter(poi => !poi.distance || poi.distance <= maxDistance);
}

export function sortPOIsByDistance(pois: POI[]): POI[] {
  return [...pois].sort((a, b) => {
    if (a.distance === undefined && b.distance === undefined) return 0;
    if (a.distance === undefined) return 1;
    if (b.distance === undefined) return -1;
    return a.distance - b.distance;
  });
}

export function groupPOIsByCategory(pois: POI[]): Record<POI['category'], POI[]> {
  return pois.reduce((groups, poi) => {
    if (!groups[poi.category]) {
      groups[poi.category] = [];
    }
    groups[poi.category].push(poi);
    return groups;
  }, {} as Record<POI['category'], POI[]>);
}
