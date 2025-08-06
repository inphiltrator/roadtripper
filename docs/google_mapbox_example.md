# Google Maps Route API × Mapbox GL JS – Integrationsleitfaden

## Überblick
Dieser Leitfaden zeigt Schritt für Schritt, wie man eine von **Google Maps Route (Directions) API** berechnete Route in einer **Mapbox GL JS**-Karte darstellt. Er richtet sich an JavaScript-Entwickler, die die Routing-Qualität von Google mit der flexiblen Kartendarstellung von Mapbox kombinieren möchten.

## Voraussetzungen

| Komponente              | Zweck                                                      |
|-------------------------|------------------------------------------------------------|
| **Google Maps API-Key** | Zugriff auf `Directions` oder `Routes API`                |
| **Mapbox Access Token** | Anzeige interaktiver Karten in Mapbox GL JS               |
| **@mapbox/polyline**    | Dekodierung der von Google gelieferten *encoded polylines* |
| **Node.js + Express (empfohlen)** | Backend-Proxy, um CORS-Probleme zu vermeiden      |

## Ablauf in 4 Schritten

1. **Route anfordern** – Google Directions/Routes API liefert eine *encoded polyline* (`overview_polyline.points`).
2. **Polyline dekodieren** – mit `@mapbox/polyline` in ein Array von Koordinaten umwandeln.
3. **GeoJSON LineString erzeugen** – Koordinaten in `[lng, lat]`-Reihenfolge bringen.
4. **Route rendern** – als `line`-Layer in Mapbox GL JS zur Karte hinzufügen.

```mermaid
flowchart LR
    A[Google Directions API] -->|encoded polyline| B(@mapbox/polyline decode)
    B --> C{Koordinaten<br/>[lat,lng]}
    C --> D[zu [lng,lat] konvertieren]
    D --> E[GeoJSON LineString]
    E --> F[Mapbox GL JS <br/>line-layer]
```

---

## Frontend-Beispiel (reiner Browser)

> **Tipp:** Für produktive Umgebungen *nicht* direkt aus dem Browser auf die Google API zugreifen; stattdessen über Backend-Proxy (nächster Abschnitt).

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <title>Google Routes → Mapbox</title>
  <script src="https://api.mapbox.com/mapbox-gl-js/v3.14.0/mapbox-gl.js"></script>
  <link href="https://api.mapbox.com/mapbox-gl-js/v3.14.0/mapbox-gl.css" rel="stylesheet" />
  <script src="https://cdn.jsdelivr.net/npm/@mapbox/polyline@1.2.1/src/polyline.min.js"></script>
  <style>body{margin:0}#map{position:fixed;inset:0}</style>
</head>
<body>
  <div id="map"></div>
  <script>
    mapboxgl.accessToken = 'YOUR_MAPBOX_TOKEN';
    const map = new mapboxgl.Map({
      container:'map',style:'mapbox://styles/mapbox/streets-v12',center:[13.405,52.52],zoom:12
    });

    async function showRoute(){
      const url = `https://maps.googleapis.com/maps/api/directions/json?origin=52.52,13.405&destination=52.517,13.389&key=YOUR_GOOGLE_KEY`;
      const res = await fetch(url); const data = await res.json();
      const poly = data.routes[0].overview_polyline.points;
      const coords = polyline.decode(poly).map(c=>[c[1],c[0]]);
      const geojson={type:'Feature',geometry:{type:'LineString',coordinates:coords}};
      map.addSource('route',{type:'geojson',data:geojson});
      map.addLayer({id:'route',type:'line',source:'route',paint:{'line-color':'#3b82f6','line-width':6}});
      map.fitBounds(coords.reduce((b,c)=>b.extend(c),new mapboxgl.LngLatBounds(coords[0],coords[0])),{padding:50});
    }
    map.on('load',showRoute);
  </script>
</body>
</html>
```

---

## Backend-Proxy (Node.js)

Ein einfacher Express-Server kapselt den Google-Aufruf und liefert nur die benötigten Felder – ideal gegen CORS-Fehler und zum Verbergen des API-Keys.

```javascript
// server.js
require('dotenv').config();
const express = require('express');
const axios   = require('axios');
const app = express();
app.get('/api/directions', async (req,res)=>{
  const {origin,destination,mode='driving'} = req.query;
  const googleUrl = 'https://maps.googleapis.com/maps/api/directions/json';
  const resp = await axios.get(googleUrl,{params:{origin,destination,mode,key:process.env.GOOGLE_API_KEY}});
  const r = resp.data.routes[0];
  res.json({status:resp.data.status,route:{overview_polyline:r.overview_polyline,legs:r.legs,summary:r.summary}});
});
app.listen(3000,()=>console.log('Proxy läuft auf 3000'));
```

### `package.json`

```json
{
  "dependencies": {
    "axios": "^1.6.0",
    "dotenv": "^16.3.1",
    "express": "^4.18.2"
  }
}
```

---

## Wiederverwendbare Integrations-Klasse (ES Module)

```javascript
import polyline from '@mapbox/polyline';
export default class GoogleMapsMapbox {
  constructor(mapboxToken, map, backend='/api'){ mapboxgl.accessToken=mapboxToken; this.map=new mapboxgl.Map({container:map,style:'mapbox://styles/mapbox/streets-v12'}); this.backend=backend; }
  async fetch(origin,dest,mode='driving'){
    const url=`${this.backend}/directions?origin=${origin.lat},${origin.lng}&destination=${dest.lat},${dest.lng}&mode=${mode}`;
    const d=await (await fetch(url)).json(); if(d.status!=='OK') throw Error(d.status); return d.route; }
  geoJSON(route){ const coords=polyline.decode(route.overview_polyline.points).map(c=>[c[1],c[0]]); return {type:'Feature',geometry:{type:'LineString',coordinates:coords}}; }
  draw(gj){
    if(this.map.getSource('r')){this.map.removeLayer('r');this.map.removeSource('r');}
    this.map.addSource('r',{type:'geojson',data:gj});
    this.map.addLayer({id:'r',type:'line',source:'r',paint:{'line-color':'#f43','line-width':6}});
  }
}
```

---

## Häufige Fehler & Lösungen

| Problem                | Ursache                                         | Lösung                                                        |
|------------------------|-------------------------------------------------|---------------------------------------------------------------|
| **CORS Error**         | Direkter Browser-Aufruf der Google API          | Backend-Proxy einrichten                                      |
| **Falsche Koordinaten**| Google → `[lat,lng]`, Mapbox → `[lng,lat]`      | Reihenfolge umkehren                                          |
| **Polyline unvollständig** | Z-Präzision falsch                         | Immer Präzision 5 oder Algorithmen von Google API berücksichtigen |
| **API-Limits**         | Google-Kontingent erschöpft                     | Caching, Wegfall unnötiger Anfragen                           |

---

## Weiterführende Links

* [Google Directions API Dokumentation](https://developers.google.com/maps/documentation/directions)
* [Mapbox GL JS Examples » Add a line to a map](https://docs.mapbox.com/mapbox-gl-js/example/geojson-line/)
* [@mapbox/polyline GitHub-Repo](https://github.com/mapbox/polyline)

---

*Letzte Aktualisierung: August 2025*