import { describe, it, expect } from 'vitest';
import { 
  isInSouthwestRegion, 
  getStateFromCoordinates, 
  categorizePOI,
  getSeasonalWarnings,
  SOUTHWEST_REGION
} from './region';

describe('Southwest USA Regional Functions', () => {
  describe('isInSouthwestRegion', () => {
    it('should return true for Las Vegas (within Southwest bounds)', () => {
      expect(isInSouthwestRegion(36.1699, -115.1398)).toBe(true);
    });

    it('should return true for Los Angeles (within Southwest bounds)', () => {
      expect(isInSouthwestRegion(34.0522, -118.2437)).toBe(true);
    });

    it('should return true for Grand Canyon (within Southwest bounds)', () => {
      expect(isInSouthwestRegion(36.1069, -112.1129)).toBe(true);
    });

    it('should return false for Seattle (outside Southwest bounds)', () => {
      expect(isInSouthwestRegion(47.6062, -122.3321)).toBe(false);
    });

    it('should return false for Denver (outside Southwest bounds)', () => {
      expect(isInSouthwestRegion(39.7392, -104.9903)).toBe(false);
    });
  });

  describe('getStateFromCoordinates', () => {
    it('should return CA for Los Angeles coordinates', () => {
      expect(getStateFromCoordinates(34.0522, -118.2437)).toBe('CA');
    });

    it('should return NV for Las Vegas coordinates', () => {
      expect(getStateFromCoordinates(36.1699, -115.1398)).toBe('NV');
    });

    it('should return AZ for Phoenix coordinates', () => {
      expect(getStateFromCoordinates(33.4484, -112.0740)).toBe('AZ');
    });

    it('should return UT for Salt Lake City coordinates', () => {
      expect(getStateFromCoordinates(40.7608, -111.8910)).toBe('UT');
    });

    it('should return null for coordinates outside Southwest region', () => {
      expect(getStateFromCoordinates(47.6062, -122.3321)).toBe(null);
    });
  });

  describe('categorizePOI', () => {
    it('should categorize Grand Canyon as National Park', () => {
      const categories = categorizePOI('Grand Canyon National Park');
      expect(categories).toContain('National Park');
    });

    it('should categorize Route 66 locations', () => {
      const categories = categorizePOI('Historic Route 66 Diner');
      expect(categories).toContain('Scenic Route');
    });

    it('should categorize desert locations', () => {
      const categories = categorizePOI('Mojave Desert Vista Point');
      expect(categories).toContain('Desert/Canyon');
    });

    it('should categorize coastal locations', () => {
      const categories = categorizePOI('Malibu Beach');
      expect(categories).toContain('Coastal');
    });

    it('should return General for unknown POI', () => {
      const categories = categorizePOI('Random Gas Station');
      expect(categories).toContain('General');
    });
  });

  describe('getSeasonalWarnings', () => {
    it('should warn about heat in Arizona during summer', () => {
      const summerDate = new Date('2024-07-15'); // July
      const warnings = getSeasonalWarnings(33.4484, -112.0740, summerDate); // Phoenix
      expect(warnings.some(w => w.includes('heat'))).toBe(true);
    });

    it('should warn about snow in Utah during winter', () => {
      const winterDate = new Date('2024-01-15'); // January
      const warnings = getSeasonalWarnings(40.7608, -111.8910, winterDate); // Salt Lake City
      expect(warnings.some(w => w.includes('Snow'))).toBe(true);
    });

    it('should provide desert warnings for southern areas in summer', () => {
      const summerDate = new Date('2024-06-15'); // June
      const warnings = getSeasonalWarnings(35.0, -115.0, summerDate); // Southern area
      expect(warnings.some(w => w.includes('Desert'))).toBe(true);
    });
  });

  describe('SOUTHWEST_REGION constants', () => {
    it('should have correct states', () => {
      expect(SOUTHWEST_REGION.states).toEqual(['CA', 'NV', 'UT', 'AZ']);
    });

    it('should have correct default map center near Las Vegas', () => {
      expect(SOUTHWEST_REGION.mapDefaults.center).toEqual([-115.0, 36.0]);
    });

    it('should include major Southwest cities', () => {
      const cities = SOUTHWEST_REGION.poi.majorCities;
      expect(cities).toContain('Las Vegas');
      expect(cities).toContain('Los Angeles');
      expect(cities).toContain('Phoenix');
      expect(cities).toContain('Salt Lake City');
    });

    it('should include major National Parks', () => {
      const parks = SOUTHWEST_REGION.poi.nationalParks;
      expect(parks).toContain('Grand Canyon');
      expect(parks).toContain('Yosemite');
      expect(parks).toContain('Zion');
      expect(parks).toContain('Death Valley');
    });
  });
});
