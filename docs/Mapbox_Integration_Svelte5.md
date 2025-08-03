

# **Definitiver Leitfaden zur Integration von Mapbox GL JS in Svelte 5: Von der Initialisierung bis zur vollständigen Reaktivität**

## **Einleitung**

### **Zweck und Umfang**

Dieser Bericht bietet einen endgültigen, auf ersten Prinzipien basierenden Leitfaden für die Integration der Mapbox GL JS-Bibliothek in Svelte 5-Anwendungen. Das Dokument ist bewusst so umfassend gestaltet, dass es als Schulungsmaterial für eine künstliche Intelligenz dienen kann, wobei der Schwerpunkt auf modernen Best Practices liegt, einschließlich Svelte Runes und dem Mapbox Standard-Stil. Ziel ist es, nicht nur das „Wie“, sondern vor allem das „Warum“ hinter jeder technischen Entscheidung zu beleuchten.

### **Die zentrale Herausforderung: Paradigmen überbrücken**

Die Kernherausforderung bei dieser Integration liegt in der Überbrückung zweier unterschiedlicher Programmierparadigmen: Sveltes deklarative, zustandsgesteuerte UI-Verwaltung trifft auf den imperativen, auf direkter DOM-Manipulation basierenden Ansatz von Mapbox GL JS. Svelte beschreibt, *was* auf dem Bildschirm sein soll, basierend auf dem aktuellen Zustand. Im Gegensatz dazu erfordert Mapbox eine Reihe von Befehlen (z. B. map.flyTo(...), marker.addTo(map)), um seinen Zustand zu ändern. Dieser Bericht präsentiert die architektonischen Muster und Techniken, um diese „Impedanzfehlanpassung“ elegant und robust aufzulösen.

### **Was Sie erstellen werden**

Am Ende dieses Leitfadens steht eine vollständig reaktive Svelte-Komponente, die eine Mapbox-Karte anzeigt. Der Kartenausschnitt (Zentrum und Zoom) wird bidirektional mit der Benutzeroberfläche synchronisiert, und die Karte kann interaktive Marker und Pop-ups hosten, die selbst als deklarative Svelte-Komponenten verwaltet werden.  
---

## **Abschnitt 1: Grundlegende Konzepte: Voraussetzungen für die Integration**

Dieser Abschnitt legt das notwendige theoretische Fundament. Ohne dieses Verständnis würden die Implementierungsdetails in den späteren Abschnitten den entscheidenden Kontext vermissen lassen.

### **1.1. Einrichten der Svelte 5-Entwicklungsumgebung**

Die Grundlage für eine moderne Webanwendung ist eine solide Toolchain. SvelteKit, das offizielle Anwendungsframework für Svelte, bietet eine solche Umgebung, die auf dem extrem schnellen Build-Tool Vite basiert.  
Projekterstellung  
Ein neues SvelteKit-Projekt wird über die Kommandozeile mit dem Befehl npm create svelte@latest initialisiert. Dieser Prozess führt den Entwickler durch einige Konfigurationsoptionen. Für dieses Projekt sind die Standardeinstellungen mit TypeScript-Unterstützung eine ausgezeichnete Wahl.  
Installation von Mapbox GL JS  
Die Kernabhängigkeit, die Mapbox-Bibliothek, wird dem Projekt über npm hinzugefügt:  
npm install mapbox-gl  
Dieses Paket enthält alle notwendigen Ressourcen: die JavaScript-Bibliothek selbst (mapbox-gl.js), die für die korrekte Darstellung unerlässlichen CSS-Stile (mapbox-gl.css) und die TypeScript-Typdefinitionen (mapbox-gl.d.ts) für eine verbesserte Entwicklererfahrung in typisierten Projekten.2  
Importieren der Stile  
Ein häufiger Fehler bei der Integration ist das Vergessen der CSS-Datei. Ohne sie wird die Karte zwar initialisiert, aber UI-Elemente wie Steuerelemente, Pop-ups und die Standard-Marker werden nicht korrekt dargestellt. Der Import erfolgt am besten in einer globalen Svelte-Komponente, wie src/routes/+layout.svelte, um sicherzustellen, dass die Stile in der gesamten Anwendung verfügbar sind.2

Svelte

\<script\>  
  import 'mapbox-gl/dist/mapbox-gl.css';  
\</script\>

\<slot /\>

### **1.2. Das Mapbox GL JS-Ökosystem: Tokens und Stile**

Mapbox GL JS ist keine isolierte Bibliothek, sondern Teil einer größeren Plattform, die auf zwei zentralen Konzepten beruht: Zugriffstoken und Kartenstilen.5  
Mapbox Access Tokens  
Jede Anfrage an die Mapbox-API muss mit einem Zugriffstoken verknüpft sein, um sie einem Benutzerkonto zuzuordnen und die Nutzung zu messen.7

* **Beschaffung:** Ein Token kann auf der „Access tokens page“ im Mapbox-Konto erstellt und verwaltet werden. Für die clientseitige Anzeige von Karten wird der default public token verwendet.8  
* **Sicherheit:** Ein kritischer Aspekt der Sicherheit ist die Verwaltung dieses Tokens. Es sollte niemals direkt im Quellcode fest codiert werden. SvelteKit bietet eine robuste Lösung durch die Verwendung von Umgebungsvariablen. Das Token wird in einer .env-Datei gespeichert und über das Modul $env/static/public sicher in die Anwendung geladen.  
  Beispiel für eine .env-Datei:  
  PUBLIC\_MAPBOX\_TOKEN="pk.eyJ..."  
* **Token-Typen und Geltungsbereiche (Scopes):** Mapbox unterscheidet zwischen öffentlichen (pk), geheimen (sk) und temporären (tk) Token. Jeder Token besitzt „Scopes“, die definieren, auf welche APIs er zugreifen darf. Für die Anzeige von Karten im Browser ist ein öffentlicher Token mit den standardmäßigen öffentlichen Scopes ausreichend.8

