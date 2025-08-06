import { config } from '$lib/config/env';
import { RegionalService } from './RegionalService';

export interface SearchBoxPOI {
  id: string;
  name: string;
  description?: string;
  coordinates: [number, number]; // [lng, lat]
  category: string[];
  rating?: number;
  distance?: number; // in meters from route
  address: string;
  region: string;
  poi_category?: string[];
  poi_category_ids?: string[];
  properties: {
    tel?: string;
    website?: string;
    address_line1?: string;
    address_line2?: string;
    postcode?: string;
    place?: string;
    region?: string;
    country?: string;
    wikidata?: string;
    landmark?: boolean;
    maki?: string; // MapBox icon ID
  };
}

export interface SearchBoxSuggestion {
  name: string;
  name_preferred?: string;
  mapbox_id: string;
  feature_type: string;
  address?: string;
  full_address?: string;
  place_formatted?: string;
  poi_category?: string[];
  poi_category_ids?: string[];
  external_ids?: {
    foursquare?: string;
    safegraph?: string;
  };
  metadata?: {
    iso_3166_1?: string;
    iso_3166_2?: string;
  };
  context?: {
    country?: {
      name: string;
      country_code: string;
      country_code_alpha_3: string;
    };
    region?: {
      name: string;
      region_code: string;
      region_code_full: string;
    };
    place?: {
      name: string;
    };
    postcode?: {
      name: string;
    };
    district?: {
      name: string;
    };
    locality?: {
      name: string;
    };
    neighborhood?: {
      name: string;
    };
    street?: {
      name: string;
    };
    address?: {
      address_number?: string;
      street_name?: string;
    };
  };
  coordinates: [number, number]; // [lng, lat]
  bbox?: [number, number, number, number]; // [min_lng, min_lat, max_lng, max_lat]
  language?: string;
  maki?: string;
}

export interface CategorySearchParams {
  category: string;
  bbox?: string; // "min_lng,min_lat,max_lng,max_lat" 
  proximity?: string; // "lng,lat" or "ip"
  limit?: number;
  language?: string;
  country?: string;
  session_token: string;
}

export interface CategorySearchResponse {
  type: 'FeatureCollection';
  features: GeoJSONFeature[];
  attribution: string;
  response_id: string;
}

export interface GeoJSONFeature {
  type: 'Feature';
  geometry: {
    coordinates: [number, number];
    type: 'Point';
  };
  properties: {
    name: string;
    mapbox_id: string;
    feature_type: string;
    address?: string;
    full_address?: string;
    place_formatted?: string;
    poi_category?: string[];
    poi_category_ids?: string[];
    external_ids?: {
      dataplor?: string;
      foursquare?: string;
      safegraph?: string;
    };
    context?: {
      country?: {
        name: string;
        country_code: string;
        country_code_alpha_3: string;
      };
      region?: {
        name: string;
        region_code: string;
        region_code_full: string;
      };
      place?: {
        name: string;
      };
      postcode?: {
        name: string;
      };
      district?: {
        name: string;
      };
      locality?: {
        name: string;
      };
      neighborhood?: {
        name: string;
      };
      street?: {
        name: string;
      };
      address?: {
        name: string;
        address_number?: string;
        street_name?: string;
      };
    };
    coordinates?: {
      latitude: number;
      longitude: number;
      routable_points?: {
        name: string;
        latitude: number;
        longitude: number;
      }[];
    };
    language?: string;
    maki?: string;
    metadata?: {
      phone?: string;
      website?: string;
      open_hours?: any;
    };
    distance?: number;
  };
}

export class SearchBoxAPIService {
  private accessToken: string;
  private baseUrl: string = 'https://api.mapbox.com/search/searchbox/v1';
  private regionalService: RegionalService;

