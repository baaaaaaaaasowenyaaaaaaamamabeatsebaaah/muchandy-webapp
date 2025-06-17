// src/utils/priorityLoader.js - Priority-based resource loading system
console.log('=== PRIORITY LOADER LOADING ===');

// Priority levels for resource loading - KISS principle
export const LoadPriority = {
  CRITICAL: 1, // Theme, core layout, essential styles
  HIGH: 2, // Header, footer, SEO, global services
  NORMAL: 3, // Page content, main components
  LOW: 4, // Analytics, non-critical features
  LAZY: 5, // Images, deferred content
};

// Reverse lookup for debugging - Economy of Expression
const PriorityNames = Object.entries(LoadPriority).reduce(
  (acc, [name, value]) => {
    acc[value] = name;
    return acc;
  },
  {}
);

class PriorityLoader {
  constructor() {
    this.queues = new Map(); // Priority -> Map of promises
    this.loaded = new Map(); // Key -> result cache
    this.loading = new Map(); // Key -> promise (prevents duplicates)
    this.errors = new Map(); // Key -> error
    console.log('✅ PriorityLoader initialized');
  }

  // Load a resource with priority - Algorithmic Elegance
  async load(priority, key, loaderFn, options = {}) {
    const { retry = true, cache = true, timeout = 30000 } = options;

    console.log(`🔄 Loading [${PriorityNames[priority]}] ${key}`);

    // Check if already loaded
    if (cache && this.loaded.has(key)) {
      console.log(`📦 Cache hit: ${key}`);
      return this.loaded.get(key);
    }

    // Check if currently loading (prevent duplicate requests)
    if (this.loading.has(key)) {
      console.log(`⏳ Already loading: ${key}`);
      return this.loading.get(key);
    }

    // Initialize priority queue if needed
    if (!this.queues.has(priority)) {
      this.queues.set(priority, new Map());
    }

    // Create loader promise with timeout - Maximum Conciseness
    const loaderPromise = this.createTimedPromise(
      loaderFn(),
      timeout,
      `Loading ${key} timed out after ${timeout}ms`
    );

    // Track loading state
    this.loading.set(key, loaderPromise);
    this.queues.get(priority).set(key, loaderPromise);

    try {
      const result = await loaderPromise;

      // Cache result
      if (cache) {
        this.loaded.set(key, result);
      }

      // Clear loading state
      this.loading.delete(key);
      this.errors.delete(key);

      console.log(`✅ Loaded [${PriorityNames[priority]}] ${key}`);
      return result;
    } catch (error) {
      // Clear loading state
      this.loading.delete(key);
      this.errors.set(key, error);

      console.error(
        `❌ Failed [${PriorityNames[priority]}] ${key}:`,
        error.message
      );

      // Retry logic if enabled
      if (retry && !error.message.includes('timed out')) {
        console.log(`🔁 Retrying ${key}...`);
        return this.load(priority, key, loaderFn, { ...options, retry: false });
      }

      throw error;
    }
  }

  // Create promise with timeout - KISS approach
  createTimedPromise(promise, timeout, timeoutMessage) {
    if (!timeout || timeout === Infinity) return promise;

    return Promise.race([
      promise,
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error(timeoutMessage)), timeout)
      ),
    ]);
  }

  // Wait for all resources at priority level or higher - Economy of Expression
  async waitForPriority(maxPriority) {
    console.log(
      `⏳ Waiting for priority ${PriorityNames[maxPriority]} and higher...`
    );

    const promises = [];

    // Collect all promises for priorities up to maxPriority
    for (
      let priority = LoadPriority.CRITICAL;
      priority <= maxPriority;
      priority++
    ) {
      const queue = this.queues.get(priority);
      if (queue) {
        promises.push(...queue.values());
      }
    }

    if (promises.length === 0) {
      console.log('✅ No resources to wait for');
      return;
    }

    console.log(`⏳ Waiting for ${promises.length} resources...`);

    // Wait for all, but don't fail if some error
    const results = await Promise.allSettled(promises);

    const succeeded = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(
      `✅ Priority wait complete: ${succeeded} succeeded, ${failed} failed`
    );

    // Throw if all failed
    if (failed > 0 && succeeded === 0) {
      throw new Error('All resources failed to load');
    }
  }

  // Load multiple resources in parallel - Algorithmic Elegance
  async loadMany(items) {
    console.log(`🔄 Loading ${items.length} resources in parallel`);

    const promises = items.map(({ priority, key, loader, options }) =>
      this.load(priority, key, loader, options)
    );

    return Promise.allSettled(promises);
  }

  // Preload resources without waiting - Maximum Conciseness
  preload(priority, key, loaderFn, options = {}) {
    this.load(priority, key, loaderFn, options).catch((error) => {
      console.warn(`⚠️ Preload failed for ${key}:`, error.message);
    });
  }

  // Clear specific resource from cache
  evict(key) {
    console.log(`🗑️ Evicting ${key} from cache`);
    this.loaded.delete(key);
    this.errors.delete(key);
  }

  // Clear all cached resources
  clear() {
    console.log('🧹 Clearing all cached resources');
    this.loaded.clear();
    this.errors.clear();
    // Note: We don't clear queues or loading as they might be in progress
  }

  // Get loading statistics - Economy of Expression
  getStats() {
    const stats = {
      loaded: this.loaded.size,
      loading: this.loading.size,
      errors: this.errors.size,
      queues: {},
    };

    // Count items per priority
    for (const [priority, queue] of this.queues) {
      stats.queues[PriorityNames[priority]] = queue.size;
    }

    return stats;
  }

  // Check if resource is loaded
  isLoaded(key) {
    return this.loaded.has(key);
  }

  // Check if resource is loading
  isLoading(key) {
    return this.loading.has(key);
  }

  // Get error for resource
  getError(key) {
    return this.errors.get(key);
  }

  // Development helpers
  debug() {
    console.group('🔍 Priority Loader Debug');
    console.log('Stats:', this.getStats());
    console.log('Loaded resources:', Array.from(this.loaded.keys()));
    console.log('Loading resources:', Array.from(this.loading.keys()));
    console.log('Failed resources:', Array.from(this.errors.keys()));
    console.groupEnd();
  }
}

// Create singleton instance
export const priorityLoader = new PriorityLoader();

// Development helpers
if (import.meta.env.DEV) {
  window.priorityLoader = priorityLoader;
  window.LoadPriority = LoadPriority;

  // Test helper
  window.testPriorityLoader = async () => {
    console.log('🧪 Testing Priority Loader...');

    // Simulate loading resources with different priorities
    const testLoads = [
      {
        priority: LoadPriority.CRITICAL,
        key: 'theme',
        loader: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve('Theme loaded'), 100)
          ),
      },
      {
        priority: LoadPriority.HIGH,
        key: 'header',
        loader: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve('Header loaded'), 200)
          ),
      },
      {
        priority: LoadPriority.NORMAL,
        key: 'content',
        loader: () =>
          new Promise((resolve) =>
            setTimeout(() => resolve('Content loaded'), 300)
          ),
      },
    ];

    // Load all
    console.log('Loading all test resources...');
    await priorityLoader.loadMany(testLoads);

    // Show stats
    priorityLoader.debug();

    console.log('✅ Test complete');
  };

  console.log('🔧 Priority Loader development helpers:');
  console.log('  - window.priorityLoader - Loader instance');
  console.log('  - window.LoadPriority - Priority constants');
  console.log('  - window.priorityLoader.debug() - Show current state');
  console.log('  - window.testPriorityLoader() - Run test');
}

console.log('✅ Priority Loader ready');
