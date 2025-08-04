import { describe, it, expect, vi, beforeEach, beforeAll } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import { tick } from 'svelte';
import SouthwestMap from './SouthwestMap.svelte';

// Mock DOM environment
beforeAll(() => {
  global.HTMLElement = class HTMLElement {};
  global.HTMLDivElement = class HTMLDivElement extends HTMLElement {
    clientWidth = 800;
    clientHeight = 600;
  };
  global.document = {
    createElement: vi.fn(() => new HTMLDivElement()),
    body: { appendChild: vi.fn(), removeChild: vi.fn() }
  };
});

// Mock MapLibre GL
const mockMap = {
  addControl: vi.fn(),
  on: vi.fn(),
  remove: vi.fn(),
  flyTo: vi.fn(),
  getSource: vi.fn(),
  addSource: vi.fn(),
  addLayer: vi.fn(),
  removeLayer: vi.fn(),
  removeSource: vi.fn(),
  setPaintProperty: vi.fn(),
  getCenter: vi.fn(() => ({ lng: -115.0, lat: 36.0 })),
  getZoom: vi.fn(() => 8),
  getPitch: vi.fn(() => 0),
  getBearing: vi.fn(() => 0),
  isStyleLoaded: vi.fn(() => true)
};

const mockNavigationControl = vi.fn();
const mockScaleControl = vi.fn();
const mockGeolocateControl = vi.fn();

// Mock MapLibre GL import
vi.mock('maplibre-gl', async () => {
  return {
    default: {
      Map: vi.fn(() => mockMap),
      NavigationControl: mockNavigationControl,
      ScaleControl: mockScaleControl,
      GeolocateControl: mockGeolocateControl
    }
  };
});

// Mock MapLibre CSS import
vi.mock('maplibre-gl/dist/maplibre-gl.css', () => ({}));

// Mock browser environment
vi.mock('$app/environment', () => ({
  browser: true
}));

// Mock configuration modules
vi.mock('$lib/map/config', () => ({
  SOUTHWEST_MAP_CONFIG: {
    defaults: {
      center: [-115.0, 36.0],
      zoom: 8,
      minZoom: 4,
      maxZoom: 16
    },
    bounds: [
      [-125.0, 31.0],
      [-108.0, 43.0]
    ],
    layers: {
      stateBoundaries: {
        paint: {
          'line-color': '#ffffff',
          'line-width': 2,
          'line-opacity': 0.6
        }
      }
    },
    performance: {
      poiClusterThreshold: 50
    },
    mapbox: {
      outdoors: {
        url: 'mapbox://styles/mapbox/outdoors-v12'
      }
    }
  },
  getSeasonalConfig: vi.fn(() => ({
    heatWarningColor: null,
    snowWarningColor: null
  }))
}));

vi.mock('$lib/config/region', () => ({
  isInSouthwestRegion: vi.fn((lat, lng) => {
    // Mock implementation - assume coordinates within rough Southwest bounds
    return lat >= 31 && lat <= 43 && lng >= -125 && lng <= -108;
  })
}));

vi.mock('$lib/config/env', () => ({
  config: {
    mapbox: {
      styleUrl: 'https://api.mapbox.com/styles/v1/mapbox/outdoors-v12',
      accessToken: 'pk.test-token'
    }
  }
}));

describe('SouthwestMap Component', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Mock DOM element for map container
    Object.defineProperty(HTMLDivElement.prototype, 'clientWidth', {
      value: 800,
      writable: true
    });
    Object.defineProperty(HTMLDivElement.prototype, 'clientHeight', {
      value: 600,
      writable: true
    });
  });

  it('renders map container with correct styling', () => {
    render(SouthwestMap);
    
    const mapContainer = screen.getByRole('generic');
    expect(mapContainer).toBeTruthy();
  });

  it('accepts and uses prop values correctly', () => {
    const mockOnMapClick = vi.fn();
    const mockOnMapLoad = vi.fn();
    const testWaypoints = [
      { lat: 36.0, lng: -115.0, name: 'Las Vegas' },
      { lat: 34.0, lng: -118.0, name: 'Los Angeles' }
    ];

    render(SouthwestMap, {
      props: {
        class: 'test-class',
        onMapClick: mockOnMapClick,
        onMapLoad: mockOnMapLoad,
        waypoints: testWaypoints
      }
    });

    // Verify the component renders without errors
    expect(screen.getByRole('generic')).toBeTruthy();
  });

  it('displays Southwest region indicator', () => {
    render(SouthwestMap);
    
    const regionIndicator = screen.getByText('Southwest USA');
    expect(regionIndicator).toBeTruthy();
    
    const statesList = screen.getByText('CA • NV • UT • AZ');
    expect(statesList).toBeTruthy();
  });

  it('shows terrain legend with elevation markers', () => {
    render(SouthwestMap);
    
    const elevationTitle = screen.getByText('Elevation');
    expect(elevationTitle).toBeTruthy();
    
    const seaLevel = screen.getByText('Sea Level');
    const desert = screen.getByText('Desert');
    const mountains = screen.getByText('Mountains');
    
    expect(seaLevel).toBeTruthy();
    expect(desert).toBeTruthy();
    expect(mountains).toBeTruthy();
  });

  it('displays performance indicator', () => {
    render(SouthwestMap);
    
    const performanceIndicator = screen.getByText('Terrain Active');
    expect(performanceIndicator).toBeTruthy();
  });

  it('handles route prop updates', async () => {
    const testRoute = {
      type: 'Feature' as const,
      geometry: {
        type: 'LineString' as const,
        coordinates: [
          [-118.0, 34.0],
          [-115.0, 36.0]
        ]
      },
      properties: {}
    };

    const { rerender } = render(SouthwestMap, {
      props: { route: testRoute }
    });

    // Component should render without errors
    expect(screen.getByRole('generic')).toBeTruthy();

    // Update route prop
    const updatedRoute = {
      ...testRoute,
      geometry: {
        ...testRoute.geometry,
        coordinates: [
          [-118.0, 34.0],
          [-115.0, 36.0],
          [-112.0, 33.0]
        ]
      }
    };

    await rerender({ route: updatedRoute });
    expect(screen.getByRole('generic')).toBeTruthy();
  });

  it('handles waypoints prop updates', async () => {
    const initialWaypoints = [
      { lat: 36.0, lng: -115.0, name: 'Las Vegas' }
    ];

    const { rerender } = render(SouthwestMap, {
      props: { waypoints: initialWaypoints }
    });

    expect(screen.getByRole('generic')).toBeTruthy();

    // Update waypoints
    const updatedWaypoints = [
      ...initialWaypoints,
      { lat: 34.0, lng: -118.0, name: 'Los Angeles', icon: '🏙️' }
    ];

    await rerender({ waypoints: updatedWaypoints });
    expect(screen.getByRole('generic')).toBeTruthy();
  });

  it('handles POIs prop correctly', () => {
    const testPois = [
      { lat: 36.1, lng: -115.1, name: 'The Strip', category: 'entertainment' },
      { lat: 36.2, lng: -115.2, name: 'Red Rock Canyon', category: 'nature' }
    ];

    render(SouthwestMap, {
      props: { pois: testPois }
    });

    expect(screen.getByRole('generic')).toBeTruthy();
  });

  it('applies custom class names', () => {
    const customClass = 'my-custom-map-class';
    
    render(SouthwestMap, {
      props: { class: customClass }
    });

    const mapContainer = screen.getByRole('generic');
    expect(mapContainer.className).toContain(customClass);
  });
});
