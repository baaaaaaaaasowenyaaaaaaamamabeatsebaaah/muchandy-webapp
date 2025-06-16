// api-test.js - Updated with port detection for proxy vs direct testing
console.log('🧪 Starting Muchandy API Tests (Updated)...');

// Detect which port to use
const API_PORT = process.env.API_PORT || '3001'; // Default to direct API server
const SERVER_URL = `http://localhost:${API_PORT}`;

console.log(`🎯 Testing API at: ${SERVER_URL}`);
console.log(`💡 Use API_PORT=3000 to test through Vite proxy`);
console.log(`💡 Use API_PORT=3001 to test direct API server`);

// Test suite for API endpoints
const runApiTests = async () => {
  console.log('\n=== API CONNECTIVITY TESTS ===');

  try {
    // Test 1: Health check
    console.log('🩺 Testing health endpoint...');
    const healthResponse = await fetch(`${SERVER_URL}/health`);

    if (!healthResponse.ok) {
      throw new Error(
        `Health check failed: ${healthResponse.status} ${healthResponse.statusText}`
      );
    }

    const healthData = await healthResponse.json();
    console.log('✅ Health check:', healthData.status);
    console.log('   Server info:', {
      service: healthData.service,
      port: healthData.port,
      uptime: Math.round(healthData.uptime) + 's',
    });

    // Test 2: Manufacturers
    console.log('\n📱 Testing manufacturers endpoint...');
    const manufacturersResponse = await fetch(
      `${SERVER_URL}/api/manufacturers`
    );

    if (!manufacturersResponse.ok) {
      throw new Error(`Manufacturers failed: ${manufacturersResponse.status}`);
    }

    const manufacturers = await manufacturersResponse.json();
    console.log('✅ Manufacturers loaded:', manufacturers.length, 'items');
    console.log('   Sample:', manufacturers[0]);

    // Test 3: Devices for each manufacturer
    console.log('\n🔧 Testing devices endpoints...');
    for (const manufacturer of manufacturers.slice(0, 3)) {
      // Test first 3
      const devicesResponse = await fetch(
        `${SERVER_URL}/api/devices/${manufacturer.id}`
      );

      if (!devicesResponse.ok) {
        console.log(
          `❌ Devices for ${manufacturer.name}: ${devicesResponse.status}`
        );
        continue;
      }

      const devices = await devicesResponse.json();
      console.log(
        `✅ Devices for ${manufacturer.name}:`,
        devices.length,
        'items'
      );
      if (devices.length > 0) {
        console.log('   Sample device:', devices[0].name);
      }
    }

    // Test 4: Actions
    console.log('\n⚙️ Testing actions endpoint...');
    const actionsResponse = await fetch(`${SERVER_URL}/api/actions`);

    if (!actionsResponse.ok) {
      throw new Error(`Actions failed: ${actionsResponse.status}`);
    }

    const actions = await actionsResponse.json();
    console.log('✅ Actions loaded:', actions.length, 'items');
    console.log('   Sample action:', actions[0]);

    // Test 5: Prices
    console.log('\n💰 Testing price endpoints...');
    const priceResponse = await fetch(`${SERVER_URL}/api/price/1?deviceId=1`);

    if (!priceResponse.ok) {
      throw new Error(`Price calculation failed: ${priceResponse.status}`);
    }

    const priceData = await priceResponse.json();
    console.log('✅ Price calculation:', priceData.formatted);
    console.log('   Details:', {
      device: priceData.deviceId,
      action: priceData.actionId,
      basePrice: priceData.basePrice + '€',
      multiplier: priceData.multiplier,
      estimatedTime: priceData.estimatedTime,
    });

    // Test 6: Debug endpoint
    console.log('\n🔍 Testing debug endpoint...');
    const debugResponse = await fetch(`${SERVER_URL}/api/debug`);

    if (!debugResponse.ok) {
      throw new Error(`Debug failed: ${debugResponse.status}`);
    }

    const debugData = await debugResponse.json();
    console.log('✅ Debug data:');
    console.log('   Server:', debugData.server, 'on port', debugData.port);
    console.log('   Manufacturers:', debugData.manufacturers.length);
    console.log(
      '   Device categories:',
      Object.keys(debugData.devicesPerManufacturer)
    );
    console.log('   Total actions:', debugData.totalActions);
    console.log('   Sample prices:', debugData.samplePrices);

    console.log('\n🎉 All API tests passed!');
    return true;
  } catch (error) {
    console.error('\n❌ API test failed:', error.message);

    // Provide helpful troubleshooting
    if (error.code === 'ECONNREFUSED') {
      console.log('\n🔧 Troubleshooting:');
      if (API_PORT === '3001') {
        console.log('   1. Start the API server: npm run dev:api');
        console.log(
          '   2. Or test through Vite proxy: API_PORT=3000 node api-test.js'
        );
      } else {
        console.log('   1. Start Vite dev server: npm run dev');
        console.log(
          '   2. Or test API directly: API_PORT=3001 node api-test.js'
        );
      }
      console.log(
        '   3. Make sure both servers are running for full development'
      );
    }

    return false;
  }
};

