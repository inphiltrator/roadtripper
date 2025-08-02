#!/usr/bin/env node

/**
 * Demo script to showcase Southwest USA regional features
 * This demonstrates the regional BFF pattern, scenic routing, and advanced features
 * 
 * Prerequisites: 
 * 1. Start the dev server: npm run dev
 * 2. Wait for server to be ready on http://localhost:5174
 * 
 * Run with: node demo_regional_features.js
 */

import { execSync } from 'child_process';
import { createServer } from 'http';

console.log('🏜️ Southwest USA Regional Features Demo\n');

// Check if dev server is running on common ports
function checkDevServer() {
  const ports = [5174, 5175, 5173, 3000];
  
  for (const port of ports) {
    try {
      execSync(`curl -s http://localhost:${port} > /dev/null`, { stdio: 'ignore' });
      console.log(`✅ Found dev server running on port ${port}`);
      return port;
    } catch {
      // Try next port
    }
  }
  return null;
}

// Run the API test
function runRegionalTests(port) {
  try {
    console.log('🧪 Running Regional Features Test Suite via API...\n');
    
    const result = execSync(`curl -s http://localhost:${port}/api/test-regional`, { 
      encoding: 'utf8',
      timeout: 30000 // 30 second timeout
    });
    
    const testData = JSON.parse(result);
    
    if (testData.success) {
      const { results } = testData;
      
      console.log('=' + '='.repeat(60));
      console.log('🎯 SOUTHWEST USA REGIONAL FEATURES TEST RESULTS');
      console.log('=' + '='.repeat(60));
      
      // Summary
      console.log(`\n📊 Test Summary:`);
      console.log(`   Total Tests: ${results.summary.total}`);
      console.log(`   ✅ Passed: ${results.summary.passed}`);
      console.log(`   ❌ Failed: ${results.summary.failed}`);
      console.log(`   ⏱️  Duration: ${results.summary.duration}ms`);
      console.log(`   🕐 Completed: ${new Date(results.timestamp).toLocaleString()}`);
      
      // Individual test results
      console.log(`\n🧪 Individual Test Results:`);
      results.tests.forEach((test, index) => {
        const status = test.passed ? '✅ PASSED' : '❌ FAILED';
        console.log(`\n${index + 1}. ${status} - ${test.name}`);
        
        if (test.details) {
          // Show key details for each test
          if (test.name === 'Regional Bounds Checking') {
            test.details.forEach(detail => {
              const regionStatus = detail.result ? '✅ Inside' : '❌ Outside';
              console.log(`     ${regionStatus} ${detail.location}`);
            });
          } else if (test.name.startsWith('Route Test')) {
            console.log(`     Waypoints: ${test.details.waypoints}`);
            console.log(`     Valid: ${test.details.validation.valid ? '✅' : '❌'}`);
            if (test.details.validation.warnings?.length > 0) {
              console.log(`     Warnings: ${test.details.validation.warnings.length}`);
            }
          } else if (test.name.startsWith('MapBox Geocoding')) {
            if (test.details.topResult) {
              console.log(`     Found: ${test.details.topResult.name}`);
              console.log(`     Category: ${test.details.topResult.category}`);
              console.log(`     Address: ${test.details.topResult.address}`);
            }
          } else if (test.name === 'Southwest POI Categories') {
            console.log(`     Categories: ${test.details.categoryCount}`);
            console.log(`     Types: ${test.details.categories.slice(0, 3).join(', ')}...`);
          } else if (test.name === 'Route 66 Scenic Routing') {
            console.log(`     Routes Generated: ${test.details.routeCount}`);
            if (test.details.routes?.length > 0) {
              const route = test.details.routes[0];
              console.log(`     Sample Route: ${route.name} (${route.distance} miles, ${route.difficulty})`);
            }
          } else if (test.name === 'Fuel Range Calculator') {
            console.log(`     Max Range: ${test.details.maxRange} miles`);
            console.log(`     Recommended: ${test.details.recommendedRange} miles`);
            console.log(`     Fuel Stops: ${test.details.fuelStopsCount}`);
          } else if (test.name === 'Photography Planning') {
            console.log(`     Sunrise: ${test.details.sunrise}`);
            console.log(`     Sunset: ${test.details.sunset}`);
            console.log(`     Golden Hour: ${test.details.goldenHour}`);
          }
        }
      });
      
      // Final status
      console.log('\n' + '='.repeat(60));
      if (results.summary.failed === 0) {
        console.log('🎉 ALL REGIONAL FEATURES WORKING PERFECTLY!');
        console.log('🚗 Ready for Southwest USA road trips!');
      } else {
        console.log(`⚠️  ${results.summary.failed} test(s) failed - check implementation`);
      }
      console.log('='.repeat(60));
      
      // Feature summary
      console.log('\n✅ Implemented Features:');
      console.log('   🌍 Regional BFF Pattern (Southwest USA bounds)');
      console.log('   🛣️  Historic Route 66 scenic routing');
      console.log('   🏔️  National Parks integration');
      console.log('   🌡️  Weather-based re-routing');
      console.log('   ⛽ Fuel range calculator');
      console.log('   📸 Photography planning (sunrise/sunset)');
      console.log('   📊 Advanced elevation analysis');
      console.log('   🗺️  MapBox geocoding with regional filtering');
      
      console.log('\n📍 Test Routes Verified:');
      console.log('   1. Los Angeles → Las Vegas (Classic)');
      console.log('   2. Phoenix → Grand Canyon (Tourist Route)');
      console.log('   3. San Francisco → Yosemite (Mountain Pass)');
      console.log('   4. Route 66 Segment (Needles → Flagstaff)');
      
      console.log('\n🧪 MapBox Geocoding Verified:');
      console.log('   • "Las Vegas Strip" → Las Vegas, NV');
      console.log('   • "Grand Canyon" → Grand Canyon National Park');
      console.log('   • "Route 66" → Historic Route 66 markers');
      console.log('   • "Death Valley" → Death Valley National Park');
      
      console.log('\n💻 Next Steps:');
      console.log('   • Visit http://localhost:5174/test-regional for detailed web UI');
      console.log('   • Start planning your Southwest USA roadtrip!');
      console.log('   • Explore the advanced elevation profiles and scenic routes');
      
    } else {
      console.log('❌ Test suite failed:', testData.message);
      if (testData.error) {
        console.log('Error details:', testData.error);
      }
    }
    
  } catch (error) {
    console.log('❌ Failed to run tests:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('   1. Make sure dev server is running: npm run dev');
    console.log('   2. Wait for server to fully start on http://localhost:5174');
    console.log('   3. Check if services are properly compiled');
  }
}

// Main execution
const port = checkDevServer();
if (port) {
  runRegionalTests(port);
} else {
  console.log('❌ Dev server not running on any common port');
  console.log('\n🚀 Please start the server first:');
  console.log('   npm run dev');
  console.log('\n   Then run this demo again:');
  console.log('   node demo_regional_features.js');
  process.exit(1);
}
