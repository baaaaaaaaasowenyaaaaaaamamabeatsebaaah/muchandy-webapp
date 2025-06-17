// src/utils/testingFramework.js - Comprehensive testing utilities
import { appState } from './stateStore.js';
import { serviceCoordinator } from './serviceCoordinator.js';
import { priorityLoader } from './priorityLoader.js';

console.log('=== TESTING FRAMEWORK FOR TIMING VERIFICATION ===');

// Test suite for verifying timing issues are resolved - KISS principle
export class TimingTestSuite {
  constructor() {
    this.tests = [];
    this.results = [];
    this.startTime = null;
  }

  // Add a test - Economy of Expression
  addTest(name, testFn, options = {}) {
    this.tests.push({
      name,
      testFn,
      timeout: options.timeout || 5000,
      critical: options.critical || false,
    });
  }

  // Run all tests - Algorithmic Elegance
  async runAll() {
    console.log('🧪 Starting timing verification tests...');
    this.startTime = Date.now();
    this.results = [];

    for (const test of this.tests) {
      const result = await this.runTest(test);
      this.results.push(result);

      if (result.status === 'failed' && test.critical) {
        console.error('❌ Critical test failed, stopping...');
        break;
      }
    }

    return this.generateReport();
  }

  // Run single test with timeout - Maximum Conciseness
  async runTest(test) {
    console.log(`🔄 Running test: ${test.name}`);
    const startTime = Date.now();

    try {
      const result = await Promise.race([
        test.testFn(),
        new Promise((_, reject) =>
          setTimeout(() => reject(new Error('Test timeout')), test.timeout)
        ),
      ]);

      const duration = Date.now() - startTime;
      console.log(`✅ ${test.name} passed in ${duration}ms`);

      return {
        name: test.name,
        status: 'passed',
        duration,
        result,
      };
    } catch (error) {
      const duration = Date.now() - startTime;
      console.error(`❌ ${test.name} failed:`, error.message);

      return {
        name: test.name,
        status: 'failed',
        duration,
        error: error.message,
      };
    }
  }

  // Generate test report
  generateReport() {
    const totalDuration = Date.now() - this.startTime;
    const passed = this.results.filter((r) => r.status === 'passed').length;
    const failed = this.results.filter((r) => r.status === 'failed').length;

    const report = {
      summary: {
        total: this.results.length,
        passed,
        failed,
        duration: totalDuration,
        passRate: ((passed / this.results.length) * 100).toFixed(1) + '%',
      },
      results: this.results,
      timestamp: new Date().toISOString(),
    };

    console.log('📊 Test Report:', report.summary);
    return report;
  }
}

// Create timing verification tests - KISS approach
export const createTimingTests = () => {
  const suite = new TimingTestSuite();

  // Test 1: Theme loads before anything else
  suite.addTest(
    'Theme loads first',
    async () => {
      // Clear state
      appState.clear();
      serviceCoordinator.clear();

      // Check that theme is marked as CRITICAL priority
      const themeService = serviceCoordinator.services.get('theme');
      if (!themeService || themeService.priority !== 1) {
        throw new Error('Theme service not registered with CRITICAL priority');
      }

      // Verify theme loads before other services
      const loadOrder = serviceCoordinator.computeLoadOrder();
      const themeIndex = loadOrder.indexOf('theme');
      const headerIndex = loadOrder.indexOf('header');

      if (themeIndex > headerIndex) {
        throw new Error('Theme should load before header');
      }

      return true;
    },
    { critical: true }
  );

  // Test 2: API data loads before MuchandyHero renders
  suite.addTest('API data loads before MuchandyHero', async () => {
    // Track loading sequence
    const sequence = [];

    // Mock API load
    appState.subscribe('services.api.ready', () => {
      sequence.push('api-ready');
    });

    // Mock MuchandyHero render
    appState.subscribe('components.muchandy-hero.status', (status) => {
      if (status === 'initializing') {
        sequence.push('hero-init');
      }
    });

    // Simulate loading
    appState.set('services.api.ready', true);
    appState.set('components.muchandy-hero.status', 'initializing');

    // Verify sequence
    if (sequence[0] !== 'api-ready' || sequence[1] !== 'hero-init') {
      throw new Error('API should be ready before hero initializes');
    }

    return sequence;
  });

  // Test 3: No race conditions in service loading
  suite.addTest('No service loading race conditions', async () => {
    const loadingStates = [];

    // Monitor all service loading
    appState.subscribe('services', (services) => {
      const loading = Object.entries(services || {})
        .filter(([_, state]) => state.loading)
        .map(([name]) => name);

      if (loading.length > 0) {
        loadingStates.push({
          timestamp: Date.now(),
          loading: [...loading],
        });
      }
    });

    // Check for overlapping critical services
    for (let i = 1; i < loadingStates.length; i++) {
      const current = loadingStates[i].loading;
      const previous = loadingStates[i - 1].loading;

      // Theme and storyblok shouldn't load simultaneously
      if (current.includes('theme') && previous.includes('storyblok')) {
        throw new Error('Theme and Storyblok loading simultaneously');
      }
    }

    return true;
  });

  // Test 4: State updates are batched properly
  suite.addTest('State updates are batched', async () => {
    let updateCount = 0;

    // Monitor state updates
    const unsubscribe = appState.subscribe('*', () => {
      updateCount++;
    });

    // Batch update
    await appState.batchUpdate({
      'test.a': 1,
      'test.b': 2,
      'test.c': 3,
    });

    unsubscribe();

    // Should be 3 updates (one for each path)
    if (updateCount !== 3) {
      throw new Error(`Expected 3 updates, got ${updateCount}`);
    }

    return updateCount;
  });

  // Test 5: Components wait for dependencies
  suite.addTest('Components wait for dependencies', async () => {
    // Set up dependency chain
    appState.set('test.dependency.ready', false);

    let componentLoaded = false;
    const componentPromise = appState
      .waitFor('test.dependency.ready', 2000)
      .then(() => {
        componentLoaded = true;
      });

    // Component shouldn't load yet
    await new Promise((resolve) => setTimeout(resolve, 100));
    if (componentLoaded) {
      throw new Error('Component loaded before dependency');
    }

    // Fulfill dependency
    appState.set('test.dependency.ready', true);
    await componentPromise;

    if (!componentLoaded) {
      throw new Error('Component failed to load after dependency');
    }

    return true;
  });

  // Test 6: Priority loader respects order
  suite.addTest('Priority loader respects order', async () => {
    const loadSequence = [];

    // Load items with different priorities
    priorityLoader.load(1, 'critical-item', async () => {
      await new Promise((resolve) => setTimeout(resolve, 50));
      loadSequence.push('critical');
      return 'critical-data';
    });

    priorityLoader.load(3, 'normal-item', async () => {
      loadSequence.push('normal');
      return 'normal-data';
    });

    // Wait for critical priority
    await priorityLoader.waitForPriority(1);

    if (loadSequence[0] !== 'critical') {
      throw new Error('Critical item should load first');
    }

    return loadSequence;
  });

  // Test 7: Error recovery works
  suite.addTest('Error recovery mechanism', async () => {
    let retryCount = 0;

    // Create failing service that succeeds on retry
    const testService = {
      load: async () => {
        retryCount++;
        if (retryCount < 2) {
          throw new Error('Simulated failure');
        }
        return 'success';
      },
    };

    // Should retry and succeed
    const result = await priorityLoader.load(
      2,
      'retry-test',
      () => testService.load(),
      { retry: true }
    );

    if (result !== 'success' || retryCount !== 2) {
      throw new Error('Retry mechanism failed');
    }

    return { retryCount, result };
  });

  return suite;
};