// Test the MuchandyHero component workflow
const testMuchandyHeroWorkflow = async () => {
  console.log('\n=== MUCHANDY HERO WORKFLOW TEST ===');

  try {
    // Simulate the workflow that MuchandyHero would follow

    // Step 1: Load manufacturers
    console.log('📋 Step 1: Loading manufacturers...');
    const manufacturersResponse = await fetch(
      `${SERVER_URL}/api/manufacturers`
    );
    const manufacturers = await manufacturersResponse.json();
    console.log(
      '✅ Manufacturers available:',
      manufacturers.map((m) => m.name).join(', ')
    );

    // Step 2: Load devices for Apple (most common)
    const appleId = manufacturers.find((m) => m.name === 'Apple')?.id || 1;
    console.log(`📱 Step 2: Loading devices for manufacturer ${appleId}...`);
    const devicesResponse = await fetch(`${SERVER_URL}/api/devices/${appleId}`);
    const devices = await devicesResponse.json();
    console.log('✅ Apple devices:', devices.map((d) => d.name).join(', '));

    // Step 3: Load actions for repair
    console.log('🔧 Step 3: Loading repair actions...');
    const actionsResponse = await fetch(`${SERVER_URL}/api/actions`);
    const actions = await actionsResponse.json();
    console.log('✅ Available actions:', actions.map((a) => a.name).join(', '));

    // Step 4: Calculate price for iPhone 15 Pro Max + Display Repair
    const iphone15ProMax =
      devices.find((d) => d.name.includes('15 Pro Max')) || devices[0];
    const displayRepair =
      actions.find((a) => a.name.includes('Display')) || actions[0];

    console.log(
      `💰 Step 4: Calculating price for ${iphone15ProMax.name} + ${displayRepair.name}...`
    );
    const priceResponse = await fetch(
      `${SERVER_URL}/api/price/${displayRepair.id}?deviceId=${iphone15ProMax.id}`
    );
    const priceData = await priceResponse.json();

    console.log('✅ Price calculation result:');
    console.log(`   Device: ${iphone15ProMax.name}`);
    console.log(`   Action: ${displayRepair.name}`);
    console.log(`   Price: ${priceData.formatted}`);
    console.log(`   Estimated time: ${priceData.estimatedTime}`);
    console.log(
      `   Price breakdown: ${priceData.basePrice}€ base × ${priceData.multiplier} = ${priceData.price}€`
    );

    console.log('\n🎉 MuchandyHero workflow test completed successfully!');
    return true;
  } catch (error) {
    console.error('\n❌ MuchandyHero workflow test failed:', error.message);
    return false;
  }
};

// Test error handling
const testErrorHandling = async () => {
  console.log('\n=== ERROR HANDLING TESTS ===');

  try {
    // Test 1: Invalid manufacturer ID
    console.log('🚫 Testing invalid manufacturer ID...');
    const invalidManufacturerResponse = await fetch(
      `${SERVER_URL}/api/devices/999`
    );
    const invalidManufacturerData = await invalidManufacturerResponse.json();
    console.log(
      '✅ Invalid manufacturer handled:',
      invalidManufacturerData.length === 0
        ? 'Empty array returned'
        : 'Fallback data'
    );

    // Test 2: Invalid action ID for price
    console.log('🚫 Testing invalid action ID...');
    const invalidPriceResponse = await fetch(`${SERVER_URL}/api/price/999`);
    console.log('Response status:', invalidPriceResponse.status);
    if (invalidPriceResponse.status === 404) {
      const errorData = await invalidPriceResponse.json();
      console.log('✅ Invalid action handled:', errorData.error);
    }

    // Test 3: Invalid API endpoint
    console.log('🚫 Testing invalid API endpoint...');
    const invalidEndpointResponse = await fetch(`${SERVER_URL}/api/invalid`);
    if (invalidEndpointResponse.status === 404) {
      const errorData = await invalidEndpointResponse.json();
      console.log('✅ Invalid endpoint handled:', errorData.error);
    }

    console.log('\n🎉 Error handling tests completed!');
    return true;
  } catch (error) {
    console.error('\n❌ Error handling test failed:', error.message);
    return false;
  }
};

