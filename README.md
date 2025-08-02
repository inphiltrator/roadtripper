# Southwest USA Roadtripper

Ein selbst gehosteter Roadtrip-Planer speziell für die Southwest USA Region (Nevada, Kalifornien, Utah, Arizona).

## Projektstruktur

```
roadtripper/
├── docs/                          # Projektdokumentation
│   ├── ablaufplan-roadtripper.md   # Detaillierter Entwicklungsplan
│   ├── agent-guide.md              # Agent-spezifische Anweisungen
│   └── playbook.md                 # Technische Architektur-Blaupause
├── data/                           # Persistente Daten
│   ├── photon_data/                # Geocoding-Datenbank (wird gefüllt)
│   ├── osm_downloads/              # OSM-Daten (optional)
│   └── roadtripper.db              # SQLite-Datenbank (wird erstellt)
├── src/                            # SvelteKit-Anwendung
├── docker-compose.yml              # Service-Orchestrierung
└── README.md                       # Diese Datei
```

## Erste Schritte

1. **MCP-Server konfigurieren** (siehe docs/ablaufplan-roadtripper.md)
2. **MapBox API-Key besorgen** (siehe data/mapbox-setup.md)
3. **Environment Variables setzen**: `cp .env.example .env`
4. **Entwicklung beginnen** mit Phase 1 aus dem Ablaufplan

## Geografischer Fokus

- **Staaten:** Nevada, Kalifornien, Utah, Arizona  
- **Bounds:** [-124.5, 32.5] bis [-109.0, 42.0]
- **Geocoding:** MapBox API (100k requests/month kostenlos)

## Hardware-Optimiert

- MacBook Air M2 mit 16GB RAM
- Externe APIs für ressourcenintensive Tasks
- Regional begrenzte Features
- 0GB lokaler Speicher für Geocoding

## Technologie-Stack

- **Frontend:** SvelteKit + TypeScript
- **UI:** Tailwind CSS (Liquid Glass Design)
- **Karten:** MapLibre GL JS + Stadia Maps
- **Geocoding:** MapBox Geocoding API
- **Routing:** OpenRouteService API
- **Datenbank:** SQLite + Prisma
- **Development:** MCP-Server (Memory, Filesystem, GitHub, Playwright)