Mapbox-Stile  
Ein Mapbox-Stil ist ein JSON-Dokument, das das gesamte visuelle Erscheinungsbild einer Karte definiert. Es legt fest, welche Datenquellen (z. B. Straßen, Gebäude, Points of Interest) verwendet und wie diese als Layer (Schichten) mit Farben, Schriftarten und Linienstärken gerendert werden.10

* **Mapbox Standard Style:** Dies ist der moderne, standardmäßige und empfohlene Stil für alle neuen Anwendungen. Er wurde entwickelt, um die Konfiguration zu vereinfachen und gleichzeitig eine hohe Leistung und visuelle Qualität mit Merkmalen wie 3D-Gelände, dynamischer Beleuchtung und detaillierten Gebäuden zu bieten.11  
* **Stil-URL:** Stile werden über eine eindeutige URL referenziert. Die URL für den Mapbox Standard-Stil lautet: mapbox://styles/mapbox/standard.11 Wird beim Initialisieren der Karte keine Stil-Option angegeben, wird dieser Stil standardmäßig verwendet.4

### **1.3. Kernprinzipien von Svelte 5 für die Integration externer Bibliotheken**

Die erfolgreiche Integration hängt vom korrekten Verständnis des Svelte 5-Lebenszyklus und des neuen Reaktivitätsmodells (Runes) ab.  
Der vereinfachte Lebenszyklus  
In Svelte 5 besteht der Lebenszyklus einer Komponente im Wesentlichen nur noch aus zwei Phasen: ihrer Erstellung und ihrer Zerstörung.13 Aktualisierungen werden nicht mehr als Ereignis der gesamten Komponente betrachtet, sondern granular von den Teilen gehandhabt, die sich tatsächlich ändern.

* **onMount:** Diese Funktion plant die Ausführung eines Callbacks, *nachdem* die Komponente in das DOM eingehängt wurde. Dies ist der einzig korrekte Zeitpunkt, um eine DOM-abhängige Bibliothek wie Mapbox zu initialisieren, da diese ein existierendes DOM-Element als Container benötigt.13 Ein Versuch, die Karte im Haupt-  
  \<script\>-Block zu initialisieren, würde fehlschlagen, da das Skript ausgeführt wird, bevor das HTML der Komponente gerendert wurde.14  
* **onDestroy und die onMount-Aufräumfunktion:** Ressourcen, die in onMount erstellt werden, müssen unbedingt wieder freigegeben werden, um Speicherlecks zu vermeiden. Die idiomatische Methode in Svelte ist, eine Funktion aus dem onMount-Callback zurückzugeben. Diese zurückgegebene Funktion wird automatisch ausgeführt, kurz bevor die Komponente zerstört wird.13  
  onDestroy ist eine alternative, explizite Hook für denselben Zweck.13

Svelte 5 Runes: Das neue Reaktivitätsmodell  
Runes sind das explizite und granulare Reaktivitätssystem in Svelte 5, das die implizite „Magie“ von Svelte 4 ersetzt.16

* **$state:** Diese Rune deklariert eine reaktive Variable. Änderungen an dieser Variablen lösen automatisch Aktualisierungen in abhängigen Teilen der Anwendung aus.16  
* **$derived:** Diese Rune wird für Werte verwendet, die sich vollständig aus anderen reaktiven Zustandsvariablen berechnen.16  
* **$effect:** Dies ist die kritischste Rune für die Mapbox-Integration. Ein $effect-Block führt eine Funktion (einen „Seiteneffekt“) aus, nachdem sich seine Abhängigkeiten geändert haben. Er ist das perfekte Werkzeug, um imperative API-Methoden der Mapbox-Instanz als Reaktion auf Zustandsänderungen in Svelte aufzurufen.17 Dies ersetzt die weniger präzisen  
  $: \-Blöcke aus Svelte 4\.16

Die Kombination aus onMount für die einmalige Initialisierung und Bereinigung und $effect für reaktive Aktualisierungen bildet das grundlegende und robuste Architekturmuster für die Integration jeder imperativen, DOM-manipulierenden Bibliothek in Svelte 5\. Dieses Muster ist nicht auf Mapbox beschränkt, sondern lässt sich auf Bibliotheken wie D3.js, Chart.js oder Three.js verallgemeinern. Das Erlernen dieses Musters ist daher wertvoller als das Erlernen einer einzelnen Bibliotheksintegration.

### **Tabelle 1: Svelte 5-APIs für die Mapbox-Integration**

| API | Zweck | Rolle in der Mapbox-Integration |
| :---- | :---- | :---- |
| onMount | Plant die Ausführung einer Funktion, nachdem das DOM der Komponente erstellt wurde. 13 | Der *einzige* sichere Ort, um das mapboxgl.Map-Objekt zu instanziieren, da es eine Referenz auf ein aktives DOM-Element benötigt. 14 |
| onMount-Rückgabefunktion | Plant die Ausführung einer Aufräumfunktion, kurz bevor die Komponente zerstört wird. 13 | Der idiomatische Ort, um map.remove() aufzurufen, um die Karteninstanz ordnungsgemäß zu zerstören und WebGL-Ressourcen freizugeben, was Speicherlecks verhindert. 21 |
| $state | Erstellt eine reaktive Zustandsvariable. 16 | Um kartenbezogene Parameter wie center, zoom und bearing als Teil des Anwendungszustands von Svelte zu halten. |
| $effect | Führt eine Seiteneffektfunktion aus, wann immer sich ihre reaktiven Abhängigkeiten ändern. 19 | Die Brücke vom deklarativen Zustand von Svelte zur imperativen API von Mapbox. Wird verwendet, um Methoden wie map.flyTo() oder map.setZoom() als Reaktion auf Änderungen in $state-Variablen aufzurufen. 18 |

