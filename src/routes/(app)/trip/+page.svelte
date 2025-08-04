<script lang="ts">
  import { onMount, $effect } from 'svelte';
  import mapboxgl from 'mapbox-gl';
  import 'mapbox-gl/dist/mapbox-gl.css';
  import type { ActionData } from './$types';

  export let form: ActionData;

  let mapContainer: HTMLElement;
  let map: mapboxgl.Map;

  onMount(() => {
    mapboxgl.accessToken = 'pk.eyJ1IjoiaW5waGlsdHJhdGlvbiIsImEiOiJjbHcwdGFwZ2cwbWd3MmlvNW5zZGQ4M2NnIn0.n4w4o42n2EI4A4u6eArL6w'; // Token ist zu Demo zwecken hier und wird spaeter entfernt.

    map = new mapboxgl.Map({
      container: mapContainer,
      style: 'mapbox://styles/mapbox/streets-v11',
      center: [-118.2437, 34.0522], // Los Angeles
      zoom: 6
    });

    return () => map.remove();
  });

  $effect(() => {
    if (map && form?.success && form.route?.routes) {
      const routeGeoJson = form.route.routes[0].polyline.geoJsonLinestring;

      const bounds = new mapboxgl.LngLatBounds();
      routeGeoJson.coordinates.forEach(point => bounds.extend(point));
      map.fitBounds(bounds, { padding: 50 });

      const source = map.getSource('route');
      if (source) {
        source.setData(routeGeoJson);
      } else {
        map.addSource('route', {
          type: 'geojson',
          data: routeGeoJson
        });

        map.addLayer({
          id: 'route',
          type: 'line',
          source: 'route',
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3887be',
            'line-width': 5,
            'line-opacity': 0.75
          }
        });
      }
    }
  });
</script>

<svelte:head>
  <title>Trip Planner</title>
</svelte:head>

<div class="trip-planner h-screen w-screen flex flex-col">
  <div class="controls p-4 bg-gray-100">
    <h1 class="text-xl font-bold mb-4">Roadtrip Planner</h1>
    <form method="POST">
      <div class="flex space-x-4">
        <input type="text" name="start" placeholder="Start" class="p-2 border rounded w-full" required>
        <input type="text" name="destination" placeholder="Destination" class="p-2 border rounded w-full" required>
        <button type="submit" class="bg-blue-500 text-white p-2 rounded">Calculate Route</button>
      </div>
    </form>
  </div>
  <div class="map-container flex-grow" bind:this={mapContainer}></div>
</div>

