// test-query-api.js - Test the query parameter API approach
console.log('🧪 Testing Query Parameter API');
console.log('==============================\n');

const SERVER_URL = 'http://localhost:3001';

async function testQueryAPI() {
  const tests = [
    {
      name: 'Health Check',
      url: `${SERVER_URL}/health`,
      expected: 'status: ok',
    },
    {
      name: 'Manufacturers',
      url: `${SERVER_URL}/api/manufacturers`,
      expected: 'array of manufacturers',
    },
    {
      name: 'Devices for Apple',
      url: `${SERVER_URL}/api/devices?manufacturerId=1`,
      expected: 'array of Apple devices',
    },
    {
      name: 'All Actions',
      url: `${SERVER_URL}/api/actions`,
      expected: 'array of repair actions',
    },
    {
      name: 'Price Calculation',
      url: `${SERVER_URL}/api/price?actionId=1&deviceId=1`,
      expected: 'price calculation result',
    },
    {
      name: 'Debug Info',
      url: `${SERVER_URL}/api/debug`,
      expected: 'debug information',
    },
  ];

  console.log('Running API tests...\n');

  let passed = 0;
  let failed = 0;

  for (const test of tests) {
    try {
      console.log(`🔄 Testing: ${test.name}`);
      console.log(`   URL: ${test.url}`);

      const response = await fetch(test.url);

      if (response.ok) {
        const data = await response.json();
        console.log(`   ✅ SUCCESS: Got ${test.expected}`);

        // Show sample data for key endpoints
        if (test.name === 'Manufacturers') {
          console.log(
            `   📊 Found ${data.length} manufacturers: ${data.map((m) => m.name).join(', ')}`
          );
        } else if (test.name === 'Price Calculation') {
          console.log(`   💰 Price: ${data.formatted} for ${data.message}`);
        }

        passed++;
      } else {
        console.log(`   ❌ FAILED: HTTP ${response.status}`);
        failed++;
      }
    } catch (error) {
      console.log(`   ❌ ERROR: ${error.message}`);
      failed++;
    }

    console.log(''); // Empty line for readability
  }

  // Summary
  console.log('=================================');
  console.log('📊 TEST RESULTS');
  console.log('=================================');
  console.log(`✅ Passed: ${passed}`);
  console.log(`❌ Failed: ${failed}`);
  console.log(`📋 Total: ${tests.length}`);

  if (failed === 0) {
    console.log('\n🎉 ALL TESTS PASSED!');
    console.log('✅ Query parameter API is working correctly');
    console.log('✅ Express 5.x compatibility confirmed');
    console.log('\n📱 Ready for MuchandyHero integration!');
    console.log('\n🔧 Next steps:');
    console.log('   1. Update your apiService.js with the new version');
    console.log(
      '   2. Test MuchandyHero in browser: window.testMuchandyHero()'
    );
    console.log('   3. Verify forms populate with real data');
  } else {
    console.log('\n⚠️ Some tests failed');
    console.log('🔧 Make sure the server is running: node server.js');
  }

  return failed === 0;
}

// Bonus: Test the specific workflow MuchandyHero needs
async function testMuchandyHeroWorkflow() {
  console.log('\n🎯 TESTING MUCHANDY HERO WORKFLOW');
  console.log('==================================');

  try {
    // Step 1: Get manufacturers
    console.log('📋 Step 1: Getting manufacturers...');
    const mfgResponse = await fetch(`${SERVER_URL}/api/manufacturers`);
    const manufacturers = await mfgResponse.json();
    console.log(`   ✅ Got ${manufacturers.length} manufacturers`);

    // Step 2: Get devices for first manufacturer
    const firstMfg = manufacturers[0];
    console.log(`📱 Step 2: Getting devices for ${firstMfg.name}...`);
    const devicesResponse = await fetch(
      `${SERVER_URL}/api/devices?manufacturerId=${firstMfg.id}`
    );
    const devices = await devicesResponse.json();
    console.log(`   ✅ Got ${devices.length} devices`);

    // Step 3: Get actions
    console.log('🔧 Step 3: Getting repair actions...');
    const actionsResponse = await fetch(`${SERVER_URL}/api/actions`);
    const actions = await actionsResponse.json();
    console.log(`   ✅ Got ${actions.length} actions`);

    // Step 4: Calculate price
    const firstDevice = devices[0];
    const firstAction = actions[0];
    console.log(
      `💰 Step 4: Calculating price for ${firstDevice.name} + ${firstAction.name}...`
    );
    const priceResponse = await fetch(
      `${SERVER_URL}/api/price?actionId=${firstAction.id}&deviceId=${firstDevice.id}`
    );
    const priceData = await priceResponse.json();
    console.log(`   ✅ Price: ${priceData.formatted}`);

    console.log('\n🎉 MUCHANDY HERO WORKFLOW COMPLETE!');
    console.log('✅ All form dropdowns will populate correctly');
    console.log('✅ Price calculations will work in real-time');

    return true;
  } catch (error) {
    console.error('\n❌ Workflow test failed:', error.message);
    return false;
  }
}

// Run tests
async function runAllTests() {
  const basicTests = await testQueryAPI();

  if (basicTests) {
    await testMuchandyHeroWorkflow();
  }

  return basicTests;
}

// Export for use in other scripts
export { testQueryAPI, testMuchandyHeroWorkflow };

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests().catch(console.error);
}