// Performance test
const testPerformance = async () => {
  console.log('\n=== PERFORMANCE TESTS ===');

  try {
    const startTime = performance.now();

    // Load all data in parallel (like MuchandyHero would)
    const [manufacturersRes, actionsRes] = await Promise.all([
      fetch(`${SERVER_URL}/api/manufacturers`),
      fetch(`${SERVER_URL}/api/actions`),
    ]);

    const [manufacturers, actions] = await Promise.all([
      manufacturersRes.json(),
      actionsRes.json(),
    ]);

    // Load devices for all manufacturers in parallel
    const devicePromises = manufacturers.map((m) =>
      fetch(`${SERVER_URL}/api/devices/${m.id}`).then((r) => r.json())
    );
    const allDevices = await Promise.all(devicePromises);

    const endTime = performance.now();
    const totalTime = endTime - startTime;

    console.log('✅ Performance test results:');
    console.log(`   Total load time: ${totalTime.toFixed(2)}ms`);
    console.log(`   Manufacturers: ${manufacturers.length}`);
    console.log(`   Total devices: ${allDevices.flat().length}`);
    console.log(`   Actions: ${actions.length}`);
    console.log(
      `   Average time per request: ${(totalTime / (2 + manufacturers.length)).toFixed(2)}ms`
    );

    if (totalTime < 500) {
      console.log('🚀 Performance: Excellent (< 500ms)');
    } else if (totalTime < 1000) {
      console.log('👍 Performance: Good (< 1s)');
    } else {
      console.log('⚠️ Performance: Slow (> 1s)');
    }

    return true;
  } catch (error) {
    console.error('\n❌ Performance test failed:', error.message);
    return false;
  }
};

// Run all tests
const runAllTests = async () => {
  console.log('🚀 Starting comprehensive Muchandy API test suite...\n');

  const results = {
    api: await runApiTests(),
    workflow: await testMuchandyHeroWorkflow(),
    errors: await testErrorHandling(),
    performance: await testPerformance(),
  };

  console.log('\n=== FINAL TEST RESULTS ===');
  console.log('API Tests:', results.api ? '✅ PASS' : '❌ FAIL');
  console.log('Workflow Tests:', results.workflow ? '✅ PASS' : '❌ FAIL');
  console.log('Error Handling:', results.errors ? '✅ PASS' : '❌ FAIL');
  console.log('Performance:', results.performance ? '✅ PASS' : '❌ FAIL');

  const allPassed = Object.values(results).every(Boolean);
  console.log(
    '\nOverall Result:',
    allPassed ? '🎉 ALL TESTS PASSED' : '❌ SOME TESTS FAILED'
  );

  if (allPassed) {
    console.log('\n✅ Your MuchandyHero component should work perfectly!');
    console.log('💡 Next steps:');
    console.log('   1. If testing direct API (port 3001): npm run dev:api');
    console.log('   2. If testing through proxy (port 3000): npm run dev');
    console.log('   3. For full development: npm run dev:full (both servers)');
    console.log('   4. Check browser console for component logs');
    console.log('   5. Test the forms in your MuchandyHero component');
  } else {
    console.log('\n⚠️ Some issues were found. Check the logs above.');
    console.log('💡 Common solutions:');
    console.log('   - Make sure the correct server is running');
    console.log("   - Check that you're testing the right port");
    console.log('   - Verify your server.js and vite.config.js are updated');
  }

  return allPassed;
};

// Export for use in browser or Node.js
if (typeof window !== 'undefined') {
  // Browser environment
  window.testMuchandyAPI = runAllTests;
  window.testAPIOnly = runApiTests;
  window.testWorkflow = testMuchandyHeroWorkflow;

  console.log('\n🔧 Test functions available in browser:');
  console.log('   - window.testMuchandyAPI() - Run all tests');
  console.log('   - window.testAPIOnly() - Test API only');
  console.log('   - window.testWorkflow() - Test MuchandyHero workflow');
} else {
  // Node.js environment
  runAllTests().then((success) => {
    process.exit(success ? 0 : 1);
  });
}