  // Official MapBox Search Box API Categories (using actual canonical_ids from API)
  public readonly SOUTHWEST_POI_CATEGORIES = {
    // Financial Services
    'atm': 'atm',
    'bank': 'bank',
    
    // Automotive
    'gas_station': 'gas_station',
    'auto_repair': 'auto_repair',
    'charging_station': 'charging_station',
    'car_wash': 'car_wash',
    'car_rental': 'car_rental',
    'car_dealership': 'car_dealership',
    
    // Dining & Entertainment
    'restaurant': 'restaurant',
    'cafe': 'cafe',
    'coffee': 'coffee',
    'coffee_shop': 'coffee_shop',
    'bar': 'bar',
    'pub': 'pub',
    'nightclub': 'nightclub',
    'brewery': 'brewery',
    'winery': 'winery',
    'fast_food': 'fast_food',
    'pizza_restaurant': 'pizza_restaurant',
    'mexican_restaurant': 'mexican_restaurant',
    'italian_restaurant': 'italian_restaurant',
    'chinese_restaurant': 'chinese_restaurant',
    'thai_restaurant': 'thai_restaurant',
    'japanese_restaurant': 'japanese_restaurant',
    'korean_restaurant': 'korean_restaurant',
    'american_restaurant': 'american_restaurant',
    'steakhouse': 'steakhouse',
    'barbeque_restaurant': 'barbeque_restaurant',
    'diner_restaurant': 'diner_restaurant',
    'bakery': 'bakery',
    'ice_cream': 'ice_cream',
    
    // Shopping
    'shopping_mall': 'shopping_mall',
    'grocery': 'grocery',
    'supermarket': 'supermarket',
    'convenience_store': 'convenience_store',
    'clothing_store': 'clothing_store',
    'shoe_store': 'shoe_store',
    'electronics_shop': 'electronics_shop',
    'furniture_store': 'furniture_store',
    'hardware_store': 'hardware_store',
    'book_store': 'book_store',
    'jewelry_store': 'jewelry_store',
    'gift_shop': 'gift_shop',
    'department_store': 'department_store',
    
    // Lodging
    'hotel': 'hotel',
    'motel': 'motel',
    'resort': 'resort',
    'hostel': 'hostel',
    'bed_and_breakfast': 'bed_and_breakfast',
    'vacation_rental': 'vacation_rental',
    'campground': 'campground',
    
    // Healthcare
    'hospital': 'hospital',
    'pharmacy': 'pharmacy',
    'emergency_room': 'emergency_room',
    'doctors_office': 'doctors_office',
    'medical_clinic': 'medical_clinic',
    'dentist': 'dentist',
    
    // Transportation
    'parking_lot': 'parking_lot',
    'bus_station': 'bus_station',
    'railway_station': 'railway_station',
    'airport': 'airport',
    'taxi': 'taxi',
    
    // Recreation & Culture
    'park': 'park',
    'tourist_attraction': 'tourist_attraction',
    'museum': 'museum',
    'art_gallery': 'art_gallery',
    'historic_site': 'historic_site',
    'monument': 'monument',
    'zoo': 'zoo',
    'aquarium': 'aquarium',
    'casino': 'casino',
    'theatre': 'theatre',
    'cinema': 'cinema',
    'theme_park': 'theme_park',
    'water_park': 'water_park',
    'golf_course': 'golf_course',
    'fitness_center': 'fitness_center',
    'gym': 'fitness_center',
    'spa': 'spa',
    'library': 'library',
    'beach': 'beach',
    'viewpoint': 'viewpoint',
    'nature_reserve': 'nature_reserve',
    'rest_area': 'rest_area',
    
    // Natural Features
    'lake': 'lake',
    'river': 'river',
    'mountain': 'mountain',
    'waterfall': 'waterfall',
    'cave': 'cave',
    'forest': 'forest',
    
    // Legacy mappings for compatibility
    'national_park': 'park', // No specific national_park category
    'state_park': 'park',
    'attraction': 'tourist_attraction',
    'dining': 'restaurant',
    'lodging': 'hotel',
    'fuel': 'gas_station',
    'camping': 'campground'
  };