---

## **Abschnitt 2: Die Kernintegration: Rendern einer einfachen Karte**

Dieser Abschnitt übersetzt die grundlegenden Konzepte in ein praktisches, funktionierendes Beispiel. Dies ist das „Hallo, Welt\!“ der Svelte/Mapbox-Integration.

### **2.1. Erstellen der Map.svelte-Komponente**

Der erste Schritt ist die Erstellung einer dedizierten Svelte-Komponente, die die gesamte Logik für die Karte kapselt.  
Das Container-Element  
Die Komponente benötigt ein HTML-Element, das als Container für die Karte dient. Die bind:this-Direktive von Svelte ist hier entscheidend, um eine direkte Referenz auf das DOM-Element zu erhalten. Diese Referenz wird an den Mapbox-Konstruktor übergeben.

Svelte

\<script lang="ts"\>  
  // Die Logik kommt hierher  
  let mapContainer: HTMLDivElement;  
\</script\>

\<div class="map-container" bind:this={mapContainer}\>\</div\>

\<style\>  
 .map-container {  
    position: absolute;  
    top: 0;  
    left: 0;  
    width: 100%;  
    height: 100%;  
  }  
\</style\>

Essentielles CSS  
Das obige CSS stellt sicher, dass der Kartencontainer den gesamten Viewport ausfüllt.1 Ohne explizite Höhen- und Breitenangaben wäre das  
\<div\>-Element standardmäßig 0x0 Pixel groß und somit unsichtbar.

### **2.2. Initialisierung und Bereinigung im Svelte-Lebenszyklus**

Die gesamte Interaktion mit der Mapbox-Bibliothek muss innerhalb des Svelte-Lebenszyklus sorgfältig verwaltet werden.  
**Vollständiger Code für die Basiskomponente:**

Svelte

\<script lang="ts"\>  
  import { onMount } from 'svelte';  
  import mapboxgl from 'mapbox-gl';  
  import { PUBLIC\_MAPBOX\_TOKEN } from '$env/static/public';

  let mapContainer: HTMLDivElement;  
  let map: mapboxgl.Map;

  onMount(() \=\> {  
    // Setzen des Zugriffstokens  
    mapboxgl.accessToken \= PUBLIC\_MAPBOX\_TOKEN;

    // Initialisieren der Karteninstanz  
    map \= new mapboxgl.Map({  
      container: mapContainer, // Übergabe der DOM-Element-Referenz  
      style: 'mapbox://styles/mapbox/standard', // Explizite Angabe des Standard-Stils  
      center: \[-74.5, 40\], // Startzentrum  
      zoom: 9, // Start-Zoomstufe  
      antialias: true // Verbessert das Rendering von benutzerdefinierten Layern  
    });

    // Die Aufräumfunktion wird zurückgegeben  
    return () \=\> {  
      map.remove();  
    };  
  });  
\</script\>

\<div class="map-container" bind:this={mapContainer}\>\</div\>

\<style\>  
 .map-container {  
    position: absolute;  
    top: 0;  
    left: 0;  
    width: 100%;  
    height: 100%;  
  }  
\</style\>

**Analyse des Codes:**

1. **Importe:** onMount wird aus svelte importiert, mapboxgl aus dem installierten Paket und das Token aus SvelteKits Umgebungsvariablen.  
2. **Variablendeklaration:** mapContainer hält die DOM-Referenz, während let map die Instanz des komplexen Mapbox-Objekts aufnehmen wird. Diese map-Variable fungiert als **imperativer Handle**. Sie ist die Brücke zur Mapbox-Welt, die außerhalb der direkten reaktiven Kontrolle von Svelte existiert. Die Interaktion mit diesem Handle auf eine sichere und reaktive Weise ist das zentrale Thema der folgenden Abschnitte.  
3. **onMount-Implementierung:** Hier findet die eigentliche Initialisierung statt.4 Die wichtigsten Konstruktoroptionen sind  
   container, style, center und zoom.22  
4. **Bereinigungs-Implementierung:** Die zurückgegebene Funktion ruft map.remove() auf. Diese Methode ist entscheidend, da sie alle an die Karte gebundenen Event-Listener entfernt, den WebGL-Kontext freigibt und andere von der Bibliothek belegte Ressourcen bereinigt.13 Das Weglassen dieses Schrittes ist eine häufige Ursache für Leistungsprobleme und Speicherlecks in Single-Page-Anwendungen, bei denen Komponenten häufig erstellt und zerstört werden.

---

## **Abschnitt 3: Reaktivität erreichen: Synchronisation von Svelte-Zustand und Karte**

Dieser Abschnitt befasst sich mit dem Kern der Anforderung: die Karte dynamisch und interaktiv zu gestalten, sodass sie sich nahtlos in die Svelte-Anwendung einfügt.

### **3.1. Unidirektionale Datenfluss: Svelte-Zustand → Mapbox-Ansicht**

Zunächst wird der Datenfluss von der Svelte-Anwendung zur Karte hergestellt. Der Svelte-Zustand wird zur alleinigen „Quelle der Wahrheit“ (Source of Truth).  
Definieren des reaktiven Zustands  
Die Map.svelte-Komponente wird refaktorisiert, um Runes zu verwenden. Die anfänglichen Kartenparameter werden als reaktiver Zustand deklariert:

JavaScript

// Innerhalb des \<script\>-Blocks von Map.svelte  
import { onMount, $effect } from 'svelte'; // $effect importieren  
//...  
let center \= $state(\[-74.5, 40\]);  
let zoom \= $state(9);  
let pitch \= $state(0);  
let bearing \= $state(0);

