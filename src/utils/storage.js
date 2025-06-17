// src/utils/storage.js
/**
 * @file Safe storage utility with environment checks
 * @description Provides safe access to localStorage with fallback
 */

/**
 * Check if localStorage is available
 */
const isStorageAvailable = () => {
  try {
    const test = '__storage_test__';
    if (typeof window === 'undefined' || !window.localStorage) {
      return false;
    }
    window.localStorage.setItem(test, test);
    window.localStorage.removeItem(test);
    return true;
  } catch (e) {
    return false;
  }
};

/**
 * In-memory storage fallback
 */
class MemoryStorage {
  constructor() {
    this.data = new Map();
  }

  getItem(key) {
    return this.data.get(key) || null;
  }

  setItem(key, value) {
    this.data.set(key, String(value));
  }

  removeItem(key) {
    this.data.delete(key);
  }

  clear() {
    this.data.clear();
  }

  key(index) {
    return Array.from(this.data.keys())[index];
  }

  get length() {
    return this.data.size;
  }
}

/**
 * Safe storage instance
 */
const storage = isStorageAvailable()
  ? window.localStorage
  : new MemoryStorage();

/**
 * Safe storage wrapper with JSON support
 */
export const safeStorage = {
  /**
   * Get item from storage
   */
  get(key) {
    try {
      const item = storage.getItem(key);
      return item ? JSON.parse(item) : null;
    } catch (error) {
      console.warn(`Storage get error for ${key}:`, error);
      return null;
    }
  },

  /**
   * Set item in storage
   */
  set(key, value) {
    try {
      storage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn(`Storage set error for ${key}:`, error);
      return false;
    }
  },

  /**
   * Remove item from storage
   */
  remove(key) {
    try {
      storage.removeItem(key);
      return true;
    } catch (error) {
      console.warn(`Storage remove error for ${key}:`, error);
      return false;
    }
  },

  /**
   * Clear all items
   */
  clear() {
    try {
      storage.clear();
      return true;
    } catch (error) {
      console.warn('Storage clear error:', error);
      return false;
    }
  },

  /**
   * Get all keys matching a pattern
   */
  getKeys(pattern) {
    const keys = [];
    try {
      for (let i = 0; i < storage.length; i++) {
        const key = storage.key(i);
        if (key && (!pattern || key.includes(pattern))) {
          keys.push(key);
        }
      }
    } catch (error) {
      console.warn('Storage getKeys error:', error);
    }
    return keys;
  },

  /**
   * Check if storage is available
   */
  isAvailable() {
    return isStorageAvailable();
  },
};

// Export for development
if (typeof window !== 'undefined') {
  window.safeStorage = safeStorage;
}

console.log(
  `💾 Storage initialized: ${safeStorage.isAvailable() ? 'localStorage' : 'memory'}`
);
