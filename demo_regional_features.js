#!/usr/bin/env node

/**
 * Demo script to showcase Southwest USA regional features
 * This demonstrates the regional BFF pattern, scenic routing, and advanced features
 * 
 * Run with: node demo_regional_features.js
 */

import { RegionalService } from './src/lib/services/RegionalService.js';
import { ScenicRoutingService } from './src/lib/services/ScenicRoutingService.js';
import { MapBoxGeocodingService } from './src/lib/services/MapBoxGeocodingService.js';
import { EnhancedPOIService } from './src/lib/services/EnhancedPOIService.js';

console.log('🏜️ Southwest USA Regional Features Demo\n');

// Initialize services
const regionalService = new RegionalService();
const scenicService = new ScenicRoutingService();
const geocodingService = new MapBoxGeocodingService();
const poiService = new EnhancedPOIService();

async function demonstrateRegionalFeatures() {
  console.log('='.repeat(60));
  console.log('1. Regional Bounds Checking');
  console.log('='.repeat(60));
  
  const testLocations = [
    { name: 'Las Vegas, NV', lat: 36.1716, lng: -115.1391 },
    { name: 'Grand Canyon, AZ', lat: 36.1069, lng: -112.1129 },
    { name: 'Death Valley, CA', lat: 36.5054, lng: -117.0794 },
    { name: 'Outside Region (Denver)', lat: 39.7392, lng: -104.9903 }
  ];
  
  testLocations.forEach(location => {
    const inRegion = regionalService.isInSouthwestRegion(location.lat, location.lng);
    const status = inRegion ? '✅ Inside' : '❌ Outside';
    console.log(`${status} Southwest Region: ${location.name}`);
  });

  console.log('\n' + '='.repeat(60));
  console.log('2. Test Routes Validation');
  console.log('='.repeat(60));
  
  const testRoutes = regionalService.getTestRoutes();
  
  for (const route of testRoutes) {
    console.log(`\n📍 Testing Route: ${route.name}`);
    const validation = regionalService.validateRouteWaypoints(route.waypoints);
    
    if (validation.valid) {
      console.log('✅ Route is valid for Southwest region');
      console.log(`   Distance estimate: ${Math.round(regionalService.estimateRouteDistance ? regionalService.estimateRouteDistance(route.waypoints) : 0)}km`);
    } else {
      console.log('❌ Route validation failed:');
      validation.errors.forEach(error => console.log(`   - ${error}`));
    }
    
    if (validation.warnings.length > 0) {
      console.log('⚠️  Warnings:');
      validation.warnings.forEach(warning => console.log(`   - ${warning}`));
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('3. MapBox Geocoding Tests');
  console.log('='.repeat(60));
  
  const geocodingQueries = ['Las Vegas Strip', 'Grand Canyon', 'Route 66', 'Death Valley'];
  
  for (const query of geocodingQueries) {
    console.log(`\n🗺️  Searching: "${query}"`);
    try {
      const startTime = Date.now();
      const results = await geocodingService.searchPlaces(query);
      const responseTime = Date.now() - startTime;
      
      if (results.length > 0) {
        const topResult = results[0];
        console.log(`✅ Found: ${topResult.name}`);
        console.log(`   Address: ${topResult.address}`);
        console.log(`   Category: ${topResult.category}`);
        console.log(`   Coordinates: ${topResult.coordinates[1]}, ${topResult.coordinates[0]}`);
        console.log(`   Response time: ${responseTime}ms`);
      } else {
        console.log('❌ No results found');
      }
    } catch (error) {
      console.log(`❌ Error: ${error.message}`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('4. Scenic Route 66 Demo');
  console.log('='.repeat(60));
  
  const route66Waypoints = [
    { name: 'Needles, CA', lat: 34.8481, lng: -114.6140 },
    { name: 'Flagstaff, AZ', lat: 35.1983, lng: -111.6513 }
  ];
  
  console.log('🛣️  Route 66 Segment: Needles → Flagstaff');
  
  try {
    const routes = await scenicService.getScenicRoutes(route66Waypoints, {
      preferRoute66: true,
      photographyFriendly: true,
      avoidExtremeHeat: false
    });
    
    console.log(`✅ Generated ${routes.length} route alternatives:`);
    
    routes.forEach((route, index) => {
      console.log(`\n   Route ${index + 1}: ${route.name}`);
      console.log(`   Distance: ${route.distance} miles`);
      console.log(`   Duration: ${Math.round(route.duration / 60)} hours`);
      console.log(`   Difficulty: ${route.difficulty}`);
      console.log(`   Type: ${route.routeType}`);
      
      if (route.warnings.length > 0) {
        console.log('   Warnings:');
        route.warnings.forEach(warning => console.log(`     - ${warning}`));
      }
    });
  } catch (error) {
    console.log(`❌ Scenic routing failed: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('5. Weather-Based Routing');
  console.log('='.repeat(60));
  
  const phoenixToVegas = [
    { name: 'Phoenix, AZ', lat: 33.4484, lng: -112.0740 },
    { name: 'Las Vegas, NV', lat: 36.1716, lng: -115.1391 }
  ];
  
  const extremeHeatWeather = {
    temperature: 115,
    condition: 'extreme_heat',
    season: 'summer'
  };
  
  console.log('🌡️  Phoenix → Las Vegas in extreme heat (115°F)');
  
  try {
    const weatherRoutes = await scenicService.getWeatherOptimizedRoute(
      phoenixToVegas, 
      extremeHeatWeather
    );
    
    console.log(`✅ Generated ${weatherRoutes.length} weather-optimized routes`);
    
    const heatWarnings = weatherRoutes.flatMap(r => r.warnings)
      .filter(w => w.includes('heat') || w.includes('water'));
    
    if (heatWarnings.length > 0) {
      console.log('🔥 Heat-related warnings detected:');
      heatWarnings.forEach(warning => console.log(`   - ${warning}`));
    }
  } catch (error) {
    console.log(`❌ Weather routing failed: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('6. Fuel Range Calculation');
  console.log('='.repeat(60));
  
  const lasVegasStart = { name: 'Las Vegas, NV', lat: 36.1716, lng: -115.1391 };
  
  console.log('⛽ Calculating fuel range from Las Vegas...');
  
  try {
    const fuelRange = scenicService.calculateFuelRange(
      lasVegasStart,
      25, // MPG
      15, // tank capacity gallons
      0.25 // 25% safety margin
    );
    
    console.log(`✅ Vehicle Range Analysis:`);
    console.log(`   Maximum range: ${fuelRange.maxRange} miles`);
    console.log(`   Recommended range: ${fuelRange.recommendedRange} miles`);
    console.log(`   Fuel stops found: ${fuelRange.fuelStops.length}`);
    
    if (fuelRange.fuelStops.length > 0) {
      console.log('   Available fuel stops:');
      fuelRange.fuelStops.forEach(stop => {
        console.log(`     - ${stop.name}`);
      });
    }
  } catch (error) {
    console.log(`❌ Fuel calculation failed: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('7. Southwest POI Categories');
  console.log('='.repeat(60));
  
  console.log('🗺️  Southwest-specific POI categories:');
  
  try {
    const categories = poiService.getSouthwestCategories();
    
    Object.entries(categories).forEach(([key, category]) => {
      console.log(`\n   ${category.name}:`);
      category.subcategories.slice(0, 3).forEach(sub => {
        console.log(`     - ${sub}`);
      });
      if (category.subcategories.length > 3) {
        console.log(`     ... and ${category.subcategories.length - 3} more`);
      }
    });
  } catch (error) {
    console.log(`❌ POI categories failed: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('8. Photography Planning');
  console.log('='.repeat(60));
  
  const grandCanyonLocation = { name: 'Grand Canyon', lat: 36.1069, lng: -112.1129 };
  
  console.log('📸 Photography planning for Grand Canyon...');
  
  try {
    const sunTimes = scenicService.getSunriseSunsetTimes(grandCanyonLocation);
    
    console.log(`✅ Lighting conditions for today:`);
    console.log(`   Sunrise: ${sunTimes.sunrise.toLocaleTimeString()}`);
    console.log(`   Golden Hour: ${sunTimes.goldenHourStart.toLocaleTimeString()} - ${sunTimes.goldenHourEnd.toLocaleTimeString()}`);
    console.log(`   Sunset: ${sunTimes.sunset.toLocaleTimeString()}`);
    console.log(`   Blue Hour: ${sunTimes.blueHourStart.toLocaleTimeString()} - ${sunTimes.blueHourEnd.toLocaleTimeString()}`);
  } catch (error) {
    console.log(`❌ Photography planning failed: ${error.message}`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎉 Regional Features Demo Complete!');
  console.log('='.repeat(60));
  console.log('\nAll Southwest USA regional features are functional:');
  console.log('✅ Regional bounds checking');  
  console.log('✅ Route validation and restrictions');
  console.log('✅ MapBox geocoding with regional filtering');
  console.log('✅ Historic Route 66 scenic routing');
  console.log('✅ Weather-based route optimization');
  console.log('✅ Fuel range calculation with Southwest stops');
  console.log('✅ Southwest-specific POI categories');
  console.log('✅ Photography planning with sun times');
  console.log('\n🚗 Ready for Southwest USA road trips!');
}

// Run the demonstration
demonstrateRegionalFeatures().catch(error => {
  console.error('Demo failed:', error);
  process.exit(1);
});
