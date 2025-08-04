# Agent Guide für Southwest USA Roadtripper

## Projektübersicht

Entwicklung eines selbst gehosteten Roadtrip-Planers speziell für die **Southwest USA Region** (Nevada, Kalifornien, Utah, Arizona) mit KI-gestützter Entwicklung über MCP-Server.

## Geografischer Fokus

**Zielregion:** Southwest USA
- **Staaten:** Nevada, Kalifornien, Utah, Arizona
- **Fläche:** ~1.2 Millionen km²
- **Wichtige Städte:** Los Angeles, Las Vegas, Phoenix, San Francisco, San Diego, Salt Lake City
- **Bekannte Routen:** Route 66, Pacific Coast Highway, National Parks Circuit

## Technischer Stack (Finalisiert)

| Komponente | Tool | Spezifische Konfiguration |
|------------|------|--------------------------|
| Frontend | SvelteKit + TypeScript | Strict mode, dateibasiertes Routing |
| UI | Tailwind CSS | Liquid Glass Design mit backdrop-blur |
| Karte | Native Mapbox GL JS | Direkte Integration mit Access Token ✅ |
| Tiles | Mapbox | Fokus auf Southwest USA Zoom-Level 5-18 |
| Routing | Google Maps Routes API | Region-Filter für Southwest USA |
| Geocoding | MapBox Geocoding API | Großzügiger Free Tier (100k requests/month), bessere Performance als Self-Hosting |
| Datenbank | SQLite + Prisma | Lokale Datei in /data/roadtripper.db |
| MCP-Server | Memory, Filesystem, GitHub, Playwright | Projekt-spezifische Konfiguration |

## Architektur-Prinzipien

### 1. Regional-First Ansatz
- Alle Daten und Services sind auf Southwest USA optimiert
- Reduzierte Hardware-Anforderungen durch regionalen Fokus
- Bessere Performance durch kleinere Datensätze

### 2. Backend-For-Frontend (BFF) Pattern
```
Client → SvelteKit API → External Services
         ↓
       /api/proxy/routing → OpenRouteService
       /api/proxy/geocoding → MapBox API
```

### 3. Projektstruktur
```
src/
├── routes/
│   ├── (public)/          # Landing, About
│   ├── (app)/             # Authentifiziert
│   │   ├── trip/          # Routenplanung
│   │   ├── discover/      # POI-Entdeckung
│   │   └── dashboard/     # Übersicht
│   ├── (auth)/            # Login/Register
│   └── api/               # BFF Endpoints
│       └── proxy/         # Service-Proxies
├── lib/
│   ├── components/        # UI-Komponenten
│   ├── map/              # Karten-Logik
│   ├── server/           # Server-Utils
│   └── stores/           # Svelte Stores
```

## Regionale Anpassungen

### 1. MapBox Geocoding Setup
```typescript
// API-Konfiguration für Southwest USA
const MAPBOX_API_KEY = 'pk.xxx'; // Public Key von MapBox
const SOUTHWEST_BBOX = '-124.5,32.5,-109.0,42.0'; // Southwest USA Bounds

// Geocoding-Anfrage mit regionalen Filtern
const response = await fetch(
  `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?` +
  `access_token=${MAPBOX_API_KEY}&` +
  `country=us&` +
  `bbox=${SOUTHWEST_BBOX}&` +
  `limit=5`
);
```

### 2. Karten-Konfiguration
```typescript
// Initial Map View - Zentrum Southwest USA
const DEFAULT_CENTER = [-115.0, 36.0]; // Near Las Vegas
const DEFAULT_ZOOM = 6;
const MIN_ZOOM = 5;
const MAX_ZOOM = 18;

// Bounding Box für Southwest USA
const SOUTHWEST_BOUNDS = [
  [-124.5, 32.5], // Southwest corner (San Diego area)
  [-109.0, 42.0]  // Northeast corner (Salt Lake City area)
];
```

### 3. POI-Kategorien (Regional)
- **National Parks:** Grand Canyon, Yosemite, Death Valley, Zion
- **Scenic Routes:** Route 66, PCH, Valley of Fire
- **Desert Attractions:** Ghost Towns, Oasen
- **Urban POIs:** Vegas Strip, Hollywood, Golden Gate

## Memory Server Schema

### Entities
```
- Southwest_Roadtripper_Project
- Region_Southwest_USA
  - State_California
  - State_Nevada
  - State_Utah
  - State_Arizona
- Route_[Name] (z.B. Route_66, Route_PCH)
- POI_Category_[Type]
- Technology_[Name]
```

### Relations
```
- "covers_region" (Project -> Region)
- "contains_state" (Region -> State)
- "passes_through" (Route -> State)
- "located_in" (POI -> State)
```

### Observations
```
- Regionale Besonderheiten
- Performance-Metriken für Region
- Beliebte Routen-Patterns
- Saisonale Hinweise
```

## Entwicklungsphasen (Angepasst)

### Phase 1: Regional Setup (2 Tage)
- SvelteKit mit Southwest-Fokus
- MapBox Geocoding API Integration
- MCP-Server Konfiguration

