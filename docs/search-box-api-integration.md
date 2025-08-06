# MapBox Search Box API Integration

## Overview

Die Roadtripper App wurde erfolgreich von der veralteten MapBox Geocoding v5 API auf die moderne **MapBox Search Box API** migriert. Dies bringt deutlich bessere POI-Daten und erweiterte Kategorie-Unterstützung.

## ✨ Neue Features

### 🔍 Search Box API Service
- **Moderne POI-Suche** mit erweiterten Kategorien
- **Bessere Datenqualität** durch Foursquare/SafeGraph Integration
- **Session-basierte Abrechnung** für Kostenoptimierung
- **Southwest USA optimiert** mit 50+ POI-Kategorien

### 📍 POI-Kategorien
```typescript
// Natur & National Parks
'national_park', 'state_park', 'scenic_viewpoint', 'hiking_trail', 
'hot_springs', 'desert', 'canyon', 'cave', 'waterfall'

// Kultur & Geschichte  
'museum', 'historic_site', 'monument', 'ghost_town', 'mission',
'cultural_center', 'art_gallery', 'archaeological_site'

// Entertainment & Aktivitäten
'casino', 'amusement_park', 'theme_park', 'water_park', 'zoo',
'observatory', 'theater', 'shopping_center'

// Gastronomie
'restaurant', 'fast_food', 'cafe', 'bar', 'brewery', 'winery',
'barbecue', 'mexican_restaurant', 'steakhouse', 'diner'

// Unterkunft
'hotel', 'motel', 'resort', 'bed_and_breakfast', 'cabin',
'campground', 'rv_park', 'vacation_rental'

// Services
'gas_station', 'electric_vehicle_charging_station', 'rest_area',
'visitor_center', 'hospital', 'grocery_store'
```

## 🏗️ API-Architektur

### Endpoint
```
POST /api/proxy/pois-along-route
```

### Request
```json
{
  "polyline": "encoded_polyline_string",
  "radius": 10000,
  "categories": ["national_park", "restaurant", "hotel"]
}
```

### Response
```json
{
  "success": true,
  "pois": [
    {
      "id": "mapbox_id",
      "name": "Grand Canyon National Park",
      "description": "Iconic natural wonder",
      "coordinates": [-112.1129, 36.1069],
      "category": "national_park",
      "categories": ["national_park", "scenic_viewpoint"],
      "rating": 4.8,
      "address": "Grand Canyon National Park, AZ",
      "region": "Southwest USA",
      "poi_categories": ["national_park"],
      "properties": {
        "landmark": true,
        "maki": "park",
        "isNationalPark": true,
        "hasExternalData": true
      }
    }
  ],
  "stats": {
    "apiVersion": "Search Box API v1",
    "searchDuration": "1250ms",
    "totalPOIs": 25,
    "categoriesFound": ["national_park", "restaurant", "hotel"],
    "landmarks": 8,
    "nationalParks": 3
  },
  "api_info": {
    "service": "MapBox Search Box API",
    "version": "v1",
    "modernFeatures": true,
    "enhancedPOIData": true
  }
}
```

## 🎯 Service-Klasse

### SearchBoxAPIService

```typescript
import { SearchBoxAPIService } from '$lib/services/SearchBoxAPIService';

const service = new SearchBoxAPIService(MAPBOX_TOKEN);

const pois = await service.searchPOIsByCategory({
  categories: ['national_park', 'restaurant'],
  routeCoordinates: [[lng1, lat1], [lng2, lat2]],
  radius: 10000, // 10km
  limit: 50
});
```

### Hauptmethoden
- `searchPOIsByCategory()` - Suche POIs entlang Route
- `getAvailableCategories()` - Verfügbare Kategorien auflisten
- `generateSessionToken()` - Session-Token für Billing

## 🚀 Performance

### Optimierungen
- **Route-Sampling** alle 20km oder 2×Radius
- **Batch-Requests** für bessere API-Effizienz
- **Deduplizierung** basierend auf Name + Koordinaten
- **Regional-Filtering** nur Southwest USA
- **Session-Token** für Kostenoptimierung

### Metriken
- **API-Antwortzeit**: ~1-2 Sekunden
- **POI-Limit**: 50 pro Route
- **Radius**: Standard 10km, max 50km
- **Sample-Punkte**: 3-15 je nach Route-Länge

## 🔄 Migration von Legacy API

### Änderungen
1. **Service-Austausch**: `MapBoxGeocodingService` → `SearchBoxAPIService`
2. **Neue Datenstruktur**: Erweiterte POI-Properties
3. **Verbesserte Kategorien**: 50+ statt 7 Kategorien
4. **Session-Billing**: Optimierte Kostenstruktur

### Kompatibilität
- **Rückwärtskompatibel**: Alte POI-Struktur wird weiterhin unterstützt
- **Fallback-Modus**: Bei API-Fehlern werden Basis-POIs zurückgegeben
- **Graceful Degradation**: App funktioniert auch ohne Search Box API

## 📊 Monitoring

### Logs
```
🔍 Search Box API Request: { categories: 3, radius: 10000 }
🗺️ Decoded 247 route coordinates
🎯 Search Box API completed in 1250ms
🏞️ Found 25 POIs along route
📊 Search Box API Stats: { landmarks: 8, nationalParks: 3 }
```

### Metriken
- Search-Dauer in ms
- Anzahl gefundener POIs
- Kategorien-Verteilung
- Landmarks/National Parks
- External Data Coverage

## 🧪 Testing

### E2E Tests
```bash
npm run test:e2e poi-integration.spec.ts
```

Die bestehenden Playwright-Tests funktionieren weiterhin, da die API-Response-Struktur kompatibel bleibt.

### Unit Tests
```bash
npm run test poi-utils.test.ts
```

## 🔧 Konfiguration

### Environment Variables
```bash
MAPBOX_PUBLIC_TOKEN="pk.eyJ1IjoiaW5waGlsdHJhdGlvbiIsImEiOiJjbHcwdGFwZ2cwbWd3MmlvNW5zZGQ4M2NnIn0.n4w4o42n2EI4A4u6eArL6w"
```

### API-Limits
- **Requests/Monat**: Abhängig von MapBox-Plan
- **Session-Billing**: Optimiert für Interactive Search
- **Category Search**: Separater API-Endpoint

## 🎉 Vorteile der Search Box API

1. **Bessere POI-Daten** durch externe Quellen (Foursquare, SafeGraph)
2. **Mehr Kategorien** (50+ vs. 7 bei Geocoding v5)
3. **Moderne API-Architektur** mit Session-Billing
4. **Erweiterte Properties** (Telefon, Website, Bewertungen)
5. **Bessere Performance** durch Category Search
6. **Zukunftssicher** - aktuelle MapBox API

Die Migration macht die Roadtripper-App deutlich moderner und bietet Nutzern viel bessere POI-Daten für ihre Southwest USA Roadtrips! 🏜️🚗