  constructor(accessToken?: string) {
    this.accessToken = accessToken || config.mapbox.accessToken || '';
    this.regionalService = new RegionalService();
    console.log('🔍 Search Box API Service initialized for Southwest USA');
  }

  /**
   * Search POIs by category along a route using the Category Search endpoint
   */
  async searchPOIsByCategory(params: {
    categories: string[];
    routeCoordinates: [number, number][];
    radius?: number; // in meters, default 10km
    limit?: number; // default 50
  }): Promise<SearchBoxPOI[]> {
    const { categories, routeCoordinates, radius = 10000, limit = 50 } = params;
    
    if (!this.accessToken) {
      console.warn('Search Box API token not available');
      return [];
    }

    try {
      // Sample points along the route
      const samplePoints = this.sampleRoutePoints(routeCoordinates, radius);
      console.log(`🔍 Searching POIs along ${samplePoints.length} sample points`);
      
      const allPOIs: SearchBoxPOI[] = [];
      const sessionToken = this.generateSessionToken();

      // Search for each category at each sample point
      for (const category of categories) {
        const categoryId = this.SOUTHWEST_POI_CATEGORIES[category as keyof typeof this.SOUTHWEST_POI_CATEGORIES];
        if (!categoryId) continue;

        for (const [lng, lat] of samplePoints) {
          try {
            const results = await this.searchCategoryAtPoint(categoryId, lng, lat, radius / 1000, sessionToken);
            
            // Transform and filter results
            const transformedPOIs = this.transformSearchResults(results.features, category);
            // Filter POIs to Southwest USA region
            const filteredPOIs = transformedPOIs.filter(poi =>
              this.regionalService.isInSouthwestRegion(poi.coordinates[1], poi.coordinates[0])
            );
            
            allPOIs.push(...filteredPOIs);
          } catch (error) {
            console.error(`Error searching category ${category} at point [${lng}, ${lat}]:`, error);
          }
        }
      }

      // Deduplicate and sort by relevance
      const uniquePOIs = this.deduplicatePOIs(allPOIs);
      const sortedPOIs = uniquePOIs
        .sort((a, b) => (a.distance || 0) - (b.distance || 0))
        .slice(0, limit);

      console.log(`🎯 Found ${sortedPOIs.length} unique POIs`);
      return sortedPOIs;

    } catch (error) {
      console.error('Search Box API error:', error);
      return this.getFallbackPOIs(categories);
    }
  }

