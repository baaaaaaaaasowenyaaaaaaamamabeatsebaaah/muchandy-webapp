// src/utils/serviceCoordinator.js - Service dependency management and coordination
import { priorityLoader, LoadPriority } from './priorityLoader.js';
import { appState } from './stateStore.js';

console.log('=== SERVICE COORDINATOR LOADING ===');

class ServiceCoordinator {
  constructor() {
    this.services = new Map(); // name -> { service, priority, factory }
    this.dependencies = new Map(); // name -> [dependencies]
    this.instances = new Map(); // name -> service instance
    this.loadOrder = []; // Computed load order
    console.log('✅ ServiceCoordinator initialized');
  }

  // Register a service with dependencies - KISS principle
  register(name, config) {
    const {
      factory, // Function that creates/returns the service
      dependencies = [], // Array of service names this depends on
      priority = LoadPriority.NORMAL,
      singleton = true, // Whether to cache the instance
    } = config;

    console.log(`📝 Registering service: ${name}`, {
      dependencies,
      priority: Object.keys(LoadPriority).find(
        (k) => LoadPriority[k] === priority
      ),
    });

    this.services.set(name, { factory, priority, singleton });
    this.dependencies.set(name, dependencies);

    // Invalidate load order cache
    this.loadOrder = [];
  }

  // Compute topological load order - Algorithmic Elegance
  computeLoadOrder() {
    if (this.loadOrder.length > 0) return this.loadOrder;

    console.log('🔄 Computing service load order...');

    const visited = new Set();
    const temp = new Set();
    const order = [];

    // DFS for topological sort
    const visit = (name) => {
      if (temp.has(name)) {
        throw new Error(`Circular dependency detected: ${name}`);
      }
      if (visited.has(name)) return;

      temp.add(name);

      // Visit dependencies first
      const deps = this.dependencies.get(name) || [];
      for (const dep of deps) {
        if (!this.services.has(dep)) {
          throw new Error(`Unknown dependency: ${dep} required by ${name}`);
        }
        visit(dep);
      }

      temp.delete(name);
      visited.add(name);
      order.push(name);
    };

    // Visit all services
    for (const name of this.services.keys()) {
      visit(name);
    }

    this.loadOrder = order;
    console.log('✅ Load order computed:', order);
    return order;
  }

  // Load a single service with its dependencies - Economy of Expression
  async load(name) {
    // Check if already loaded
    if (this.instances.has(name)) {
      console.log(`✅ Service already loaded: ${name}`);
      return this.instances.get(name);
    }

    const config = this.services.get(name);
    if (!config) {
      throw new Error(`Service not registered: ${name}`);
    }

    console.log(`🔄 Loading service: ${name}`);

    // Load dependencies first
    const deps = this.dependencies.get(name) || [];
    if (deps.length > 0) {
      console.log(`  Loading dependencies for ${name}:`, deps);
      await Promise.all(deps.map((dep) => this.load(dep)));
    }

    // Load the service using priority loader
    const instance = await priorityLoader.load(
      config.priority,
      `service:${name}`,
      async () => {
        console.log(`  Creating ${name} instance...`);

        // Update state to indicate loading
        appState.set(`services.${name}.loading`, true);

        try {
          // Create service instance
          const service = await config.factory();

          // Initialize if it has a load method
          if (typeof service.load === 'function') {
            console.log(`  Initializing ${name}...`);
            await service.load();
          }

          // Update state
          appState.set(`services.${name}.instance`, service);
          appState.set(`services.${name}.ready`, true);
          appState.set(`services.${name}.loading`, false);

          return service;
        } catch (error) {
          appState.set(`services.${name}.error`, error.message);
          appState.set(`services.${name}.loading`, false);
          throw error;
        }
      },
      { cache: config.singleton }
    );

    // Cache instance if singleton
    if (config.singleton) {
      this.instances.set(name, instance);
    }

    console.log(`✅ Service loaded: ${name}`);
    return instance;
  }

  // Load all registered services in dependency order - Maximum Conciseness
  async loadAll() {
    console.log('🚀 Loading all services...');

    const order = this.computeLoadOrder();
    const results = {};

    // Group by priority for parallel loading
    const byPriority = new Map();
    for (const name of order) {
      const config = this.services.get(name);
      const priority = config.priority;

      if (!byPriority.has(priority)) {
        byPriority.set(priority, []);
      }
      byPriority.get(priority).push(name);
    }

    // Load in priority order
    const priorities = Array.from(byPriority.keys()).sort((a, b) => a - b);

    for (const priority of priorities) {
      const names = byPriority.get(priority);
      console.log(`Loading priority ${priority} services:`, names);

      // Load services at same priority in parallel
      const promises = names.map(async (name) => {
        try {
          results[name] = await this.load(name);
        } catch (error) {
          console.error(`Failed to load service ${name}:`, error);
          results[name] = { error };
        }
      });

      await Promise.all(promises);
    }

    console.log('✅ All services loaded');
    return results;
  }

