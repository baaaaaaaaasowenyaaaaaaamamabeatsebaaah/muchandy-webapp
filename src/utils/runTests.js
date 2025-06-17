// src/utils/runTests.js - Test runner for timing verification
import {
  runIntegrationTests,
  createTimingInspector,
} from './testingFramework.js';
import { appState } from './stateStore.js';

console.log('=== RUNNING TIMING VERIFICATION TESTS ===');

// Auto-run tests in development
if (import.meta.env.DEV) {
  // Wait for app to fully initialize
  appState.waitFor('app.initialized', 10000).then(async () => {
    console.log('🚀 App initialized, running timing tests...');

    // Start timing inspector
    const inspector = createTimingInspector();
    inspector.start();

    // Wait a bit to capture initialization
    await new Promise((resolve) => setTimeout(resolve, 1000));

    // Stop and analyze
    inspector.stop();
    console.log('📊 Initialization Timeline:');
    inspector.visualize();

    // Run integration tests
    const report = await runIntegrationTests();

    // Show results
    if (report.summary.failed === 0) {
      console.log('✅ All timing tests passed!');
    } else {
      console.error('❌ Some timing tests failed:');
      report.results
        .filter((r) => r.status === 'failed')
        .forEach((r) => console.error(`  - ${r.name}: ${r.error}`));
    }
  });
}