Diese Variablen repräsentieren nun den kanonischen Zustand der Kartenansicht innerhalb der Svelte-Anwendung.16  
Verwendung von $effect zur Synchronisation  
Ein $effect wird hinzugefügt, um auf Änderungen dieser Zustandsvariablen zu reagieren und die Karte entsprechend zu aktualisieren.

JavaScript

// Innerhalb des \<script\>-Blocks von Map.svelte  
//...  
$effect(() \=\> {  
  // Sicherstellen, dass die Karte initialisiert ist, bevor Methoden aufgerufen werden  
  if (\!map) return;

  // Hole aktuelle Werte von der Karte, um unnötige Aktualisierungen zu vermeiden  
  const currentCenter \= map.getCenter();  
  const currentZoom \= map.getZoom();  
  const currentPitch \= map.getPitch();  
  const currentBearing \= map.getBearing();

  // Vergleiche und aktualisiere nur bei Abweichung  
  // Dies ist ein wichtiger Schritt zur Leistungsoptimierung  
  if (currentCenter.lng\!== center |

| currentCenter.lat\!== center ||  
      currentZoom\!== zoom |

| currentPitch\!== pitch |  
| currentBearing\!== bearing) {  
    map.flyTo({  
      center: center,  
      zoom: zoom,  
      pitch: pitch,  
      bearing: bearing,  
      duration: 1500 // Sanfte Animation  
    });  
  }  
});

Dieser $effect-Block wird immer dann ausgeführt, wenn sich center, zoom, pitch oder bearing ändern. Er ruft die imperative flyTo-Methode von Mapbox auf, um die Kartenansicht anzupassen.23 Die Überprüfung, ob die  
map-Instanz bereits existiert, ist entscheidend, um Fehler während des ersten Renderings zu vermeiden, bevor onMount abgeschlossen ist.

### **3.2. Bidirektionaler Datenfluss: Mapbox-Ansicht → Svelte-Zustand**

Nun muss der umgekehrte Weg implementiert werden: Wenn der Benutzer die Karte durch Ziehen oder Zoomen direkt manipuliert, muss der Svelte-Zustand aktualisiert werden.  
Auf Kartenereignisse lauschen  
Mapbox löst Ereignisse für Benutzerinteraktionen aus. Die relevantesten sind move (für jede Änderung der Ansicht) und zoom.22 Ein Event-Listener wird in  
onMount hinzugefügt, nachdem die Karte initialisiert wurde.

JavaScript

// Innerhalb von onMount, nach der map-Initialisierung  
map.on('move', () \=\> {  
  // Aktualisiere den Svelte-Zustand mit den neuen Werten von der Karte  
  center \= \[map.getCenter().lng, map.getCenter().lat\];  
  zoom \= map.getZoom();  
  pitch \= map.getPitch();  
  bearing \= map.getBearing();  
});

### **3.3. Die Reaktivitätsschleife auflösen**

Die Kombination der beiden vorherigen Schritte führt zu einer Endlosschleife:

1. Der Benutzer bewegt die Karte.  
2. Das move-Ereignis wird ausgelöst und aktualisiert den Svelte-$state.  
3. Die Änderung des $state löst den $effect aus.  
4. Der $effect ruft map.flyTo() auf, was die Karte bewegt.  
5. Diese programmatische Bewegung löst erneut ein move-Ereignis aus. Der Zyklus beginnt von vorn.

Die Lösung: Eine interne Sperre (Lock)  
Um diese Schleife zu durchbrechen, wird ein einfacher boolescher Flag eingeführt. Dieser „Lock“ verhindert, dass vom $effect ausgelöste, programmatische Kartenbewegungen den Svelte-Zustand erneut aktualisieren.  
**Verfeinerter Code für robuste bidirektionale Bindung:**

JavaScript

//...  
let isUpdatingFromSvelte \= false; // Der Lock-Mechanismus

$effect(() \=\> {  
  if (\!map) return;  
    
  isUpdatingFromSvelte \= true; // Sperre aktivieren  
  map.flyTo({  
    center: center,  
    zoom: zoom,  
    pitch: pitch,  
    bearing: bearing,  
    duration: 1500  
  });  
    
  // Wichtig: Die Sperre nach einer kurzen Verzögerung wieder freigeben,  
  // damit nachfolgende Benutzerinteraktionen erfasst werden können.  
  setTimeout(() \=\> {  
    isUpdatingFromSvelte \= false;  
  }, 1600); // Etwas länger als die flyTo-Dauer  
});

onMount(() \=\> {  
  //... map-Initialisierung  
    
  map.on('move', () \=\> {  
    if (isUpdatingFromSvelte) {  
      // Wenn die Bewegung von Svelte ausgelöst wurde, ignoriere das Ereignis.  
      return;  
    }  
    // Andernfalls aktualisiere den Svelte-Zustand.  
    center \= \[map.getCenter().lng, map.getCenter().lat\];  
    zoom \= map.getZoom();  
    pitch \= map.getPitch();  
    bearing \= map.getBearing();  
  });

  return () \=\> map.remove();  
});

Dieses Muster etabliert eine klare Hierarchie: Der Svelte-Zustand ist die einzige Quelle der Wahrheit. Die Mapbox-Karte ist eine visuelle Repräsentation dieses Zustands. Die move-Ereignisse der Karte "melden" Änderungen lediglich an den Master (den Svelte-Zustand) zurück, während der $effect als Master "Befehle" an den Slave (die Mapbox-Ansicht) ausgibt. Der Lock-Mechanismus ist die technische Umsetzung dieser architektonischen Entscheidung. Genau diese Logik ist es, die Wrapper-Bibliotheken wie @beyonk/svelte-mapbox 25 oder  
svelte-maplibre-gl 27 intern kapseln, um einfache reaktive Props wie  
bind:center anzubieten. Durch den manuellen Nachbau wird das zugrundeliegende Prinzip verstanden.  
---

