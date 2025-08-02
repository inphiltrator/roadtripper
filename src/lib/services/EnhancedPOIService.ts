import type { POI } from '$lib/types';

export interface LatLng {
  lat: number;
  lng: number;
}

export class EnhancedPOIService {
  private overpassEndpoint: string;
  private southwestSpecialCategories: Record<string, string[]>;

  constructor(overpassEndpoint?: string) {
    this.overpassEndpoint = overpassEndpoint || 'https://overpass.private.coffee/api/interpreter';
    this.initializeSouthwestCategories();
    console.log('🗺️ Enhanced POI Service initialized with Southwest USA specializations');
  }

  async discoverPOIs(
    location: LatLng, 
    radius: number, 
    categories: POI['category'][]
  ): Promise<POI[]> {
    try {
      const query = this.buildOverpassQuery(location, radius, categories);
      
      const response = await fetch(this.overpassEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json();
      return this.processOverpassResponse(data);
    } catch (error) {
      console.error('POI discovery failed:', error);
      // Return sample Southwest POIs as fallback
      return this.getSampleSouthwestPOIs(location, radius, categories);
    }
  }

  private buildOverpassQuery(location: LatLng, radius: number, categories: POI['category'][]): string {
    const queryParts = categories.map(category => {
      switch(category) {
        case 'national_park':
          return `
            node["leisure"="park"]["protection_title"](around:${radius},${location.lat},${location.lng});
            node["boundary"="national_park"](around:${radius},${location.lat},${location.lng});
            node["leisure"="nature_reserve"]["name"~"National"](around:${radius},${location.lat},${location.lng});
            way["leisure"="park"]["protection_title"](around:${radius},${location.lat},${location.lng});
            way["boundary"="national_park"](around:${radius},${location.lat},${location.lng});
          `;
        
        case 'state_park':
          return `
            node["leisure"="park"]["park_type"="state_park"](around:${radius},${location.lat},${location.lng});
            node["leisure"="park"]["name"~"State Park"](around:${radius},${location.lat},${location.lng});
            node["boundary"="protected_area"]["protect_class"="5"](around:${radius},${location.lat},${location.lng});
            way["leisure"="park"]["park_type"="state_park"](around:${radius},${location.lat},${location.lng});
          `;
        
        case 'camping':
          return `
            node["tourism"="camp_site"](around:${radius},${location.lat},${location.lng});
            node["tourism"="caravan_site"](around:${radius},${location.lat},${location.lng});
            node["amenity"="camping"](around:${radius},${location.lat},${location.lng});
            node["tourism"="wilderness_hut"](around:${radius},${location.lat},${location.lng});
          `;
        
        case 'dining':
          return `
            node["amenity"="restaurant"](around:${radius},${location.lat},${location.lng});
            node["amenity"="cafe"](around:${radius},${location.lat},${location.lng});
            node["amenity"="fast_food"](around:${radius},${location.lat},${location.lng});
            node["amenity"="food_court"](around:${radius},${location.lat},${location.lng});
            node["amenity"="bar"](around:${radius},${location.lat},${location.lng});
            node["amenity"="pub"](around:${radius},${location.lat},${location.lng});
          `;
        
        case 'attraction':
          return `
            node["tourism"="attraction"](around:${radius},${location.lat},${location.lng});
            node["tourism"="viewpoint"](around:${radius},${location.lat},${location.lng});
            node["historic"](around:${radius},${location.lat},${location.lng});
            node["tourism"="museum"](around:${radius},${location.lat},${location.lng});
            node["tourism"="theme_park"](around:${radius},${location.lat},${location.lng});
            node["natural"="peak"](around:${radius},${location.lat},${location.lng});
            way["tourism"="attraction"](around:${radius},${location.lat},${location.lng});
          `;
        
        case 'lodging':
          return `
            node["tourism"="hotel"](around:${radius},${location.lat},${location.lng});
            node["tourism"="motel"](around:${radius},${location.lat},${location.lng});
            node["tourism"="guest_house"](around:${radius},${location.lat},${location.lng});
            node["tourism"="hostel"](around:${radius},${location.lat},${location.lng});
            node["tourism"="apartment"](around:${radius},${location.lat},${location.lng});
            node["tourism"="resort"](around:${radius},${location.lat},${location.lng});
          `;
        
        case 'fuel':
          return `
            node["amenity"="fuel"](around:${radius},${location.lat},${location.lng});
            node["shop"="gas"](around:${radius},${location.lat},${location.lng});
            node["amenity"="charging_station"](around:${radius},${location.lat},${location.lng});
          `;
        
        default:
          return '';
      }
    }).filter(part => part.trim()).join('\n');

    return `[out:json][timeout:25];
(
${queryParts}
);
out body;
>;
out skel qt;`;
  }

  private processOverpassResponse(data: any): POI[] {
    const pois: POI[] = [];
    
    if (data.elements) {
      data.elements.forEach((element: any) => {
        if (element.tags && element.tags.name) {
          const poi: POI = {
            id: `overpass_${element.id}`,
            name: element.tags.name,
            lat: element.lat || (element.center && element.center.lat),
            lng: element.lon || (element.center && element.center.lon),
            category: this.mapOverpassCategory(element.tags),
            description: element.tags.description || this.generateDescription(element.tags),
            rating: this.extractRating(element.tags),
            tags: this.extractTags(element.tags),
            website: element.tags.website,
            phone: element.tags.phone,
            admission: this.extractAdmission(element.tags)
          };

          if (poi.lat && poi.lng) {
            pois.push(poi);
          }
        }
      });
    }

    return pois;
  }

  private mapOverpassCategory(tags: Record<string, string>): POI['category'] {
    // National Parks
    if (tags.boundary === 'national_park' || 
        (tags.leisure === 'park' && tags.protection_title) ||
        (tags.leisure === 'nature_reserve' && tags.name?.includes('National'))) {
      return 'national_park';
    }
    
    // State Parks
    if ((tags.leisure === 'park' && tags.park_type === 'state_park') ||
        (tags.leisure === 'park' && tags.name?.includes('State Park')) ||
        (tags.boundary === 'protected_area' && tags.protect_class === '5')) {
      return 'state_park';
    }
    
    // Camping
    if (tags.tourism === 'camp_site' || 
        tags.tourism === 'caravan_site' ||
        tags.amenity === 'camping' ||
        tags.tourism === 'wilderness_hut') {
      return 'camping';
    }
    
    // Dining
    if (tags.amenity === 'restaurant' || 
        tags.amenity === 'cafe' ||
        tags.amenity === 'fast_food' ||
        tags.amenity === 'food_court' ||
        tags.amenity === 'bar' ||
        tags.amenity === 'pub') {
      return 'dining';
    }
    
    // Attractions
    if (tags.tourism === 'attraction' ||
        tags.tourism === 'viewpoint' ||
        tags.tourism === 'museum' ||
        tags.tourism === 'theme_park' ||
        tags.historic ||
        tags.natural === 'peak') {
      return 'attraction';
    }
    
    // Lodging
    if (tags.tourism === 'hotel' ||
        tags.tourism === 'motel' ||
        tags.tourism === 'guest_house' ||
        tags.tourism === 'hostel' ||
        tags.tourism === 'apartment' ||
        tags.tourism === 'resort') {
      return 'lodging';
    }
    
    // Fuel
    if (tags.amenity === 'fuel' || 
        tags.shop === 'gas' ||
        tags.amenity === 'charging_station') {
      return 'fuel';
    }
    
    return 'attraction'; // Default
  }

  private generateDescription(tags: Record<string, string>): string {
    if (tags.tourism === 'attraction') return 'Popular tourist attraction';
    if (tags.tourism === 'viewpoint') return 'Scenic viewpoint with beautiful views';
    if (tags.leisure === 'park') return 'Natural park area';
    if (tags.amenity === 'restaurant') return 'Restaurant serving local cuisine';
    if (tags.tourism === 'hotel') return 'Accommodation facility';
    return 'Point of interest';
  }

  private extractRating(tags: Record<string, string>): number | undefined {
    if (tags.rating) {
      const rating = parseFloat(tags.rating);
      return !isNaN(rating) ? rating : undefined;
    }
    return undefined;
  }

  private extractTags(tags: Record<string, string>): string[] {
    const extractedTags: string[] = [];
    
    if (tags.cuisine) extractedTags.push(tags.cuisine);
    if (tags.stars) extractedTags.push(`${tags.stars} stars`);
    if (tags.wheelchair === 'yes') extractedTags.push('wheelchair accessible');
    if (tags.internet_access === 'wlan') extractedTags.push('wifi');
    if (tags.smoking === 'no') extractedTags.push('non-smoking');
    
    return extractedTags;
  }

  private extractAdmission(tags: Record<string, string>): POI['admission'] | undefined {
    if (tags.fee === 'no') {
      return { free: true };
    }
    
    if (tags.fee === 'yes' && tags.charge) {
      const charge = tags.charge.replace(/[^\d.]/g, '');
      const amount = parseFloat(charge);
      if (!isNaN(amount)) {
        return { adult: amount };
      }
    }
    
    return undefined;
  }

  /**
   * Search POIs with fuzzy matching for Spanish names and Southwest locations
   */
  async searchPOIsFuzzy(query: string, location?: LatLng, radius: number = 50000): Promise<POI[]> {
    // Normalize query for better matching
    const normalizedQuery = this.normalizeSpanishQuery(query);
    
    try {
      const searchQuery = this.buildFuzzySearchQuery(normalizedQuery, location, radius);
      
      const response = await fetch(this.overpassEndpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(searchQuery)}`
      });

      if (!response.ok) {
        throw new Error(`Overpass API error: ${response.status}`);
      }

      const data = await response.json();
      return this.processOverpassResponse(data);
    } catch (error) {
      console.error('Fuzzy POI search failed:', error);
      return this.getFuzzySampleResults(query);
    }
  }

  /**
   * Get Southwest-specific POI categories
   */
  getSouthwestCategories(): Record<string, { name: string; subcategories: string[] }> {
    return {
      national_parks: {
        name: 'National Parks',
        subcategories: ['Grand Canyon', 'Zion', 'Bryce Canyon', 'Death Valley', 'Joshua Tree', 'Yosemite']
      },
      ghost_towns: {
        name: 'Ghost Towns',
        subcategories: ['Calico', 'Bodie', 'Goldfield', 'Rhyolite', 'Jerome']
      },
      scenic_viewpoints: {
        name: 'Scenic Viewpoints',
        subcategories: ['Valley of Fire', 'Antelope Canyon', 'Horseshoe Bend', 'Sedona Red Rocks']
      },
      route66_attractions: {
        name: 'Route 66 Attractions',
        subcategories: ['Santa Monica Pier', 'Seligman', 'Wigwam Motel', 'Petrified Forest']
      },
      desert_oases: {
        name: 'Desert Oases',
        subcategories: ['Palm Springs', 'Twentynine Palms', 'Borrego Springs']
      },
      historic_missions: {
        name: 'Historic Missions',
        subcategories: ['San Juan Capistrano', 'San Carlos Borromeo', 'Santa Barbara Mission']
      }
    };
  }

  private initializeSouthwestCategories(): void {
    this.southwestSpecialCategories = {
      'Spanish Names': [
        'San', 'Santa', 'Los', 'Las', 'El', 'La', 'Rio', 'Sierra', 'Valle', 'Mesa', 'Pueblo'
      ],
      'Desert Features': [
        'Desert', 'Valley', 'Canyon', 'Mesa', 'Butte', 'Wash', 'Springs', 'Oasis'
      ],
      'Route 66 Keywords': [
        'Route 66', 'Historic Route', 'Mother Road', 'Main Street America'
      ],
      'National Park Features': [
        'National Park', 'Visitor Center', 'Scenic Drive', 'Overlook', 'Trail Head'
      ]
    };
  }

  private normalizeSpanishQuery(query: string): string {
    // Common Spanish-English translations for Southwest locations
    const translations: Record<string, string> = {
      'muerte': 'death',
      'valle': 'valley',
      'sierra': 'mountain',
      'rio': 'river',
      'lago': 'lake',
      'montaña': 'mountain',
      'desierto': 'desert',
      'ciudad': 'city',
      'pueblo': 'town'
    };

    let normalized = query.toLowerCase();
    Object.entries(translations).forEach(([spanish, english]) => {
      normalized = normalized.replace(new RegExp(spanish, 'g'), english);
    });

    return normalized;
  }

  private buildFuzzySearchQuery(query: string, location?: LatLng, radius: number = 50000): string {
    const locationFilter = location 
      ? `(around:${radius},${location.lat},${location.lng})` 
      : '(area:3602385516)';
    
    // Build fuzzy search with regex patterns
    const queryPattern = query.split(' ').map(word => `.*${word}.*`).join('|');
    
    return `[out:json][timeout:25];
(
  node["name"~"${queryPattern}",i]${locationFilter};
  way["name"~"${queryPattern}",i]${locationFilter};
  relation["name"~"${queryPattern}",i]${locationFilter};
);
out body;
>;
out skel qt;`;
  }

  private getFuzzySampleResults(query: string): POI[] {
    const allSamplePOIs = this.getSampleSouthwestPOIs({ lat: 36.0, lng: -115.0 }, 500000, []);
    
    // Simple fuzzy matching
    const queryLower = query.toLowerCase();
    return allSamplePOIs.filter(poi => 
      poi.name.toLowerCase().includes(queryLower) ||
      poi.description?.toLowerCase().includes(queryLower) ||
      poi.tags?.some(tag => tag.toLowerCase().includes(queryLower))
    );
  }

  private getSampleSouthwestPOIs(location: LatLng, radius: number, categories: POI['category'][]): POI[] {
    const samplePOIs: POI[] = [
      {
        id: 'grand-canyon-np',
        name: 'Grand Canyon National Park',
        lat: 36.1069,
        lng: -112.1129,
        category: 'national_park',
        description: 'One of the most spectacular natural wonders in the world',
        rating: 4.8,
        tags: ['scenic', 'hiking', 'photography'],
        admission: { adult: 35 }
      },
      {
        id: 'zion-np',
        name: 'Zion National Park',
        lat: 37.2982,
        lng: -113.0263,
        category: 'national_park',
        description: 'Stunning red cliffs and narrow canyons',
        rating: 4.9,
        tags: ['hiking', 'canyoneering'],
        admission: { adult: 35 }
      },
      {
        id: 'antelope-canyon',
        name: 'Antelope Canyon',
        lat: 36.8619,
        lng: -111.3743,
        category: 'attraction',
        description: 'Famous slot canyon with incredible light beams',
        rating: 4.7,
        tags: ['photography', 'guided tours']
      },
      {
        id: 'route66-seligman',
        name: 'Historic Route 66 - Seligman',
        lat: 35.3256,
        lng: -112.8747,
        category: 'attraction',
        description: 'Birthplace of Historic Route 66',
        rating: 4.3,
        tags: ['historic', 'americana']
      },
      {
        id: 'las-vegas-strip',
        name: 'Las Vegas Strip',
        lat: 36.1147,
        lng: -115.1728,
        category: 'attraction',
        description: 'Famous entertainment district',
        rating: 4.2,
        tags: ['entertainment', 'nightlife']
      }
    ];

    // Filter by categories if specified
    if (categories.length > 0) {
      return samplePOIs.filter(poi => categories.includes(poi.category));
    }

    return samplePOIs;
  }
}
