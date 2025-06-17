// src/services/apiService.js
/**
 * @file Enhanced API Service with state management integration
 * @description Handles all API communication with retry, caching, and fallback strategies
 */

import { appState } from '../utils/stateStore.js';
import { RetryManager } from '../utils/retryManager.js';
import { safeStorage } from '../utils/storage.js';

console.log('=== ENHANCED API SERVICE LOADING ===');

/**
 * Enhanced API Service with state integration
 */
class ApiService {
  constructor() {
    // Use environment variable or current origin
    this.baseUrl = import.meta.env?.VITE_API_URL || window.location.origin;
    console.log(
      `🔧 Enhanced ApiService initialized with baseUrl: ${this.baseUrl}`
    );

    this.retry = new RetryManager({
      maxRetries: 3,
      baseDelay: 500,
      maxDelay: 5000,
    });

    // Cache expiry time (30 minutes)
    this.cacheExpiry = 30 * 60 * 1000;

    // Cache prefix
    this.cachePrefix = 'api_cache_';
  }

  /**
   * Health check for API availability
   */
  async healthCheck() {
    try {
      const response = await this.get('/health', { skipRetry: true });
      appState.set('api.health', {
        status: 'healthy',
        timestamp: Date.now(),
        ...response,
      });
      return response;
    } catch (error) {
      appState.set('api.health', {
        status: 'unhealthy',
        error: error.message,
        timestamp: Date.now(),
      });
      return null;
    }
  }

  /**
   * Load critical data on service initialization
   */
  async load() {
    console.log('🚀 Loading API service with critical data...');
    appState.set('services.api.loading', true);

    try {
      // Run health check first
      await this.healthCheck();

      // Load critical data in parallel
      await Promise.all([this.fetchManufacturers(), this.fetchActions()]);

      appState.set('services.api.ready', true);
      appState.set('services.api.loading', false);
      console.log('✅ API service loaded with critical data');
    } catch (error) {
      console.error('❌ API service load error:', error);
      appState.set('services.api.error', error.message);
      appState.set('services.api.ready', true); // Still mark as ready with fallback data
      appState.set('services.api.loading', false);
    }
  }

  /**
   * Make a GET request with retry logic
   */
  async get(endpoint, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`🌐 API GET: ${url}`);

    const makeRequest = async () => {
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    };