  // Get a loaded service instance - KISS approach
  get(name) {
    const instance = this.instances.get(name);
    if (!instance) {
      throw new Error(`Service not loaded: ${name}`);
    }
    return instance;
  }

  // Check if service is loaded
  isLoaded(name) {
    return this.instances.has(name);
  }

  // Wait for a service to be ready - Algorithmic Elegance
  async waitFor(name, timeout = 10000) {
    // Check if already loaded
    if (this.isLoaded(name)) {
      return this.get(name);
    }

    // Wait for state to indicate ready
    console.log(`⏳ Waiting for service: ${name}`);
    await appState.waitFor(`services.${name}.ready`, timeout);

    return this.get(name);
  }

  // Reload a service - Economy of Expression
  async reload(name) {
    console.log(`🔄 Reloading service: ${name}`);

    // Clear from caches
    this.instances.delete(name);
    priorityLoader.evict(`service:${name}`);

    // Clear state
    appState.delete(`services.${name}`);

    // Reload
    return this.load(name);
  }

  // Get service loading statistics
  getStats() {
    const stats = {
      registered: this.services.size,
      loaded: this.instances.size,
      failed: 0,
      loading: 0,
      services: {},
    };

    for (const [name, config] of this.services) {
      const state = appState.get(`services.${name}`) || {};
      const status = state.ready
        ? 'ready'
        : state.loading
          ? 'loading'
          : state.error
            ? 'failed'
            : 'not started';

      stats.services[name] = {
        status,
        priority: config.priority,
        dependencies: this.dependencies.get(name) || [],
        error: state.error,
      };

      if (status === 'failed') stats.failed++;
      if (status === 'loading') stats.loading++;
    }

    return stats;
  }

  // Clear all services
  clear() {
    console.log('🧹 Clearing all services');

    // Clear instances
    for (const [name, instance] of this.instances) {
      // Call destroy if available
      if (typeof instance.destroy === 'function') {
        try {
          instance.destroy();
        } catch (error) {
          console.error(`Error destroying service ${name}:`, error);
        }
      }
    }

    this.instances.clear();
    this.services.clear();
    this.dependencies.clear();
    this.loadOrder = [];

    // Clear from state
    appState.delete('services');
  }

  // Development helpers
  debug() {
    console.group('🔍 Service Coordinator Debug');
    console.log('Stats:', this.getStats());
    console.log('Load order:', this.computeLoadOrder());
    console.log('Dependencies:', Object.fromEntries(this.dependencies));
    console.groupEnd();
  }
}

// Create singleton instance
export const serviceCoordinator = new ServiceCoordinator();

// Development helpers
if (import.meta.env.DEV) {
  window.serviceCoordinator = serviceCoordinator;

  // Test helper
  window.testServiceCoordinator = async () => {
    console.log('🧪 Testing Service Coordinator...');

    // Register test services
    serviceCoordinator.register('database', {
      factory: () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ name: 'DB', connect: () => {} }), 100)
        ),
      priority: LoadPriority.CRITICAL,
    });

    serviceCoordinator.register('api', {
      factory: () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ name: 'API', fetch: () => {} }), 200)
        ),
      dependencies: ['database'],
      priority: LoadPriority.HIGH,
    });

    serviceCoordinator.register('ui', {
      factory: () =>
        new Promise((resolve) =>
          setTimeout(() => resolve({ name: 'UI', render: () => {} }), 150)
        ),
      dependencies: ['api'],
      priority: LoadPriority.NORMAL,
    });

    // Load all
    console.log('Loading all test services...');
    const results = await serviceCoordinator.loadAll();
    console.log('Results:', results);

    // Show debug info
    serviceCoordinator.debug();

    // Clean up
    serviceCoordinator.clear();
    console.log('✅ Test complete');
  };

  console.log('🔧 Service Coordinator development helpers:');
  console.log('  - window.serviceCoordinator - Coordinator instance');
  console.log('  - window.serviceCoordinator.debug() - Show current state');
  console.log('  - window.testServiceCoordinator() - Run test');
}

console.log('✅ Service Coordinator ready');