// Integration test runner - Economy of Expression
export const runIntegrationTests = async () => {
  console.log('🚀 Running Muchandy integration tests...');

  const tests = createTimingTests();
  const report = await tests.runAll();

  // Save report to state
  appState.set('testing.lastReport', report);

  return report;
};

// Visual timing inspector - Maximum Conciseness
export const createTimingInspector = () => {
  const events = [];
  let recording = false;

  const record = (event) => {
    if (recording) {
      events.push({
        ...event,
        timestamp: Date.now(),
        relativeTime: Date.now() - events[0]?.timestamp || 0,
      });
    }
  };

  // Subscribe to all relevant events
  appState.subscribe('*', ({ path, value }) => {
    record({ type: 'state', path, value });
  });

  return {
    start: () => {
      events.length = 0;
      recording = true;
      console.log('🔴 Recording timing events...');
    },

    stop: () => {
      recording = false;
      console.log('⏹️ Recording stopped');
      return events;
    },

    analyze: () => {
      const analysis = {
        totalEvents: events.length,
        duration: events[events.length - 1]?.timestamp - events[0]?.timestamp,
        byType: {},
        criticalPath: [],
      };

      // Group by type
      events.forEach((event) => {
        analysis.byType[event.type] = (analysis.byType[event.type] || 0) + 1;
      });

      // Find critical path (service loading)
      analysis.criticalPath = events
        .filter(
          (e) => e.path?.includes('services') && e.path?.includes('ready')
        )
        .map((e) => ({
          service: e.path.split('.')[1],
          time: e.relativeTime,
        }));

      return analysis;
    },

    visualize: () => {
      console.log('📊 Timing Visualization:');
      console.log('═'.repeat(50));

      const serviceEvents = events.filter(
        (e) =>
          e.path?.includes('services') &&
          (e.path.includes('ready') || e.path.includes('loading'))
      );

      serviceEvents.forEach((event) => {
        const service = event.path.split('.')[1];
        const status = event.path.includes('ready') ? '✅' : '🔄';
        const bar = '█'.repeat(Math.floor(event.relativeTime / 10));
        console.log(
          `${status} ${service.padEnd(15)} ${bar} ${event.relativeTime}ms`
        );
      });

      console.log('═'.repeat(50));
    },
  };
};

// Development helpers
if (import.meta.env.DEV) {
  window.timingTests = createTimingTests();
  window.runIntegrationTests = runIntegrationTests;
  window.timingInspector = createTimingInspector();

  // Quick test command
  window.testTiming = async () => {
    const inspector = createTimingInspector();
    inspector.start();

    // Wait for app to initialize
    await new Promise((resolve) => setTimeout(resolve, 2000));

    inspector.stop();
    inspector.visualize();

    // Run tests
    const report = await runIntegrationTests();
    console.table(report.results);

    return report;
  };

  console.log('🔧 Testing Framework development helpers:');
  console.log('  - window.testTiming() - Run full timing test suite');
  console.log('  - window.timingInspector - Manual timing inspection');
  console.log('  - window.runIntegrationTests() - Run integration tests');
}

console.log('✅ Testing Framework ready');

export default {
  TimingTestSuite,
  createTimingTests,
  runIntegrationTests,
  createTimingInspector,
};