  /**
   * Search for POIs by category at a specific point using /forward endpoint
   */
  private async searchCategoryAtPoint(
    categoryId: string, 
    lng: number, 
    lat: number, 
    radiusKm: number,
    sessionToken: string
  ): Promise<CategorySearchResponse> {
    const bbox = this.calculateBBox(lng, lat, radiusKm);
    
    // Use /forward endpoint with category as search query
    const params = new URLSearchParams({
      q: categoryId, // Search query - use category name as search term
      proximity: `${lng},${lat}`,
      bbox: bbox,
      country: 'us',
      limit: '10',
      language: 'en',
      types: 'poi', // Limit to POI results only
      access_token: this.accessToken
    });

    const url = `${this.baseUrl}/forward?${params.toString()}`;
    
    console.log(`🌐 Making Mapbox API call to: ${url}`);
    
    const response = await fetch(url);
    if (!response.ok) {
      console.warn(`Search Box API error ${response.status}: ${response.statusText}`);
      
      // Try to get more detailed error information
      try {
        const errorData = await response.text();
        console.error('Search Box API error details:', errorData);
      } catch (e) {
        console.error('Could not parse error response:', e);
      }
      
      if (response.status === 401) {
        throw new Error('Search Box API not authorized - token may not have Search Box permissions');
      }
      throw new Error(`Search Box API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`🔍 Search Box API found ${data.features?.length || 0} features for category ${categoryId}`);
    return data;
  }

  /**
   * Transform Search Box API results to our POI format
   */
  private transformSearchResults(features: GeoJSONFeature[], category: string): SearchBoxPOI[] {
    return features.map(feature => ({
      id: feature.properties.mapbox_id,
      name: feature.properties.name,
      description: this.generateDescriptionFromFeature(feature),
      coordinates: feature.geometry.coordinates,
      category: this.mapCategoryFromFeature(feature, category),
      address: feature.properties.full_address || feature.properties.address || feature.properties.place_formatted || '',
      region: 'Southwest USA',
      poi_category: feature.properties.poi_category,
      poi_category_ids: feature.properties.poi_category_ids,
      rating: this.generateRatingFromFeature(feature),
      properties: {
        tel: feature.properties.metadata?.phone,
        website: feature.properties.metadata?.website,
        address_line1: feature.properties.context?.address?.street_name,
        address_line2: feature.properties.context?.place?.name,
        postcode: feature.properties.context?.postcode?.name,
        place: feature.properties.context?.place?.name,
        region: feature.properties.context?.region?.name,
        country: feature.properties.context?.country?.country_code,
        landmark: feature.properties.feature_type === 'poi',
        maki: feature.properties.maki
      }
    }));
  }

  /**
   * Generate session token for billing optimization
   */
  private generateSessionToken(): string {
    return 'roadtripper-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
  }

  /**
   * Calculate bounding box around a point
   */
  private calculateBBox(lng: number, lat: number, radiusKm: number): string {
    const latOffset = radiusKm / 111; // 1 degree lat ≈ 111km
    const lngOffset = radiusKm / (111 * Math.cos(lat * Math.PI / 180));
    
    return [
      lng - lngOffset, // min_lng
      lat - latOffset, // min_lat  
      lng + lngOffset, // max_lng
      lat + latOffset  // max_lat
    ].join(',');
  }

  /**
   * Sample points along route for POI search
   */
  private sampleRoutePoints(coordinates: [number, number][], radiusMeters: number): [number, number][] {
    if (coordinates.length === 0) return [];
    
    const sampledPoints: [number, number][] = [];
    const sampleInterval = Math.min(radiusMeters * 2, 20000); // Sample every 2*radius or 20km max
    
    sampledPoints.push(coordinates[0]); // Always include start
    
    let lastSamplePoint = coordinates[0];
    
    for (let i = 1; i < coordinates.length; i++) {
      const [currLng, currLat] = coordinates[i];
      
      const distanceFromLastSample = this.calculateDistance(
        lastSamplePoint[1], lastSamplePoint[0], 
        currLat, currLng
      );
      
      if (distanceFromLastSample >= sampleInterval) {
        sampledPoints.push([currLng, currLat]);
        lastSamplePoint = [currLng, currLat];
      }
    }
    
    // Always include end point
    const lastPoint = coordinates[coordinates.length - 1];
    if (sampledPoints[sampledPoints.length - 1] !== lastPoint) {
      sampledPoints.push(lastPoint);
    }
    
    return sampledPoints;
  }

  /**
   * Calculate distance between two points using Haversine formula
   */
  private calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000; // Earth's radius in meters
    const dLat = this.toRad(lat2 - lat1);
    const dLng = this.toRad(lng2 - lng1);
    const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
              Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
              Math.sin(dLng/2) * Math.sin(dLng/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  }

  private toRad(value: number): number {
    return value * Math.PI / 180;
  }

  /**
   * Map categories from GeoJSON feature
   */
  private mapCategoryFromFeature(feature: GeoJSONFeature, requestedCategory: string): string[] {
    const categories = [requestedCategory];
    
    if (feature.properties.poi_category) {
      categories.push(...feature.properties.poi_category);
    }
    
    // Map feature types to categories
    const featureTypeMap: Record<string, string[]> = {
      'poi': ['attraction'],
      'address': ['location'],
      'place': ['city'],
      'region': ['region'],
      'country': ['country']
    };
    
    if (featureTypeMap[feature.properties.feature_type]) {
      categories.push(...featureTypeMap[feature.properties.feature_type]);
    }
    
    return [...new Set(categories)]; // Remove duplicates
  }

  /**
   * Map categories from Search Box API suggestions (legacy)
   */
  private mapCategoryFromSuggestion(suggestion: SearchBoxSuggestion, requestedCategory: string): string[] {
    const categories = [requestedCategory];
    
    if (suggestion.poi_category) {
      categories.push(...suggestion.poi_category);
    }
    
    // Map feature types to categories
    const featureTypeMap: Record<string, string[]> = {
      'poi': ['attraction'],
      'address': ['location'],
      'place': ['city'],
      'region': ['region'],
      'country': ['country']
    };
    
    if (featureTypeMap[suggestion.feature_type]) {
      categories.push(...featureTypeMap[suggestion.feature_type]);
    }
    
    return [...new Set(categories)]; // Remove duplicates
  }

  /**
   * Generate description from GeoJSON feature
   */
  private generateDescriptionFromFeature(feature: GeoJSONFeature): string {
    if (feature.properties.poi_category && feature.properties.poi_category.length > 0) {
      return `${feature.properties.poi_category[0].replace(/_/g, ' ')} in ${feature.properties.context?.place?.name || 'Southwest USA'}`;
    }
    
    const featureDescriptions: Record<string, string> = {
      'poi': 'Point of interest',
      'address': 'Address location',
      'place': 'City or town',
      'region': 'Geographic region'
    };
    
    return featureDescriptions[feature.properties.feature_type] || 'Location of interest';
  }

  /**
   * Generate description from Search Box suggestion (legacy)
   */
  private generateDescription(suggestion: SearchBoxSuggestion): string {
    if (suggestion.poi_category && suggestion.poi_category.length > 0) {
      return `${suggestion.poi_category[0].replace(/_/g, ' ')} in ${suggestion.context?.place?.name || 'Southwest USA'}`;
    }
    
    const featureDescriptions: Record<string, string> = {
      'poi': 'Point of interest',
      'address': 'Address location',
      'place': 'City or town',
      'region': 'Geographic region'
    };
    
    return featureDescriptions[suggestion.feature_type] || 'Location of interest';
  }

  /**
   * Generate mock rating for GeoJSON feature
   */
  private generateRatingFromFeature(feature: GeoJSONFeature): number {
    // Generate consistent rating based on feature properties
    const hasExternalIds = feature.properties.external_ids?.foursquare || feature.properties.external_ids?.safegraph;
    const hasPOICategory = feature.properties.poi_category && feature.properties.poi_category.length > 0;
    const isLandmark = feature.properties.feature_type === 'poi';
    const hasMetadata = feature.properties.metadata?.phone || feature.properties.metadata?.website;
    
    let rating = 3.5; // Base rating
    
    if (hasExternalIds) rating += 0.5;
    if (hasPOICategory) rating += 0.3;
    if (isLandmark) rating += 0.4;
    if (feature.properties.maki) rating += 0.2;
    if (hasMetadata) rating += 0.3;
    
    // Add some variation based on name hash
    const nameHash = feature.properties.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    rating += ((nameHash % 10) - 5) / 20; // ±0.25 variation
    
    return Math.min(5.0, Math.max(1.0, Math.round(rating * 10) / 10));
  }

  /**
   * Generate mock rating for POI (legacy)
   */
  private generateRating(suggestion: SearchBoxSuggestion): number {
    // Generate consistent rating based on suggestion properties
    const hasExternalIds = suggestion.external_ids?.foursquare || suggestion.external_ids?.safegraph;
    const hasPOICategory = suggestion.poi_category && suggestion.poi_category.length > 0;
    const isLandmark = suggestion.feature_type === 'poi';
    
    let rating = 3.5; // Base rating
    
    if (hasExternalIds) rating += 0.5;
    if (hasPOICategory) rating += 0.3;
    if (isLandmark) rating += 0.4;
    if (suggestion.maki) rating += 0.2;
    
    // Add some variation based on name hash
    const nameHash = suggestion.name.split('').reduce((a, b) => a + b.charCodeAt(0), 0);
    rating += ((nameHash % 10) - 5) / 20; // ±0.25 variation
    
    return Math.min(5.0, Math.max(1.0, Math.round(rating * 10) / 10));
  }

  /**
   * Deduplicate POIs based on name and coordinates
   */
  private deduplicatePOIs(pois: SearchBoxPOI[]): SearchBoxPOI[] {
    const uniquePOIs = new Map<string, SearchBoxPOI>();
    
    for (const poi of pois) {
      const key = `${poi.name}-${poi.coordinates[0].toFixed(4)}-${poi.coordinates[1].toFixed(4)}`;
      
      // Keep the POI with better rating if duplicate
      if (!uniquePOIs.has(key) || (poi.rating || 0) > (uniquePOIs.get(key)?.rating || 0)) {
        uniquePOIs.set(key, poi);
      }
    }
    
    return Array.from(uniquePOIs.values());
  }

  /**
   * Fallback POIs for when API is not available
   */
  private getFallbackPOIs(categories: string[]): SearchBoxPOI[] {
    const fallbackPOIs: SearchBoxPOI[] = [
      {
        id: 'fallback-grand-canyon',
        name: 'Grand Canyon National Park',
        description: 'Iconic natural wonder and national park',
        coordinates: [-112.1129, 36.1069],
        category: ['national_park', 'scenic_viewpoint'],
        address: 'Grand Canyon National Park, AZ, USA',
        region: 'Southwest USA',
        rating: 4.8,
        properties: {
          landmark: true,
          maki: 'park'
        }
      },
      {
        id: 'fallback-death-valley',
        name: 'Death Valley National Park',
        description: 'Hottest, driest, and lowest national park',
        coordinates: [-117.0794, 36.5054],
        category: ['national_park', 'desert'],
        address: 'Death Valley National Park, CA, USA',
        region: 'Southwest USA',
        rating: 4.5,
        properties: {
          landmark: true,
          maki: 'park'
        }
      },
      {
        id: 'fallback-joshua-tree',
        name: 'Joshua Tree National Park',
        description: 'Unique desert landscape with Joshua trees',
        coordinates: [-116.0713, 33.8734],
        category: ['national_park', 'desert'],
        address: 'Joshua Tree National Park, CA, USA',
        region: 'Southwest USA',
        rating: 4.6,
        properties: {
          landmark: true,
          maki: 'park'
        }
      }
    ];
    
    // Filter fallback POIs based on requested categories
    return fallbackPOIs.filter(poi => 
      categories.some(category => poi.category.includes(category))
    );
  }

  /**
   * Get available POI categories for Southwest USA
   */
  getAvailableCategories(): { id: string; name: string; description: string }[] {
    return [
      { id: 'national_park', name: 'National Parks', description: 'National parks and monuments' },
      { id: 'state_park', name: 'State Parks', description: 'State parks and recreational areas' },
      { id: 'scenic_viewpoint', name: 'Scenic Views', description: 'Viewpoints and scenic overlooks' },
      { id: 'museum', name: 'Museums', description: 'Museums and cultural centers' },
      { id: 'historic_site', name: 'Historic Sites', description: 'Historical landmarks and sites' },
      { id: 'restaurant', name: 'Restaurants', description: 'Dining and food establishments' },
      { id: 'hotel', name: 'Hotels', description: 'Hotels and accommodations' },
      { id: 'campground', name: 'Camping', description: 'Campgrounds and RV parks' },
      { id: 'gas_station', name: 'Gas Stations', description: 'Fuel and charging stations' },
      { id: 'casino', name: 'Casinos', description: 'Casinos and entertainment venues' },
      { id: 'amusement_park', name: 'Theme Parks', description: 'Amusement and theme parks' },
      { id: 'hot_springs', name: 'Hot Springs', description: 'Natural hot springs and spas' }
    ];
  }
}