## **Abschnitt 4: Interaktivität hinzufügen: Marker und Pop-ups**

Aufbauend auf der reaktiven Kartenbasis werden nun gängige, modulare Kartenfunktionen auf eine Svelte-native, deklarative Weise hinzugefügt.

### **4.1. Erstellen einer wiederverwendbaren, deklarativen Marker.svelte-Komponente**

Anstatt Marker imperativ im Haupt-Map-Code zu erstellen, wird eine separate Komponente gekapselt, was die Wiederverwendbarkeit und Lesbarkeit drastisch erhöht.  
Komponenten-Props und Kontext-API  
Die \<Marker\>-Komponente akzeptiert Props wie lng und lat. Um auf die übergeordnete Karteninstanz zugreifen zu können, ohne sie durch alle Komponentenebenen reichen zu müssen (Prop-Drilling), wird die Kontext-API von Svelte verwendet. Die Map.svelte-Komponente stellt ihre map-Instanz über setContext zur Verfügung, und die Marker.svelte-Komponente greift über getContext darauf zu.28  
**Map.svelte (Ausschnitt):**

JavaScript

import { setContext } from 'svelte';  
//...  
const mapKey \= Symbol(); // Eindeutiger Schlüssel für den Kontext  
onMount(() \=\> {  
  //... nach der map-Initialisierung  
  setContext(mapKey, { getMap: () \=\> map });  
  //...  
});

**Marker.svelte (Implementierung):**

Svelte

\<script lang="ts"\>  
  import { onMount, getContext, $effect } from 'svelte';  
  import mapboxgl from 'mapbox-gl';

  // Props für die Marker-Position  
  let { lng, lat } \= $props\<{ lng: number; lat: number }\>();

  // Marker-Optionen  
  let { color \= '\#3FB1CE', draggable \= false } \= $props\<{ color?: string; draggable?: boolean }\>();

  const { getMap } \= getContext(mapKey);  
  const map \= getMap();  
    
  let marker: mapboxgl.Marker;

  onMount(() \=\> {  
    marker \= new mapboxgl.Marker({ color, draggable })  
     .setLngLat(\[lng, lat\])  
     .addTo(map);

    return () \=\> marker.remove();  
  });

  // Reaktivität für Positionsänderungen  
  $effect(() \=\> {  
    if (marker) {  
      marker.setLngLat(\[lng, lat\]);  
    }  
  });

  // Reaktivität für Optionsänderungen  
  $effect(() \=\> {  
    if (marker) {  
      // Hinweis: Die Farbe des Standard-Markers kann nach der Erstellung nicht einfach geändert werden.  
      // Für dynamische Farben wäre ein benutzerdefinierter HTML-Marker erforderlich.  
      marker.setDraggable(draggable);  
    }  
  });  
\</script\>

Dieses Muster ist ein perfektes Beispiel für eine **deklarative Abstraktion**. Der Benutzer der \<Marker\>-Komponente muss nichts über die imperativen Aufrufe new mapboxgl.Marker(), setLngLat() oder remove() wissen. Er deklariert einfach, dass ein Marker an einer bestimmten Position existieren soll, indem er die Komponente mit den entsprechenden Props im Svelte-Markup platziert. Die Komponente selbst kümmert sich um die Übersetzung dieser deklarativen Absicht in die notwendigen imperativen Befehle.

### **4.2. Anpassen von Markern mit Svelte Slots**

Um die volle Flexibilität von HTML und CSS für das Marker-Design zu nutzen, kann die \<Marker\>-Komponente erweitert werden, um beliebige Svelte-Inhalte über Slots zu akzeptieren.  
**Refaktorierte Marker.svelte:**

Svelte

\<script lang="ts"\>  
  //... (gleiche Imports und Kontext-Logik)  
  let { lng, lat } \= $props\<{ lng: number; lat: number }\>();  
    
  const { getMap } \= getContext(mapKey);  
  const map \= getMap();  
    
  let markerElement: HTMLDivElement;  
  let marker: mapboxgl.Marker;

  onMount(() \=\> {  
    marker \= new mapboxgl.Marker({ element: markerElement }) // Übergabe des DOM-Elements  
     .setLngLat(\[lng, lat\])  
     .addTo(map);

    return () \=\> marker.remove();  
  });  
    
  $effect(() \=\> {  
    if (marker) marker.setLngLat(\[lng, lat\]);  
  });  
\</script\>

\<div bind:this={markerElement}\>  
  \<slot\>  
    \<div class="default-marker-dot"\>\</div\>  
  \</slot\>  
\</div\>

\<style\>  
 .default-marker-dot {  
    width: 15px;  
    height: 15px;  
    background-color: \#3FB1CE;  
    border-radius: 50%;  
    border: 2px solid white;  
  }  
\</style\>

Der Benutzer kann nun die \<Marker\>-Komponente wie folgt verwenden, um ein beliebiges HTML-Element oder sogar eine andere Svelte-Komponente als Marker zu rendern 30:

HTML

\<Map\>  
  \<Marker lng={-74} lat={40}\>  
    \<div class="custom-marker"\>  
      \<span\>🚀\</span\>  
    \</div\>  
  \</Marker\>  
\</Map\>

### **4.3. Implementieren interaktiver Pop-ups**

Pop-ups können einfache HTML-Informationen anzeigen oder, was weitaus leistungsfähiger ist, vollständig interaktive Svelte-Komponenten hosten.  
Einfache Pop-ups  
Ein einfaches Popup kann durch die Übergabe eines HTML-Strings erstellt werden.30

JavaScript

