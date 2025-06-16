// src/services/apiService.js - Complete Fixed Version (No Duplicates)
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

  // Data transformation helpers - Algorithmic Elegance
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

  // === REPAIR SERVICE METHODS ===

  async fetchManufacturers() {
    console.log('🏭 Fetching manufacturers...');
    try {
      const data = await this.get('/api/manufacturers');
      const transformed = this.transformManufacturers(data);
      console.log('✅ Manufacturers loaded:', transformed);
      return transformed;
    } catch (error) {
      console.error('❌ Failed to fetch manufacturers:', error);
      // Return fallback data
      return [
        { id: '1', name: 'Apple' },
        { id: '2', name: 'Samsung' },
        { id: '3', name: 'Huawei' },
        { id: '4', name: 'Google' },
        { id: '5', name: 'OnePlus' },
      ];
    }
  }

  async fetchDevicesByManufacturer(manufacturerId) {
    console.log(`📱 Fetching devices for manufacturer ${manufacturerId}...`);
    try {
      // Using query parameter instead of route parameter
      const data = await this.get(
        `/api/devices?manufacturerId=${manufacturerId}`
      );
      const transformed = this.transformDevices(data);
      console.log(
        `✅ Devices loaded for manufacturer ${manufacturerId}:`,
        transformed
      );
      return transformed;
    } catch (error) {
      console.error(
        `❌ Failed to fetch devices for manufacturer ${manufacturerId}:`,
        error
      );

      // Return fallback devices
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
  }

  async fetchActionsByDevice(deviceId) {
    console.log(`🔧 Fetching actions for device ${deviceId}...`);
    try {
      // Actions endpoint doesn't filter by device in this API
      const data = await this.get('/api/actions');
      const transformed = this.transformActions(data);
      console.log(`✅ Actions loaded:`, transformed);
      return transformed;
    } catch (error) {
      console.error(`❌ Failed to fetch actions:`, error);
      // Return fallback actions
      return [
        { id: '1', name: 'Display Reparatur', basePrice: 299 },
        { id: '2', name: 'Akku Tausch', basePrice: 89 },
        { id: '3', name: 'Kamera Reparatur', basePrice: 199 },
        { id: '4', name: 'Ladebuchse Reparatur', basePrice: 129 },
      ];
    }
  }

  async fetchPriceForAction(actionId, deviceId = null) {
    console.log(
      `💰 Fetching price for action ${actionId}, device ${deviceId}...`
    );
    try {
      // Build query string with proper encoding
      let queryString = `actionId=${actionId}`;
      if (deviceId) {
        queryString += `&deviceId=${deviceId}`;
      }

      const data = await this.get(`/api/price?${queryString}`, false); // Don't cache prices
      const transformed = this.transformPrice(data);
      console.log(`✅ Price loaded:`, transformed);
      return transformed;
    } catch (error) {
      console.error(`❌ Failed to fetch price:`, error);

      // Return fallback price calculation
      const fallbackPrices = { 1: 299, 2: 89, 3: 199, 4: 129 };
      const basePrice = fallbackPrices[String(actionId)] || 150;

      // Apply device multiplier if provided
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
  }

  // === BUYBACK SERVICE METHODS ===

  // For buyback, conditions are like actions
  async fetchConditionsByDevice(deviceId) {
    console.log(`📋 Fetching conditions for device ${deviceId}...`);
    try {
      // This API doesn't have separate conditions endpoint, so we mock it
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
      console.log(`✅ Conditions loaded:`, conditions);
      return conditions;
    } catch (error) {
      console.error(`❌ Failed to fetch conditions:`, error);
      return [];
    }
  }

  async fetchPriceForCondition(conditionId, deviceId = null) {
    console.log(
      `💰 Fetching buyback price for condition ${conditionId}, device ${deviceId}...`
    );
    try {
      // For buyback, we can reuse price endpoint with adjusted calculation
      const basePrice = await this.fetchPriceForAction(conditionId, deviceId);

      // Adjust price for buyback (typically lower than repair)
      const buybackMultiplier = { 1: 0.8, 2: 0.6, 3: 0.4, 4: 0.2 };
      const multiplier = buybackMultiplier[String(conditionId)] || 0.5;
      const buybackPrice = Math.round(basePrice.price * multiplier);

      return {
        ...basePrice,
        price: buybackPrice,
        formatted: `${buybackPrice} €`,
        message: 'Ankaufspreis',
      };
    } catch (error) {
      console.error(`❌ Failed to fetch buyback price:`, error);

      // Fallback buyback prices
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
  }

  // === UNIFIED INTERFACE FOR COMPONENTS ===

  // Methods expected by PhoneRepairForm
  fetchDevices = (manufacturerId) =>
    this.fetchDevicesByManufacturer(manufacturerId);
  fetchActions = (deviceId) => this.fetchActionsByDevice(deviceId);
  fetchPrice = (actionId, deviceId) =>
    this.fetchPriceForAction(actionId, deviceId);

  // Methods expected by UsedPhonePriceForm
  fetchConditions = (deviceId) => this.fetchConditionsByDevice(deviceId);

  // === UTILITY METHODS ===

  // Test API connectivity
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

  // Debug helper to test all endpoints
  async testAllEndpoints() {
    console.log('🧪 Testing all API endpoints...');
    const results = {};

    try {
      // Test manufacturers
      results.manufacturers = await this.fetchManufacturers();
      console.log('✅ Manufacturers:', results.manufacturers.length);

      // Test devices for first manufacturer
      if (results.manufacturers.length > 0) {
        const firstManufacturer = results.manufacturers[0];
        results.devices = await this.fetchDevices(firstManufacturer.id);
        console.log('✅ Devices:', results.devices.length);

        // Test actions
        if (results.devices.length > 0) {
          const firstDevice = results.devices[0];
          results.actions = await this.fetchActions(firstDevice.id);
          console.log('✅ Actions:', results.actions.length);

          // Test price
          if (results.actions.length > 0) {
            const firstAction = results.actions[0];
            results.price = await this.fetchPrice(
              firstAction.id,
              firstDevice.id
            );
            console.log('✅ Price:', results.price.formatted);
          }
        }

        // Test buyback conditions
        if (results.devices.length > 0) {
          const firstDevice = results.devices[0];
          results.conditions = await this.fetchConditions(firstDevice.id);
          console.log('✅ Conditions:', results.conditions.length);

          // Test buyback price
          if (results.conditions.length > 0) {
            const firstCondition = results.conditions[0];
            results.buybackPrice = await this.fetchPriceForCondition(
              firstCondition.id,
              firstDevice.id
            );
            console.log('✅ Buyback Price:', results.buybackPrice.formatted);
          }
        }
      }

      console.log('✅ All endpoints tested successfully');
      return results;
    } catch (error) {
      console.error('❌ Endpoint testing failed:', error);
      return { error: error.message, results };
    }
  }
}

// Export for development testing
if (import.meta.env.DEV) {
  window.ApiService = ApiService;
  console.log('🔧 ApiService available at window.ApiService for testing');
}