### Phase 2: Karten-Integration (3 Tage) ✅ ABGESCHLOSSEN
- Native Mapbox GL JS mit Southwest Bounds ✅
- Mapbox Styles (Outdoors) für Terrain-Visualisierung ✅
- SouthwestMap-Komponente vollständig funktional ✅
### Phase 3: Routing (4 Tage)

- Google Maps Routes API mit Region-Filter
- Scenic Route Options
- Höhenprofil-Integration

### Phase 4: Datenpersistenz (3 Tage)
- User-Management
- Trip-Speicherung
- Favoriten für regionale POIs

### Phase 5: POI-Features (4 Tage)
- National Park Integration
- Route 66 Highlights
- Wetter-Warnungen (Hitze/Schnee)

### Phase 6: Deployment (2 Tage)
- Docker-Setup
- Performance-Optimierung
- Regional CDN Cache

## Agent-spezifische Anweisungen

### Für alle Agents:
1. **Memory First:** Beginne mit "Remembering..." und rufe regionalen Kontext ab
2. **Regional Focus:** Alle Features sind auf Southwest USA optimiert
3. **Performance:** 16GB RAM Limit beachten, externe APIs helfen dabei
4. **Testing:** Teste mit realen Southwest-Routen (LA→Vegas, Phoenix→Grand Canyon)

### Code-Patterns:
```typescript
// Immer Region-Check
function isInSouthwestRegion(lat: number, lng: number): boolean {
  return lat >= 32.5 && lat <= 42.0 && 
         lng >= -124.5 && lng <= -109.0;
}

// API Calls mit Region-Filter
const routeResponse = await fetch('/api/proxy/routing', {
  method: 'POST',
  body: JSON.stringify({
    coordinates: waypoints,
    options: {
      avoid_countries: ['MEX', 'CAN'], // Nur USA
      maximum_distance: 5000000 // 5000km max
    }
  })
});

// MapBox Geocoding mit Southwest Bounds
const geocodeResponse = await fetch(
  `/api/proxy/geocoding?q=${encodeURIComponent(searchTerm)}`
);
```

## Liquid Glass UI Guidelines

### Farbschema (Desert-inspiriert)
```css
:root {
  --glass-bg: rgba(255, 248, 240, 0.1);
  --glass-border: rgba(255, 215, 0, 0.2);
  --accent-sunset: #FF6B6B;
  --accent-desert: #F4A460;
  --accent-canyon: #CD5C5C;
}

.glass-panel {
  @apply bg-white/10 backdrop-blur-lg 
         ring-1 ring-amber-500/20
         shadow-2xl rounded-2xl;
}
```

### Komponenten-Priorität
1. **GlassRouteCard:** Zeigt Route mit Distanz/Zeit
2. **GlassPOIPanel:** Kategorisierte POI-Liste
3. **GlassWeatherAlert:** Wüsten-/Bergwetter-Warnungen
4. **GlassElevationProfile:** Höhenprofil für Bergpässe

## Test-Szenarien

### Muss-Tests:
1. **Route:** Los Angeles → Las Vegas (klassisch)
2. **POI-Suche:** "National Parks near me"
3. **Grenzen:** Verhindere Routing außerhalb Southwest
4. **Performance:** 50 POIs auf Route 66
5. **Offline:** Cache für beliebte Routen

### Edge-Cases:
- Death Valley im Sommer (Temperatur-Warnung)
- Bergpässe im Winter (Schnee-Warnung)
- Grenzüberschreitend (Mexiko-Warnung)

## Optimierungen

### Hardware-schonend:
- MapBox API: 0GB lokaler Speicher
- Tiles: Cache nur Zoom 8-15 für Region
- POIs: Vorfilterung auf Server-Seite

### Performance:
- Route-Caching für beliebte Strecken
- POI-Clustering ab 20 Markern
- Lazy Loading für Höhenprofile

## Wartung & Updates

### Monatlich:
- MapBox API-Nutzung prüfen
- Neue POIs von Parks Service
- Saisonale Route-Anpassungen

### Quartal:
- Performance-Review
- User-Feedback Integration
- Feature-Priorisierung

## Nützliche Ressourcen

### APIs:
- [NPS API](https://www.nps.gov/subjects/developer/api-documentation.htm) - National Parks
- [NOAA Weather](https://www.weather.gov/documentation/services-web-api) - Wetter-Daten
- [OpenRouteService Docs](https://openrouteservice.org/dev/#/api-docs)
- [MapBox Geocoding](https://docs.mapbox.com/api/search/geocoding/) - Geocoding API

### Datenquellen:
- [Geofabrik Downloads](https://download.geofabrik.de/north-america/us/) - OSM Extracts (optional)
- [Natural Earth](https://www.naturalearthdata.com/) - Terrain-Daten

## Abschluss-Checkliste für Agents

- [ ] Regional Bounds implementiert
- [ ] MapBox Geocoding API konfiguriert
- [ ] Mindestens 5 Test-Routen funktionieren
- [ ] POI-Kategorien vollständig
- [ ] Performance unter 2s für Suche
- [ ] Memory Server dokumentiert Fortschritt
- [ ] Liquid Glass UI konsistent
- [ ] Docker-Setup regional optimiert

---

**Wichtig:** Dieses Guide ersetzt die allgemeinen Abschnitte des Playbooks. Agents sollen sich primär an diesem Dokument orientieren und das Playbook nur für tiefere technische Details konsultieren.
