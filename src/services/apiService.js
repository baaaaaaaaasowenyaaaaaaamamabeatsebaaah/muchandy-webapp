// src/services/apiService.js - Maximum conciseness
export default class ApiService {
  constructor() {
    this.cache = new Map();
  }

  // Universal fetch with caching - Algorithmic Elegance
  async get(endpoint, useCache = true) {
    if (useCache && this.cache.has(endpoint)) {
      return this.cache.get(endpoint);
    }

    const response = await fetch(`/api${endpoint}`);
    if (!response.ok) throw new Error(`API Error: ${response.status}`);

    const data = await response.json();
    if (useCache) this.cache.set(endpoint, data);

    return data;
  }

  // Repair service methods - Economy of Expression
  fetchManufacturers = () => this.get('/manufacturers');
  fetchDevicesByManufacturer = (id) => this.get(`/devices/${id}`);
  fetchActionsByDevice = (id) => this.get(`/actions/${id}`);
  fetchPriceForAction = (id) => this.get(`/price/${id}`, false); // Fresh price data

  // Buyback service methods (reuse same endpoints) - DRY principle
  fetchConditionsByDevice = (id) => this.fetchActionsByDevice(id);
  fetchPriceForCondition = (id) => this.fetchPriceForAction(id);
}
