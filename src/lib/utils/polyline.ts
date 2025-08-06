/**
 * Decodes a Google Maps encoded polyline string to array of coordinates
 * @param encoded - The encoded polyline string from Google Maps API
 * @returns Array of [lng, lat] coordinate pairs
 */
export function decodePolyline(encoded: string): [number, number][] {
  if (!encoded) return [];
  
  const poly: [number, number][] = [];
  let index = 0;
  const len = encoded.length;
  let lat = 0;
  let lng = 0;

  while (index < len) {
    let b: number;
    let shift = 0;
    let result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lat += dlat;

    shift = 0;
    result = 0;
    
    do {
      b = encoded.charCodeAt(index++) - 63;
      result |= (b & 0x1f) << shift;
      shift += 5;
    } while (b >= 0x20);
    
    const dlng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
    lng += dlng;

    poly.push([lng / 1e5, lat / 1e5]);
  }

  return poly;
}

/**
 * Converts Google Maps Route to GeoJSON LineString
 * @param route - Google Maps route object
 * @returns GeoJSON Feature with LineString geometry
 */
export function routeToGeoJSON(route: any): GeoJSON.Feature<GeoJSON.LineString> {
  const coordinates = decodePolyline(route.polyline?.encodedPolyline || '');
  
  return {
    type: 'Feature',
    geometry: {
      type: 'LineString',
      coordinates
    },
    properties: {
      distance: route.distanceMeters || 0,
      duration: route.duration || '0s'
    }
  };
}