    try {
      if (options.skipRetry) {
        return await makeRequest();
      } else {
        return await this.retry.retry(makeRequest);
      }
    } catch (error) {
      console.error(`❌ API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Make a POST request
   */
  async post(endpoint, data, options = {}) {
    const url = `${this.baseUrl}${endpoint}`;
    console.log(`🌐 API POST: ${url}`, data);

    const makeRequest = async () => {
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      return response.json();
    };

    try {
      return await this.retry.retry(makeRequest);
    } catch (error) {
      console.error(`❌ API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  /**
   * Get data from cache
   */
  getFromCache(key) {
    try {
      const cached = safeStorage.get(`${this.cachePrefix}${key}`);
      if (!cached) return null;

      const { data, timestamp } = cached;
      const age = Date.now() - timestamp;

      if (age > this.cacheExpiry) {
        console.log(
          `🗑️ Cache expired for ${key} (${Math.round(age / 1000 / 60)}min old)`
        );
        safeStorage.remove(`${this.cachePrefix}${key}`);
        return null;
      }

      console.log(`📦 Using cached ${key} (${Math.round(age / 1000)}s old)`);
      return data;
    } catch (error) {
      console.error(`❌ Cache read error for ${key}:`, error);
      return null;
    }
  }

  /**
   * Save data to cache
   */
  saveToCache(key, data) {
    try {
      const success = safeStorage.set(`${this.cachePrefix}${key}`, {
        data,
        timestamp: Date.now(),
      });

      if (success) {
        console.log(`💾 Cached ${key}`);
      } else {
        console.warn(`⚠️ Failed to cache ${key}`);
      }
    } catch (error) {
      console.error(`❌ Cache write error for ${key}:`, error);
    }
  }

  /**
   * Clear all API caches
   */
  clearCache() {
    const keys = safeStorage.getKeys(this.cachePrefix);
    keys.forEach((key) => safeStorage.remove(key));
    console.log(`🗑️ Cleared ${keys.length} cached items`);
  }

  /**
   * Fetch manufacturers with caching
   */
  async fetchManufacturers() {
    console.log('🏭 Fetching manufacturers...');

    // Check state first
    const stateData = appState.get('api.manufacturers');
    if (stateData?.length > 0) {
      console.log(`✅ Manufacturers from state: ${stateData.length}`);
      return stateData;
    }

    // Check cache
    const cached = this.getFromCache('manufacturers');
    if (cached) {
      appState.set('api.manufacturers', cached);
      return cached;
    }

    try {
      const data = await this.get('/api/manufacturers');
      const transformed = this.transformManufacturers(data);

      // Save to cache and state
      this.saveToCache('manufacturers', transformed);
      appState.set('api.manufacturers', transformed);

      return transformed;
    } catch (error) {
      console.error('❌ Failed to fetch manufacturers:', error);

      // Try cache again (even if expired)
      const expiredCache = safeStorage.get(`${this.cachePrefix}manufacturers`);
      if (expiredCache) {
        const { data } = expiredCache;
        console.log('📦 Using expired cache for manufacturers');
        appState.set('api.manufacturers', data);
        appState.set('api.errors.manufacturers', error.message);
        return data;
      }

      // Final fallback
      const fallback = this.getFallbackManufacturers();
      appState.set('api.manufacturers', fallback);
      appState.set('api.errors.manufacturers', error.message);
      return fallback;
    }
  }

  /**
   * Transform manufacturer data
   */
  transformManufacturers(data) {
    if (!Array.isArray(data)) {
      console.warn('⚠️ Invalid manufacturers data:', data);
      return [];
    }

    return data.map((item) => ({
      id: String(item.id || item._id),
      name: item.name || 'Unknown',
      displayName: item.displayName || item.name || 'Unknown',
    }));
  }

  /**
   * Get fallback manufacturers
   */
  getFallbackManufacturers() {
    console.log('📦 Using fallback manufacturers');
    return [
      { id: '1', name: 'Apple', displayName: 'Apple' },
      { id: '2', name: 'Samsung', displayName: 'Samsung' },
      { id: '3', name: 'Google', displayName: 'Google' },
      { id: '4', name: 'OnePlus', displayName: 'OnePlus' },
      { id: '5', name: 'Xiaomi', displayName: 'Xiaomi' },
    ];
  }

  /**
   * Fetch devices by manufacturer with caching
   */
  async fetchDevices(manufacturerId) {
    if (!manufacturerId) {
      console.warn('⚠️ No manufacturer ID provided');
      return [];
    }

    const cacheKey = `devices_${manufacturerId}`;
    console.log(`📱 Fetching devices for manufacturer ${manufacturerId}...`);

    // Check state
    const stateKey = `api.devices.${manufacturerId}`;
    const stateData = appState.get(stateKey);
    if (stateData?.length > 0) {
      console.log(`✅ Devices from state: ${stateData.length}`);
      return stateData;
    }

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      appState.set(stateKey, cached);
      return cached;
    }

    try {
      const data = await this.get(
        `/api/devices?manufacturerId=${manufacturerId}`
      );
      const transformed = this.transformDevices(data);

      // Save to cache and state
      this.saveToCache(cacheKey, transformed);
      appState.set(stateKey, transformed);

      return transformed;
    } catch (error) {
      console.error('❌ Failed to fetch devices:', error);

      // Try expired cache
      const expiredCache = safeStorage.get(`${this.cachePrefix}${cacheKey}`);
      if (expiredCache) {
        const { data } = expiredCache;
        console.log('📦 Using expired cache for devices');
        appState.set(stateKey, data);
        return data;
      }

      // Fallback
      const fallback = this.getFallbackDevices(manufacturerId);
      appState.set(stateKey, fallback);
      return fallback;
    }
  }

  /**
   * Transform device data
   */
  transformDevices(data) {
    if (!Array.isArray(data)) {
      console.warn('⚠️ Invalid devices data:', data);
      return [];
    }

    return data.map((item) => ({
      id: String(item.id || item._id),
      name: item.name || 'Unknown',
      model: item.model || item.name || 'Unknown',
      manufacturerId: String(item.manufacturerId || item.manufacturer_id),
      // Add manufacturer name if included
      manufacturerName: item.manufacturer?.name || '',
    }));
  }

  /**
   * Get fallback devices
   */
  getFallbackDevices(manufacturerId) {
    console.log('📦 Using fallback devices');
    const devicesByManufacturer = {
      1: [
        // Apple
        {
          id: '11',
          name: 'iPhone 15 Pro Max',
          model: 'iPhone 15 Pro Max',
          manufacturerId: '1',
        },
        {
          id: '12',
          name: 'iPhone 15 Pro',
          model: 'iPhone 15 Pro',
          manufacturerId: '1',
        },
        {
          id: '13',
          name: 'iPhone 15',
          model: 'iPhone 15',
          manufacturerId: '1',
        },
        {
          id: '14',
          name: 'iPhone 14',
          model: 'iPhone 14',
          manufacturerId: '1',
        },
        {
          id: '15',
          name: 'iPhone 13',
          model: 'iPhone 13',
          manufacturerId: '1',
        },
      ],
      2: [
        // Samsung
        {
          id: '21',
          name: 'Galaxy S24 Ultra',
          model: 'Galaxy S24 Ultra',
          manufacturerId: '2',
        },
        {
          id: '22',
          name: 'Galaxy S24+',
          model: 'Galaxy S24+',
          manufacturerId: '2',
        },
        {
          id: '23',
          name: 'Galaxy S24',
          model: 'Galaxy S24',
          manufacturerId: '2',
        },
        {
          id: '24',
          name: 'Galaxy S23',
          model: 'Galaxy S23',
          manufacturerId: '2',
        },
        {
          id: '25',
          name: 'Galaxy A54',
          model: 'Galaxy A54',
          manufacturerId: '2',
        },
      ],
      3: [
        // Google
        {
          id: '31',
          name: 'Pixel 8 Pro',
          model: 'Pixel 8 Pro',
          manufacturerId: '3',
        },
        { id: '32', name: 'Pixel 8', model: 'Pixel 8', manufacturerId: '3' },
        { id: '33', name: 'Pixel 7a', model: 'Pixel 7a', manufacturerId: '3' },
        { id: '34', name: 'Pixel 7', model: 'Pixel 7', manufacturerId: '3' },
      ],
    };

    return devicesByManufacturer[manufacturerId] || [];
  }

  /**
   * Fetch actions by device - NEW METHOD - maps to GET /api/device/{deviceId}/actions
   */
  async fetchActionsByDevice(deviceId) {
    const cacheKey = `actions_device_${deviceId}`;
    console.log(`🔧 Fetching actions for device ${deviceId}...`);

    // Check state
    const stateKey = `api.actions.device.${deviceId}`;
    const stateData = appState.get(stateKey);
    if (stateData?.length > 0) {
      console.log(`✅ Actions from state: ${stateData.length}`);
      return stateData;
    }

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      appState.set(stateKey, cached);
      return cached;
    }

    try {
      const data = await this.get(`/api/device/${deviceId}/actions`);
      const transformed = data.map((action) => ({
        id: String(action.id),
        name: action.name,
        deviceId: String(action.deviceId),
        latestPrice: action.latestPrice,
        priceDate: action.priceDate,
      }));

      // Save to cache and state
      this.saveToCache(cacheKey, transformed);
      appState.set(stateKey, transformed);

      return transformed;
    } catch (error) {
      console.error('❌ Failed to fetch device actions:', error);

      // Try expired cache
      const expiredCache = safeStorage.get(`${this.cachePrefix}${cacheKey}`);
      if (expiredCache) {
        const { data } = expiredCache;
        console.log('📦 Using expired cache for actions');
        appState.set(stateKey, data);
        return data;
      }

      // Fallback
      return this.getFallbackActions();
    }
  }