// Innerhalb von Marker.svelte onMount  
marker.setPopup(  
  new mapboxgl.Popup({ offset: 25 })  
   .setHTML(\`\<h3\>Titel\</h3\>\<p\>Beschreibung des Markers.\</p\>\`)  
);

Fortgeschritten: Svelte-Komponenten in Pop-ups rendern  
Diese Technik schöpft das volle Potenzial von Svelte aus. Sie ermöglicht es, dass Pop-ups nicht nur statische Anzeigen sind, sondern eigenständige Mini-Anwendungen mit eigenem Zustand und eigener Logik.

JavaScript

// Innerhalb von Marker.svelte  
import { mount, unmount } from 'svelte';  
import MyPopupComponent from './MyPopupComponent.svelte';  
//...  
onMount(() \=\> {  
  //...  
  const popupContainer \= document.createElement('div');  
  const popup \= new mapboxgl.Popup({ offset: 25 }).setDOMContent(popupContainer);  
  marker.setPopup(popup);

  let componentInstance;

  // Komponente nur mounten, wenn das Popup geöffnet wird  
  popup.on('open', () \=\> {  
    componentInstance \= mount(MyPopupComponent, {  
      target: popupContainer,  
      props: { message: 'Hallo aus dem Popup\!' }  
    });  
  });

  // Komponente unmounten, wenn das Popup geschlossen wird, um Speicherlecks zu vermeiden  
  popup.on('close', () \=\> {  
    if (componentInstance) {  
      unmount(componentInstance);  
      componentInstance \= null;  
    }  
  });

  return () \=\> {  
    // Sicherstellen, dass auch beim Zerstören des Markers alles aufgeräumt wird  
    if (componentInstance) {  
      unmount(componentInstance);  
    }  
    marker.remove();  
  };  
});

Die Verwendung von mount und unmount aus dem svelte-Paket in Verbindung mit den open- und close-Ereignissen des Popups ist der Schlüssel zu dieser leistungsstarken und speichersicheren Integration.33  
---

## **Abschnitt 5: Fortgeschrittene Themen und Best Practices**

Dieser letzte Abschnitt behandelt zusätzliche Techniken und fasst die wichtigsten Erkenntnisse für die Erstellung produktionsreifer Anwendungen zusammen.

### **5.1. Laufzeitkonfiguration des Mapbox Standard-Stils**

Im Gegensatz zu klassischen Stilen, bei denen einzelne Layer manipuliert wurden, wird der Mapbox Standard-Stil zur Laufzeit über eine dedizierte Konfigurations-API gesteuert.11 Dies vereinfacht die Anpassung erheblich.  
Die Methode map.setConfigProperty() wird verwendet, um Eigenschaften zu ändern. Der erste Parameter ist die Import-ID des Stils, die für Mapbox Standard 'basemap' lautet.12  
**Beispiel:**

JavaScript

// In einer Funktion, die durch einen Button-Klick ausgelöst wird  
function toggle3DBuildings() {  
  const currentState \= map.getConfigProperty('basemap', 'show3dObjects');  
  map.setConfigProperty('basemap', 'show3dObjects',\!currentState);  
}

function setNightMode() {  
  map.setConfigProperty('basemap', 'lightPreset', 'night');  
}

### **Tabelle 2: Gängige Konfigurationseigenschaften des Mapbox Standard-Stils**

| Eigenschaftsname | Typ | Beschreibung |
| :---- | :---- | :---- |
| showPlaceLabels | boolean | Schaltet die Sichtbarkeit von Etiketten für Städte, Orte und andere Standorte um. 11 |
| showPointOfInterestLabels | boolean | Schaltet die Sichtbarkeit von Etiketten für Points of Interest wie Restaurants und Parks um. 11 |
| showRoadLabels | boolean | Schaltet die Sichtbarkeit von Etiketten des Straßennetzes um. |
| show3dObjects | boolean | Schaltet die Sichtbarkeit aller 3D-Objekte um, einschließlich extrudierter Gebäude und Sehenswürdigkeiten. 11 |
| lightPreset | string | Stellt die Lichtverhältnisse ein. Mögliche Werte sind 'dawn', 'day', 'dusk' oder 'night'. 11 |
| font | array | Definiert die Schriftart für Etiketten, z.B. \`\`. |

### **5.2. Umgang mit Web Workern und Transpilierung**

Mapbox GL JS ab Version 2 verwendet moderne ES-Syntax und einen Web Worker für rechenintensive Aufgaben im Hintergrund. In älteren Build-Umgebungen konnte dies zu Problemen führen, die eine manuelle Konfiguration des Bundlers erforderten, um mapbox-gl von der Transpilierung auszuschließen oder den Worker separat zu laden.2 In einer modernen Toolchain wie SvelteKit mit Vite werden diese Probleme in der Regel automatisch und transparent für den Entwickler gelöst. Ein Eingreifen ist nur in sehr spezifischen oder veralteten Setups notwendig.

### **5.3. Alternative: Verwendung von Wrapper-Bibliotheken**

Es existieren Wrapper-Bibliotheken, die den Integrationsprozess vereinfachen sollen. Nennenswerte Beispiele sind svelte-maplibre-gl (speziell für Svelte 5 und MapLibres Open-Source-Fork) 27 und  
@beyonk/svelte-mapbox (eine ältere Bibliothek, die aber die reaktiven Prinzipien gut demonstriert).25

* **Vorteile:** Schnellere anfängliche Entwicklung, weniger Boilerplate-Code für gängige Aufgaben, Bereitstellung vorgefertigter deklarativer Komponenten.  
* **Nachteile:** Weniger Flexibilität, potenzielle Verzögerung bei der Unterstützung neuer Funktionen der Kernbibliothek, kann die zugrundeliegenden Mechanismen verschleiern und die Fehlersuche erschweren.  
* **Empfehlung:** Für das Erlernen der grundlegenden Prinzipien und für Anwendungen, die eine tiefe Anpassung erfordern, ist die in diesem Bericht gelehrte direkte Integration überlegen. Für schnelles Prototyping oder einfache Anwendungsfälle kann ein Wrapper eine sinnvolle Wahl sein.

## **Fazit und abschließende Empfehlungen**

Die Integration von Mapbox GL JS in Svelte 5 ist ein Paradebeispiel für die Verbindung einer deklarativen UI-Bibliothek mit einer imperativen Drittanbieter-API. Der Erfolg hängt von einem bewussten und strukturierten Ansatz ab, der die Stärken beider Welten nutzt.  
Die zentralen Erkenntnisse und das empfohlene Architekturmuster lassen sich wie folgt zusammenfassen:

* **Das Kernmuster:** Die Kombination aus onMount für die Initialisierung und Bereinigung, $state als alleinige Quelle der Wahrheit für Kartenparameter und $effect zur reaktiven Synchronisation bildet das Fundament einer robusten Integration.  
* **Der imperative Handle:** Die map-Variable sollte als externer, zustandsbehafteter Handle verstanden werden, der durch Svelte-Seiteneffekte gesteuert, aber nicht direkt in das reaktive System von Svelte integriert wird.  
* **Deklarative Abstraktion:** Komplexe imperative Logik (z. B. für Marker und Pop-ups) sollte in wiederverwendbare, deklarative Svelte-Komponenten gekapselt werden, die eine saubere und intuitive API über Props und Slots bieten.

**Checkliste für Entwickler:**

1. **Zugriffstoken sichern:** Verwenden Sie Umgebungsvariablen ($env/static/public), um Ihr Token sicher zu verwalten.  
2. **In onMount initialisieren:** Instanziieren Sie das mapboxgl.Map-Objekt ausschließlich innerhalb von onMount.  
3. **Immer aufräumen:** Geben Sie eine Funktion aus onMount zurück, die map.remove() aufruft, um Ressourcen freizugeben.  
4. **$state als Quelle der Wahrheit:** Definieren Sie Kartenparameter wie center und zoom als Svelte-$state.  
5. **Mit $effect reaktiv aktualisieren:** Verwenden Sie $effect, um Änderungen Ihres Zustands an die Karte weiterzugeben.  
6. **Reaktivitätsschleifen vermeiden:** Seien Sie sich der bidirektionalen Datenflüsse bewusst und verwenden Sie einen Lock-Mechanismus, um Endlosschleifen zu verhindern.  
7. **Kontext-API für Modularität nutzen:** Verwenden Sie setContext und getContext, damit Kindkomponenten wie Marker auf die übergeordnete Karteninstanz zugreifen können.

Die Beherrschung dieser Muster ermöglicht die Entwicklung von leistungsstarken, wartbaren und hochgradig interaktiven geospatialen Anwendungen mit der Eleganz und Effizienz von Svelte 5\.

#### **Referenzen**

1. Use Mapbox GL JS in a React app | Help, Zugriff am August 3, 2025, [https://docs.mapbox.com/help/tutorials/use-mapbox-gl-js-with-react/](https://docs.mapbox.com/help/tutorials/use-mapbox-gl-js-with-react/)  
2. Getting Started | Mapbox GL JS | Mapbox, Zugriff am August 3, 2025, [https://docs.mapbox.com/mapbox-gl-js/guides/install/](https://docs.mapbox.com/mapbox-gl-js/guides/install/)  
3. mapbox-gl-js/package.json at main \- GitHub, Zugriff am August 3, 2025, [https://github.com/mapbox/mapbox-gl-js/blob/main/package.json](https://github.com/mapbox/mapbox-gl-js/blob/main/package.json)  
4. Display a map on a webpage | Mapbox GL JS | Mapbox, Zugriff am August 3, 2025, [https://docs.mapbox.com/mapbox-gl-js/example/simple-map/](https://docs.mapbox.com/mapbox-gl-js/example/simple-map/)  
5. Getting Started | Help \- Mapbox Documentation, Zugriff am August 3, 2025, [https://docs.mapbox.com/help/getting-started/](https://docs.mapbox.com/help/getting-started/)  
6. mapbox/mapbox-gl-js: Interactive, thoroughly customizable maps in the browser, powered by vector tiles and WebGL \- GitHub, Zugriff am August 3, 2025, [https://github.com/mapbox/mapbox-gl-js](https://github.com/mapbox/mapbox-gl-js)  
7. access token | Help \- Mapbox Documentation, Zugriff am August 3, 2025, [https://docs.mapbox.com/help/glossary/access-token/](https://docs.mapbox.com/help/glossary/access-token/)  
8. Token management | Accounts and pricing \- Mapbox Documentation, Zugriff am August 3, 2025, [https://docs.mapbox.com/accounts/guides/tokens/](https://docs.mapbox.com/accounts/guides/tokens/)  
9. Tokens | API Docs \- Mapbox Documentation, Zugriff am August 3, 2025, [https://docs.mapbox.com/api/accounts/tokens/](https://docs.mapbox.com/api/accounts/tokens/)  
10. Map design and styles | Help \- Mapbox Documentation, Zugriff am August 3, 2025, [https://docs.mapbox.com/help/dive-deeper/map-design/](https://docs.mapbox.com/help/dive-deeper/map-design/)  
11. Mapbox Standard Style | Mapbox Docs, Zugriff am August 3, 2025, [https://docs.mapbox.com/map-styles/standard/guides/](https://docs.mapbox.com/map-styles/standard/guides/)  
12. Set a style | Mapbox GL JS, Zugriff am August 3, 2025, [https://docs.mapbox.com/mapbox-gl-js/guides/styles/set-a-style/](https://docs.mapbox.com/mapbox-gl-js/guides/styles/set-a-style/)  
13. Lifecycle hooks • Docs • Svelte, Zugriff am August 3, 2025, [https://svelte.dev/docs/svelte/lifecycle-hooks](https://svelte.dev/docs/svelte/lifecycle-hooks)  
14. Simple Full Screen Mapbox map with svelte \- Stack Overflow, Zugriff am August 3, 2025, [https://stackoverflow.com/questions/69455847/simple-full-screen-mapbox-map-with-svelte](https://stackoverflow.com/questions/69455847/simple-full-screen-mapbox-map-with-svelte)  
15. Advanced Svelte: Reactivity, lifecycle, accessibility \- Learn web development | MDN, Zugriff am August 3, 2025, [https://developer.mozilla.org/en-US/docs/Learn\_web\_development/Core/Frameworks\_libraries/Svelte\_reactivity\_lifecycle\_accessibility](https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Frameworks_libraries/Svelte_reactivity_lifecycle_accessibility)  
16. Svelte 5 migration guide • Docs, Zugriff am August 3, 2025, [https://svelte.dev/docs/svelte/v5-migration-guide](https://svelte.dev/docs/svelte/v5-migration-guide)  
17. The Guide to Svelte Runes \- SvelteKit.io, Zugriff am August 3, 2025, [https://sveltekit.io/blog/runes](https://sveltekit.io/blog/runes)  
18. What are runes? • Docs • Svelte, Zugriff am August 3, 2025, [https://svelte.dev/docs/svelte/what-are-runes](https://svelte.dev/docs/svelte/what-are-runes)  
19. Runes in Svelte 5 \- Full Stack SvelteKit, Zugriff am August 3, 2025, [https://fullstacksveltekit.com/blog/svelte-5-runes](https://fullstacksveltekit.com/blog/svelte-5-runes)  
20. Introduction To Svelte Runes (Every Svelte Rune Explained) \- YouTube, Zugriff am August 3, 2025, [https://www.youtube.com/watch?v=gihSBVfyFbI](https://www.youtube.com/watch?v=gihSBVfyFbI)  
21. Building a Real-Time Map with Mapbox, React, and TypeScript | by Louis Yoong \- Medium, Zugriff am August 3, 2025, [https://medium.com/@louisyoong/building-a-real-time-map-with-mapbox-react-and-typescript-2fe256c4bec6](https://medium.com/@louisyoong/building-a-real-time-map-with-mapbox-react-and-typescript-2fe256c4bec6)  
22. Mapbox GL JS | Mapbox, Zugriff am August 3, 2025, [https://docs.mapbox.com/mapbox-gl-js/guides/](https://docs.mapbox.com/mapbox-gl-js/guides/)  
23. FlyTo on existing Mapbox Object in Svelte \- javascript \- Stack Overflow, Zugriff am August 3, 2025, [https://stackoverflow.com/questions/74184685/flyto-on-existing-mapbox-object-in-svelte](https://stackoverflow.com/questions/74184685/flyto-on-existing-mapbox-object-in-svelte)  
24. Map | Mapbox GL JS | Mapbox, Zugriff am August 3, 2025, [https://docs.mapbox.com/mapbox-gl-js/api/map/](https://docs.mapbox.com/mapbox-gl-js/api/map/)  
25. beyonk-group/svelte-mapbox: MapBox Map and Autocomplete components for Svelte (or Vanilla JS) \- GitHub, Zugriff am August 3, 2025, [https://github.com/beyonk-group/svelte-mapbox](https://github.com/beyonk-group/svelte-mapbox)  
26. beyonk/svelte-mapbox \- NPM, Zugriff am August 3, 2025, [https://www.npmjs.com/package/@beyonk/svelte-mapbox](https://www.npmjs.com/package/@beyonk/svelte-mapbox)  
27. MIERUNE/svelte-maplibre-gl \- GitHub, Zugriff am August 3, 2025, [https://github.com/MIERUNE/svelte-maplibre-gl](https://github.com/MIERUNE/svelte-maplibre-gl)  
28. mapBox \- action • Playground \- Svelte, Zugriff am August 3, 2025, [https://svelte.dev/playground/9854061d29594408b972e49edb9ccc41?version=5.27.0](https://svelte.dev/playground/9854061d29594408b972e49edb9ccc41?version=5.27.0)  
29. Help or tutorial on expanding mapbox with svelte : r/sveltejs \- Reddit, Zugriff am August 3, 2025, [https://www.reddit.com/r/sveltejs/comments/mfd36p/help\_or\_tutorial\_on\_expanding\_mapbox\_with\_svelte/](https://www.reddit.com/r/sveltejs/comments/mfd36p/help_or_tutorial_on_expanding_mapbox_with_svelte/)  
30. Add custom markers in Mapbox GL JS | Help, Zugriff am August 3, 2025, [https://docs.mapbox.com/help/tutorials/custom-markers-gl-js/](https://docs.mapbox.com/help/tutorials/custom-markers-gl-js/)  
31. Markers and controls | Mapbox GL JS, Zugriff am August 3, 2025, [https://docs.mapbox.com/mapbox-gl-js/api/markers/](https://docs.mapbox.com/mapbox-gl-js/api/markers/)  
32. Attach a popup to a marker instance | Mapbox GL JS, Zugriff am August 3, 2025, [https://docs.mapbox.com/mapbox-gl-js/example/set-popup/](https://docs.mapbox.com/mapbox-gl-js/example/set-popup/)  
33. Maplibre Svelte 5 Popup Component • Playground, Zugriff am August 3, 2025, [https://svelte.dev/playground/aa3a30635cba42d1bb1b65620095a5fe?version=5.25.10](https://svelte.dev/playground/aa3a30635cba42d1bb1b65620095a5fe?version=5.25.10)  
34. Svelte MapLibre GL \- Map Library, Zugriff am August 3, 2025, [https://madewithsvelte.com/svelte-maplibre-gl](https://madewithsvelte.com/svelte-maplibre-gl)