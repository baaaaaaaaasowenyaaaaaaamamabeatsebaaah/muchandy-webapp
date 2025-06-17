// src/utils/stateStore.js - Centralized state management with reactive updates
console.log('=== STATE STORE LOADING ===');

class StateStore {
  constructor() {
    this.state = {};
    this.listeners = new Map();
    this.pendingUpdates = new Map();
    console.log('✅ StateStore initialized');
  }

  // Subscribe to state changes - KISS principle
  subscribe(path, callback) {
    if (!this.listeners.has(path)) {
      this.listeners.set(path, new Set());
    }
    this.listeners.get(path).add(callback);

    // Return unsubscribe function - Economy of Expression
    return () => this.listeners.get(path)?.delete(callback);
  }

  // Get state with path support (e.g., 'api.manufacturers') - Algorithmic Elegance
  get(path) {
    if (!path) return this.state;
    return path.split('.').reduce((obj, key) => obj?.[key], this.state);
  }

  // Set state with automatic notification - Maximum Conciseness
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();

    // Navigate to parent object, creating path if needed
    let target = this.state;
    for (const key of keys) {
      if (!target[key]) target[key] = {};
      target = target[key];
    }

    // Set value
    const oldValue = target[lastKey];
    target[lastKey] = value;

    console.log(`📝 State updated: ${path} =`, value);

    // Notify listeners
    this.notify(path, value, oldValue);
  }

  // Notify all listeners for a path - Economy of Expression
  notify(path, value, oldValue) {
    // Notify exact path listeners
    this.listeners.get(path)?.forEach((cb) => {
      try {
        cb(value, oldValue);
      } catch (error) {
        console.error(`Error in state listener for ${path}:`, error);
      }
    });

    // Notify parent path listeners (e.g., 'api' when 'api.manufacturers' changes)
    const parts = path.split('.');
    while (parts.length > 1) {
      parts.pop();
      const parentPath = parts.join('.');
      this.listeners.get(parentPath)?.forEach((cb) => {
        try {
          cb(this.get(parentPath));
        } catch (error) {
          console.error(`Error in parent listener for ${parentPath}:`, error);
        }
      });
    }

    // Notify wildcard listeners
    this.listeners.get('*')?.forEach((cb) => {
      try {
        cb({ path, value, oldValue });
      } catch (error) {
        console.error('Error in wildcard listener:', error);
      }
    });
  }

  // Batch updates to prevent multiple renders - KISS approach
  async batchUpdate(updates) {
    console.log('🔄 Batching state updates:', Object.keys(updates));

    // Collect updates
    for (const [path, value] of Object.entries(updates)) {
      this.pendingUpdates.set(path, value);
    }

    // Process all updates in next tick
    await Promise.resolve();

    const updatedPaths = [];
    for (const [path, value] of this.pendingUpdates) {
      this.set(path, value);
      updatedPaths.push(path);
    }

    this.pendingUpdates.clear();
    console.log('✅ Batch update complete:', updatedPaths);
  }

  // Wait for a state value - Algorithmic Elegance
  waitFor(path, timeout = 10000) {
    return new Promise((resolve, reject) => {
      // Check if already exists
      const value = this.get(path);
      if (value !== undefined && value !== null) {
        resolve(value);
        return;
      }

      // Set up timeout
      const timeoutId = setTimeout(() => {
        cleanup();
        reject(new Error(`Timeout waiting for state: ${path}`));
      }, timeout);

      // Subscribe and wait
      const cleanup = this.subscribe(path, (value) => {
        if (value !== undefined && value !== null) {
          clearTimeout(timeoutId);
          cleanup();
          resolve(value);
        }
      });
    });
  }

  // Computed state values - Fixed to use callback for updates
  computed(dependencies, computeFn, onChange) {
    const values = {};
    const listeners = [];
    let cachedResult = null;

    const compute = () => {
      dependencies.forEach((path) => {
        values[path] = this.get(path);
      });
      const newResult = computeFn(values);

      // Only notify if result changed and onChange callback provided
      if (onChange && newResult !== cachedResult) {
        onChange(newResult, cachedResult);
      }

      cachedResult = newResult;
      return newResult;
    };

    // Initial computation
    cachedResult = compute();

    // Subscribe to all dependencies
    dependencies.forEach((path) => {
      listeners.push(this.subscribe(path, () => compute()));
    });

    return {
      get: () => cachedResult,
      compute, // Force recomputation
      destroy: () => listeners.forEach((unsub) => unsub()),
    };
  }

  // Delete a state path - KISS principle
  delete(path) {
    const keys = path.split('.');
    const lastKey = keys.pop();

    let target = this.state;
    for (const key of keys) {
      if (!target[key]) return;
      target = target[key];
    }

    const oldValue = target[lastKey];
    delete target[lastKey];

    console.log(`🗑️ State deleted: ${path}`);
    this.notify(path, undefined, oldValue);
  }

  // Check if state exists
  has(path) {
    return this.get(path) !== undefined;
  }

  // Clear all state - Maximum Conciseness
  clear() {
    console.log('🧹 Clearing all state');
    const oldState = { ...this.state };
    this.state = {};

    // Notify all paths that were cleared
    const notifyPath = (obj, basePath = '') => {
      Object.keys(obj).forEach((key) => {
        const path = basePath ? `${basePath}.${key}` : key;
        this.notify(path, undefined, obj[key]);

        if (typeof obj[key] === 'object' && obj[key] !== null) {
          notifyPath(obj[key], path);
        }
      });
    };

    notifyPath(oldState);
  }

  // Get current state snapshot for debugging
  getSnapshot() {
    return JSON.parse(JSON.stringify(this.state));
  }

  // Development helpers
  debug() {
    console.group('🔍 State Store Debug');
    console.log('Current state:', this.getSnapshot());
    console.log('Active listeners:', {
      count: this.listeners.size,
      paths: Array.from(this.listeners.keys()),
    });
    console.log('Pending updates:', this.pendingUpdates.size);
    console.groupEnd();
  }
}

// Create singleton instance
export const appState = new StateStore();

// Development helpers
if (import.meta.env.DEV) {
  window.appState = appState;

  // Debug helper to watch state changes
  window.watchState = (path = '*') => {
    return appState.subscribe(path, (value, oldValue) => {
      console.log(`📊 State change [${path}]:`, { oldValue, newValue: value });
    });
  };

  console.log('🔧 State Store development helpers:');
  console.log('  - window.appState - State store instance');
  console.log('  - window.appState.debug() - Show current state');
  console.log('  - window.watchState(path) - Watch state changes');
}

console.log('✅ State Store ready');