  /**
   * Fetch price by actionId - NEW METHOD - maps to GET /api/price?actionId={id}
   */
  async fetchPriceByAction(actionId) {
    const cacheKey = `price_action_${actionId}`;
    console.log(`💰 Fetching price for action ${actionId}...`);

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.get(`/api/price?actionId=${actionId}`);
      const price = {
        amount: data.price * 100, // Convert to cents
        currency: data.currency || 'EUR',
        formatted: data.formatted || `${data.price} €`,
        price: data.price,
        actionId: data.actionId,
        actionName: data.actionName,
        deviceId: data.deviceId,
        deviceName: data.deviceName,
        manufacturerId: data.manufacturerId,
        manufacturerName: data.manufacturerName,
      };

      // Cache for 5 minutes
      const oldExpiry = this.cacheExpiry;
      this.cacheExpiry = 5 * 60 * 1000;
      this.saveToCache(cacheKey, price);
      this.cacheExpiry = oldExpiry;

      return price;
    } catch (error) {
      console.error('❌ Failed to fetch action price:', error);

      // Try expired cache
      const expiredCache = safeStorage.get(`${this.cachePrefix}${cacheKey}`);
      if (expiredCache) {
        const { data } = expiredCache;
        console.log('📦 Using expired cache for price');
        return data;
      }

      // Fallback
      return this.getFallbackPrice(null, actionId);
    }
  }

  /**
   * Fetch all prices for a device - NEW METHOD - maps to GET /api/device/{deviceId}/prices
   */
  async fetchDevicePrices(deviceId) {
    const cacheKey = `prices_device_${deviceId}`;
    console.log(`💰 Fetching all prices for device ${deviceId}...`);

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) return cached;

    try {
      const data = await this.get(`/api/device/${deviceId}/prices`);

      // Transform to expected format
      const prices = data.map((item) => ({
        actionId: String(item.actionId),
        actionName: item.actionName,
        prices: item.prices,
      }));

      this.saveToCache(cacheKey, prices);
      return prices;
    } catch (error) {
      console.error('❌ Failed to fetch device prices:', error);
      return [];
    }
  }

  /**
   * Fetch actions (repair types) with caching - KEEPING ORIGINAL METHOD
   */
  async fetchActionsByDevice(deviceId) {
    const cacheKey = deviceId ? `actions_${deviceId}` : 'actions_all';
    console.log(`🔧 Fetching actions for device ${deviceId || 'all'}...`);

    // Check state
    const stateKey = deviceId ? `api.actions.${deviceId}` : 'api.actions';
    const stateData = appState.get(stateKey);
    if (stateData?.length > 0) {
      console.log(`✅ Actions from state: ${stateData.length}`);
      return stateData;
    }

    // Check cache
    const cached = this.getFromCache(cacheKey);
    if (cached) {
      appState.set(stateKey, cached);
      return cached;
    }

    try {
      const endpoint = deviceId
        ? `/api/device/${deviceId}/actions`
        : '/api/actions';

      const data = await this.get(endpoint);
      const transformed = this.transformActions(data);

      // Save to cache and state
      this.saveToCache(cacheKey, transformed);
      appState.set(stateKey, transformed);

      return transformed;
    } catch (error) {
      console.error('❌ Failed to fetch actions:', error);

      // Try expired cache
      const expiredCache = safeStorage.get(`${this.cachePrefix}${cacheKey}`);
      if (expiredCache) {
        const { data } = expiredCache;
        console.log('📦 Using expired cache for actions');
        appState.set(stateKey, data);
        appState.set('api.errors.actions', error.message);
        return data;
      }

      // Fallback
      const fallback = this.getFallbackActions();
      appState.set(stateKey, fallback);
      appState.set('api.errors.actions', error.message);
      return fallback;
    }
  }

  /**
   * Transform actions data
   */
  transformActions(data) {
    if (!Array.isArray(data)) {
      console.warn('⚠️ Invalid actions data:', data);
      return [];
    }

    return data.map((item) => ({
      id: String(item.id || item._id),
      name: item.name || 'Unknown',
      description: item.description || '',
      category: item.category || 'repair',
      deviceId: String(item.deviceId || item.device_id),
      latestPrice: item.latestPrice || null,
      priceDate: item.priceDate || null,
    }));
  }

  /**
   * Get fallback actions
   */
  getFallbackActions() {
    console.log('📦 Using fallback actions');
    return [
      {
        id: '1',
        name: 'Displayreparatur',
        description: 'Display/Touchscreen Reparatur',
        category: 'display',
      },
      {
        id: '2',
        name: 'Akkutausch',
        description: 'Batterie Austausch',
        category: 'battery',
      },
      {
        id: '3',
        name: 'Kamerareparatur',
        description: 'Front- oder Rückkamera Reparatur',
        category: 'camera',
      },
      {
        id: '4',
        name: 'Ladebuchse',
        description: 'Ladeanschluss Reparatur',
        category: 'charging',
      },
    ];
  }

  /**
   * Fetch price for repair - DEPRECATED - use fetchPriceByAction instead
   */
  async fetchPrice(deviceId, actionId) {
    console.warn('⚠️ fetchPrice is deprecated, use fetchPriceByAction instead');

    // If only one parameter, assume it's actionId
    if (arguments.length === 1) {
      return this.fetchPriceByAction(deviceId);
    }

    // Otherwise use the new method
    return this.fetchPriceByAction(actionId);
  }

  /**
   * Format price
   */
  formatPrice(amount) {
    return new Intl.NumberFormat('de-DE', {
      style: 'currency',
      currency: 'EUR',
    }).format(amount);
  }

  /**
   * Get fallback price
   */
  getFallbackPrice(deviceId, actionId) {
    console.log('📦 Using fallback price');
    // Simple price matrix
    const basePrice = {
      1: 79, // Display
      2: 59, // Battery
      3: 69, // Camera
      4: 49, // Charging port
    };

    const amount = basePrice[actionId] || 99;
    return {
      amount: amount * 100, // Convert to cents
      currency: 'EUR',
      formatted: this.formatPrice(amount),
      price: amount,
    };
  }

  /**
   * Fetch conditions with caching
   */
  async fetchConditions() {
    console.log('📋 Fetching conditions...');

    // Check state
    const stateData = appState.get('api.conditions');
    if (stateData?.length > 0) {
      console.log(`✅ Conditions from state: ${stateData.length}`);
      return stateData;
    }

    // Check cache
    const cached = this.getFromCache('conditions');
    if (cached) {
      appState.set('api.conditions', cached);
      return cached;
    }

    try {
      const data = await this.get('/api/conditions');
      const transformed = this.transformConditions(data);

      // Save to cache and state
      this.saveToCache('conditions', transformed);
      appState.set('api.conditions', transformed);

      return transformed;
    } catch (error) {
      console.error('❌ Failed to fetch conditions:', error);

      // Try expired cache
      const expiredCache = safeStorage.get(`${this.cachePrefix}conditions`);
      if (expiredCache) {
        const { data } = expiredCache;
        console.log('📦 Using expired cache for conditions');
        appState.set('api.conditions', data);
        return data;
      }

      // Fallback
      const fallback = this.getFallbackConditions();
      appState.set('api.conditions', fallback);
      return fallback;
    }
  }

  /**
   * Transform conditions data
   */
  transformConditions(data) {
    if (!Array.isArray(data)) {
      console.warn('⚠️ Invalid conditions data:', data);
      return [];
    }

    return data.map((item) => ({
      id: String(item.id || item._id),
      name: item.name || 'Unknown',
      description: item.description || '',
      value: item.value || item.name,
    }));
  }

  /**
   * Get fallback conditions
   */
  getFallbackConditions() {
    console.log('📦 Using fallback conditions');
    return [
      {
        id: '1',
        name: 'Wie neu',
        description: 'Gerät sieht aus wie neu',
        value: 'like-new',
      },
      {
        id: '2',
        name: 'Sehr gut',
        description: 'Minimale Gebrauchsspuren',
        value: 'very-good',
      },
      {
        id: '3',
        name: 'Gut',
        description: 'Normale Gebrauchsspuren',
        value: 'good',
      },
      {
        id: '4',
        name: 'Akzeptabel',
        description: 'Deutliche Gebrauchsspuren',
        value: 'acceptable',
      },
      {
        id: '5',
        name: 'Defekt',
        description: 'Gerät ist beschädigt',
        value: 'defective',
      },
    ];
  }

  /**
   * Convenience method to fetch all actions
   */
  async fetchActions() {
    return this.fetchActionsByDevice();
  }
}

// Create singleton instance
const apiService = new ApiService();

// Export for testing
if (typeof window !== 'undefined') {
  window.ApiService = ApiService;
  window.apiService = apiService;
  console.log('🔧 ApiService available at window.apiService for testing');
}

export { ApiService, apiService };
console.log('✅ Enhanced API Service ready with state integration');
