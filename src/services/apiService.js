// src/services/apiService.js - FIXED: Query parameters + better error handling
export default class ApiService {
  constructor() {
    this.cache = new Map();
    this.baseUrl = window.location.origin;
    console.log('🔧 ApiService initialized with baseUrl:', this.baseUrl);
  }

  // Enhanced fetch with better error handling - KISS principle
  async get(endpoint, useCache = true) {
    const fullUrl = `${this.baseUrl}${endpoint}`;
    console.log(`🌐 API GET: ${fullUrl}`);

    if (useCache && this.cache.has(endpoint)) {
      console.log(`📦 Cache hit for: ${endpoint}`);
      return this.cache.get(endpoint);
    }

    try {
      const response = await fetch(fullUrl);
      console.log(`📡 Response status: ${response.status} for ${endpoint}`);

      if (!response.ok) {
        throw new Error(`API Error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log(`✅ API data received for ${endpoint}:`, data);

      if (useCache) {
        this.cache.set(endpoint, data);
        console.log(`💾 Cached data for: ${endpoint}`);
      }

      return data;
    } catch (error) {
      console.error(`❌ API Error for ${endpoint}:`, error);
      throw error;
    }
  }

  // FIXED: Query parameter methods (not route parameters)
  async fetchManufacturers() {
    console.log('🏭 Fetching manufacturers...');
    try {
      const data = await this.get('/api/manufacturers');
      console.log('✅ Manufacturers loaded:', data);
      return data;
    } catch (error) {
      console.error('❌ Failed to fetch manufacturers:', error);
      return [
        { id: 1, name: 'Apple' },
        { id: 2, name: 'Samsung' },
        { id: 3, name: 'Huawei' },
      ];
    }
  }

  async fetchDevicesByManufacturer(manufacturerId) {
    console.log(`📱 Fetching devices for manufacturer ${manufacturerId}...`);
    try {
      // FIXED: Query parameter instead of route parameter
      const data = await this.get(
        `/api/devices?manufacturerId=${manufacturerId}`
      );
      console.log(
        `✅ Devices loaded for manufacturer ${manufacturerId}:`,
        data
      );
      return data;
    } catch (error) {
      console.error(
        `❌ Failed to fetch devices for manufacturer ${manufacturerId}:`,
        error
      );
      const fallbackDevices = {
        1: [{ id: 1, name: 'iPhone 15 Pro Max' }],
        2: [{ id: 2, name: 'Galaxy S24 Ultra' }],
        3: [{ id: 3, name: 'P60 Pro' }],
      };
      return fallbackDevices[manufacturerId] || [];
    }
  }

  async fetchActionsByDevice(deviceId) {
    console.log(`🔧 Fetching actions for device ${deviceId}...`);
    try {
      // Actions are not device-specific in this API
      const data = await this.get('/api/actions');
      console.log(`✅ Actions loaded:`, data);
      return data;
    } catch (error) {
      console.error(`❌ Failed to fetch actions:`, error);
      return [
        { id: 1, name: 'Display Reparatur' },
        { id: 2, name: 'Akku Tausch' },
        { id: 3, name: 'Kamera Reparatur' },
      ];
    }
  }

  async fetchPriceForAction(actionId, deviceId = null) {
    console.log(
      `💰 Fetching price for action ${actionId}, device ${deviceId}...`
    );
    try {
      // FIXED: Query parameters with proper encoding
      let queryString = `actionId=${actionId}`;
      if (deviceId) {
        queryString += `&deviceId=${deviceId}`;
      }

      const data = await this.get(`/api/price?${queryString}`, false);
      console.log(`✅ Price loaded:`, data);
      return data;
    } catch (error) {
      console.error(`❌ Failed to fetch price:`, error);
      const fallbackPrices = { 1: 299, 2: 89, 3: 199 };
      const price = fallbackPrices[actionId] || 150;
      return {
        price,
        currency: '€',
        formatted: `${price} €`,
        message: 'Reparatur',
        actionId: parseInt(actionId),
        deviceId: deviceId ? parseInt(deviceId) : null,
        dateCollected: new Date().toISOString(),
      };
    }
  }

  // Buyback service methods (reuse same endpoints)
  fetchConditionsByDevice = (id) => this.fetchActionsByDevice(id);
  fetchPriceForCondition = (actionId, deviceId) =>
    this.fetchPriceForAction(actionId, deviceId);

  // Test API connectivity - FIXED
  async testConnection() {
    console.log('🧪 Testing API connection...');
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      const data = await response.json();
      console.log('✅ API connection test successful:', data);
      return { success: true, data };
    } catch (error) {
      console.error('❌ API connection test failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Clear cache - Maximum Conciseness
  clearCache() {
    console.log('🗑️ Clearing API cache...');
    this.cache.clear();
  }

  // Get cache status
  getCacheStatus() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}
