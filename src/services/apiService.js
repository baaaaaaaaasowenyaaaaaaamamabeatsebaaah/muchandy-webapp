// src/services/apiService.js - Enhanced with state management and retry logic
import { appState } from '../utils/stateStore.js';

console.log('=== ENHANCED API SERVICE LOADING ===');

// Retry manager for intelligent retries - KISS principle
class RetryManager {
  constructor(options = {}) {
    this.maxRetries = options.maxRetries || 3;
    this.baseDelay = options.baseDelay || 1000;
    this.maxDelay = options.maxDelay || 10000;
    this.backoffFactor = options.backoffFactor || 2;
  }

  async retry(fn, _context = {}) {
    let lastError;

    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      try {
        return await fn();
      } catch (error) {
        lastError = error;

        if (attempt < this.maxRetries) {
          const delay = Math.min(
            this.baseDelay * Math.pow(this.backoffFactor, attempt),
            this.maxDelay
          );

          console.warn(
            `🔁 Retry ${attempt + 1}/${this.maxRetries} after ${delay}ms:`,
            error.message
          );
          await new Promise((resolve) => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError;
  }
}

// Enhanced API Service with state integration - Economy of Expression
export default class ApiService {
  constructor() {
    this.baseUrl = window.location.origin;
    this.retry = new RetryManager({
      maxRetries: 3,
      baseDelay: 500,
      backoffFactor: 2,
    });

    console.log(
      '🔧 Enhanced ApiService initialized with baseUrl:',
      this.baseUrl
    );
  }

  // Initialize service and preload critical data - Algorithmic Elegance
  async load() {
    console.log('🚀 Loading API service with critical data...');

    try {
      // Mark service as loading
      appState.set('services.api.loading', true);

      // Preload critical data in parallel
      const [manufacturers, actions] = await Promise.all([
        this.fetchManufacturers(),
        this.fetchActions(),
      ]);

      // Mark service as ready
      appState.set('services.api.ready', true);
      appState.set('services.api.loading', false);

      console.log('✅ API service loaded with critical data');
      return { manufacturers, actions };
    } catch (error) {
      appState.set('services.api.error', error.message);
      appState.set('services.api.loading', false);
      throw error;
    }
  }

  // Enhanced fetch with retry and state integration - Maximum Conciseness
  async get(endpoint) {
    const fullUrl = `${this.baseUrl}${endpoint}`;
    console.log(`🌐 API GET: ${fullUrl}`);

    // Check state cache first
    const cacheKey = `api.cache.${endpoint.replace(/[/?&=]/g, '_')}`;
    const cached = appState.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < 5 * 60 * 1000) {
      // 5 min cache
      console.log(`📦 State cache hit for: ${endpoint}`);
      return cached.data;
    }

    // Fetch with retry
    try {
      const data = await this.retry.retry(async () => {
        const response = await fetch(fullUrl);

        if (!response.ok) {
          throw new Error(
            `API Error: ${response.status} ${response.statusText}`
          );
        }

        return response.json();
      });

      // Cache in state
      appState.set(cacheKey, {
        data,
        timestamp: Date.now(),
        endpoint,
      });

      console.log(`✅ API data received and cached for ${endpoint}`);
      return data;
    } catch (error) {
      console.error(`❌ API Error for ${endpoint}:`, error);

      // Try to return stale cache if available
      if (cached) {
        console.warn('⚠️ Returning stale cache due to error');
        return cached.data;
      }

      throw error;
    }
  }

  // Data transformation helpers remain the same
  transformManufacturers(data) {
    if (!Array.isArray(data)) return [];
    return data.map((m) => ({
      id: String(m.id),
      name: m.name,
    }));
  }

  transformDevices(data) {
    if (!Array.isArray(data)) return [];
    return data.map((d) => ({
      id: String(d.id),
      name: d.name,
      manufacturerId: String(d.manufacturerId),
    }));
  }

  transformActions(data) {
    if (!Array.isArray(data)) return [];
    return data.map((a) => ({
      id: String(a.id),
      name: a.name,
      basePrice: a.basePrice,
    }));
  }

  transformPrice(data) {
    if (!data) return null;
    return {
      price: data.price,
      currency: data.currency || '€',
      formatted: data.formatted || `${data.price} €`,
      message: data.message,
      actionId: data.actionId,
      deviceId: data.deviceId,
      dateCollected: data.dateCollected || new Date().toISOString(),
      estimatedTime: data.estimatedTime,
    };
  }

  // === REPAIR SERVICE METHODS with State Integration ===

  async fetchManufacturers() {
    console.log('🏭 Fetching manufacturers...');

    // Check state first
    const cached = appState.get('api.manufacturers');
    if (cached) {
      console.log('✅ Manufacturers from state:', cached.length);
      return cached;
    }

    try {
      const data = await this.get('/api/manufacturers');
      const transformed = this.transformManufacturers(data);

      // Store in state
      appState.set('api.manufacturers', transformed);

      console.log('✅ Manufacturers loaded and stored:', transformed.length);
      return transformed;
    } catch (error) {
      console.error('❌ Failed to fetch manufacturers:', error);

      // Use fallback data
      const fallback = this.getFallbackManufacturers();
      appState.set('api.manufacturers', fallback);
      appState.set('api.errors.manufacturers', error.message);

      return fallback;
    }
  }

  async fetchDevicesByManufacturer(manufacturerId) {
    console.log(`📱 Fetching devices for manufacturer ${manufacturerId}...`);

    // Check state first
    const stateKey = `api.devices.${manufacturerId}`;
    const cached = appState.get(stateKey);
    if (cached) {
      console.log('✅ Devices from state:', cached.length);
      return cached;
    }

    try {
      const data = await this.get(
        `/api/devices?manufacturerId=${manufacturerId}`
      );
      const transformed = this.transformDevices(data);

      // Store in state
      appState.set(stateKey, transformed);

      console.log(
        `✅ Devices loaded for manufacturer ${manufacturerId}:`,
        transformed.length
      );
      return transformed;
    } catch (error) {
      console.error(
        `❌ Failed to fetch devices for manufacturer ${manufacturerId}:`,
        error
      );

      // Use fallback data
      const fallback = this.getFallbackDevices(manufacturerId);
      appState.set(stateKey, fallback);
      appState.set(`api.errors.devices.${manufacturerId}`, error.message);

      return fallback;
    }
  }

  async fetchActionsByDevice(deviceId) {
    console.log(`🔧 Fetching actions for device ${deviceId}...`);

    // Check state first
    const cached = appState.get('api.actions');
    if (cached) {
      console.log('✅ Actions from state:', cached.length);
      return cached;
    }

    try {
      const data = await this.get('/api/actions');
      const transformed = this.transformActions(data);

      // Store in state (actions are global in this API)
      appState.set('api.actions', transformed);

      console.log(`✅ Actions loaded:`, transformed.length);
      return transformed;
    } catch (error) {
      console.error(`❌ Failed to fetch actions:`, error);

      // Use fallback data
      const fallback = this.getFallbackActions();
      appState.set('api.actions', fallback);
      appState.set('api.errors.actions', error.message);

      return fallback;
    }
  }

  async fetchPriceForAction(actionId, deviceId = null) {
    console.log(
      `💰 Fetching price for action ${actionId}, device ${deviceId}...`
    );

    try {
      let queryString = `actionId=${actionId}`;
      if (deviceId) {
        queryString += `&deviceId=${deviceId}`;
      }

      const data = await this.get(`/api/price?${queryString}`);
      const transformed = this.transformPrice(data);

      // Store latest price in state
      const priceKey = `api.prices.${actionId}_${deviceId || 'base'}`;
      appState.set(priceKey, {
        ...transformed,
        timestamp: Date.now(),
      });

      console.log(`✅ Price loaded:`, transformed.formatted);
      return transformed;
    } catch (error) {
      console.error(`❌ Failed to fetch price:`, error);

      // Calculate fallback price
      const fallback = this.calculateFallbackPrice(actionId, deviceId);
      return fallback;
    }
  }

  // === BUYBACK SERVICE METHODS ===

  async fetchConditionsByDevice(deviceId) {
    console.log(`📋 Fetching conditions for device ${deviceId}...`);

    // Check state first
    const cached = appState.get('api.conditions');
    if (cached) {
      console.log('✅ Conditions from state:', cached.length);
      return cached;
    }

    const conditions = [
      {
        id: '1',
        name: 'Wie Neu',
        description: 'Keine Kratzer, 100% funktionsfähig',
      },
      {
        id: '2',
        name: 'Gut',
        description: 'Kleine Kratzer, 100% funktionsfähig',
      },
      {
        id: '3',
        name: 'Akzeptabel',
        description: 'Sichtbare Kratzer, voll funktionsfähig',
      },
      {
        id: '4',
        name: 'Beschädigt',
        description: 'Starke Kratzer, noch funktionsfähig',
      },
    ];

    // Store in state
    appState.set('api.conditions', conditions);

    console.log(`✅ Conditions loaded:`, conditions.length);
    return conditions;
  }

  async fetchPriceForCondition(conditionId, deviceId = null) {
    console.log(
      `💰 Fetching buyback price for condition ${conditionId}, device ${deviceId}...`
    );

    try {
      const basePrice = await this.fetchPriceForAction(conditionId, deviceId);

      // Adjust price for buyback
      const buybackMultiplier = { 1: 0.8, 2: 0.6, 3: 0.4, 4: 0.2 };
      const multiplier = buybackMultiplier[String(conditionId)] || 0.5;
      const buybackPrice = Math.round(basePrice.price * multiplier);

      const result = {
        ...basePrice,
        price: buybackPrice,
        formatted: `${buybackPrice} €`,
        message: 'Ankaufspreis',
      };

      // Store in state
      const priceKey = `api.buybackPrices.${conditionId}_${deviceId || 'base'}`;
      appState.set(priceKey, {
        ...result,
        timestamp: Date.now(),
      });

      return result;
    } catch (error) {
      console.error(`❌ Failed to fetch buyback price:`, error);

      const fallback = this.calculateFallbackBuybackPrice(
        conditionId,
        deviceId
      );
      return fallback;
    }
  }

  // === FALLBACK DATA METHODS ===

  getFallbackManufacturers() {
    return [
      { id: '1', name: 'Apple' },
      { id: '2', name: 'Samsung' },
      { id: '3', name: 'Huawei' },
      { id: '4', name: 'Google' },
      { id: '5', name: 'OnePlus' },
    ];
  }

  getFallbackDevices(manufacturerId) {
    const fallbackDevices = {
      1: [
        { id: '1', name: 'iPhone 15 Pro Max', manufacturerId: '1' },
        { id: '2', name: 'iPhone 15 Pro', manufacturerId: '1' },
        { id: '3', name: 'iPhone 15', manufacturerId: '1' },
      ],
      2: [
        { id: '4', name: 'Galaxy S24 Ultra', manufacturerId: '2' },
        { id: '5', name: 'Galaxy S24+', manufacturerId: '2' },
      ],
      3: [
        { id: '7', name: 'P60 Pro', manufacturerId: '3' },
        { id: '8', name: 'P60', manufacturerId: '3' },
      ],
      4: [{ id: '9', name: 'Pixel 8 Pro', manufacturerId: '4' }],
      5: [{ id: '10', name: 'OnePlus 12', manufacturerId: '5' }],
    };
    return fallbackDevices[String(manufacturerId)] || [];
  }

  getFallbackActions() {
    return [
      { id: '1', name: 'Display Reparatur', basePrice: 299 },
      { id: '2', name: 'Akku Tausch', basePrice: 89 },
      { id: '3', name: 'Kamera Reparatur', basePrice: 199 },
      { id: '4', name: 'Ladebuchse Reparatur', basePrice: 129 },
    ];
  }

  calculateFallbackPrice(actionId, deviceId) {
    const fallbackPrices = { 1: 299, 2: 89, 3: 199, 4: 129 };
    const basePrice = fallbackPrices[String(actionId)] || 150;

    const multipliers = { 1: 1.2, 2: 1.15, 3: 1.1, 4: 1.3, 5: 1.2 };
    const multiplier = deviceId ? multipliers[String(deviceId)] || 1.0 : 1.0;
    const finalPrice = Math.round(basePrice * multiplier);

    return {
      price: finalPrice,
      currency: '€',
      formatted: `${finalPrice} €`,
      message: 'Reparatur',
      actionId: parseInt(actionId),
      deviceId: deviceId ? parseInt(deviceId) : null,
      dateCollected: new Date().toISOString(),
      estimatedTime: actionId === '1' ? '30-60 Min' : '20-30 Min',
    };
  }

  calculateFallbackBuybackPrice(conditionId, deviceId) {
    const basePrices = { 1: 500, 2: 400, 3: 300, 4: 200 };
    const price = basePrices[String(conditionId)] || 250;

    return {
      price,
      currency: '€',
      formatted: `${price} €`,
      message: 'Ankaufspreis',
      conditionId: parseInt(conditionId),
      deviceId: deviceId ? parseInt(deviceId) : null,
      dateCollected: new Date().toISOString(),
    };
  }

  // === UNIFIED INTERFACE (unchanged) ===
  fetchDevices = (manufacturerId) =>
    this.fetchDevicesByManufacturer(manufacturerId);
  fetchActions = (deviceId) => this.fetchActionsByDevice(deviceId);
  fetchPrice = (actionId, deviceId) =>
    this.fetchPriceForAction(actionId, deviceId);
  fetchConditions = (deviceId) => this.fetchConditionsByDevice(deviceId);

  // === UTILITY METHODS ===

  async testConnection() {
    console.log('🧪 Testing API connection...');
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();

      appState.set('api.health', {
        status: 'connected',
        data,
        timestamp: Date.now(),
      });

      console.log('✅ API connection test successful:', data);
      return { success: true, data };
    } catch (error) {
      appState.set('api.health', {
        status: 'disconnected',
        error: error.message,
        timestamp: Date.now(),
      });

      console.error('❌ API connection test failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Clear all API caches in state - Economy of Expression
  clearCache() {
    console.log('🗑️ Clearing API cache...');
    appState.delete('api.cache');
    appState.delete('api.manufacturers');
    appState.delete('api.devices');
    appState.delete('api.actions');
    appState.delete('api.conditions');
    appState.delete('api.prices');
    appState.delete('api.buybackPrices');
  }

  // Get cache status from state
  getCacheStatus() {
    const cache = appState.get('api.cache') || {};
    const cacheKeys = Object.keys(cache);

    return {
      endpoints: cacheKeys.length,
      items: {
        manufacturers: appState.has('api.manufacturers'),
        devices: Object.keys(appState.get('api.devices') || {}).length,
        actions: appState.has('api.actions'),
        conditions: appState.has('api.conditions'),
      },
    };
  }

  // Destroy method for service coordinator
  destroy() {
    console.log('🧹 Destroying API service');
    this.clearCache();
  }
}

// Export for development testing
if (import.meta.env.DEV) {
  window.ApiService = ApiService;
  console.log('🔧 ApiService available at window.ApiService for testing');

  // Test helper to see state integration
  window.testApiState = async () => {
    console.log('🧪 Testing API state integration...');
    const api = new ApiService();

    // Test connection
    await api.testConnection();

    // Load manufacturers
    await api.fetchManufacturers();

    // Check state
    console.log('API state:', appState.get('api'));
  };
}

console.log('✅ Enhanced API Service ready with state integration');
