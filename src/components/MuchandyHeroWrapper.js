// src/components/MuchandyHeroWrapper.js

import { MuchandyComponent } from './MuchandyComponent.js';
import { appState } from '../utils/stateStore.js';
import MuchandyHero from 'svarog-ui-core';
import PhoneRepairForm from 'svarog-ui-core';
import UsedPhonePriceForm from 'svarog-ui-core';

/**
 * MuchandyHeroWrapper - Handles service integration and form creation
 * Replaces the problematic MuchandyHeroContainer
 */
export class MuchandyHeroWrapper extends MuchandyComponent {
  constructor(props = {}) {
    super(props);

    // Component state
    this.state = {
      loading: true,
      error: null,
      repairService: null,
      buybackService: null,
      repairForm: null,
      buybackForm: null,
      hero: null,
      ...props,
    };

    this.apiService = null;
  }

  async load() {
    try {
      console.log('🔧 MuchandyHeroWrapper: Starting load...');

      // Wait for API service to be ready
      await appState.waitFor('services.api.ready');
      this.apiService = appState.get('services.api.instance');

      if (!this.apiService) {
        throw new Error('API service not available');
      }

      // Create service wrappers
      this.state.repairService = this.createRepairService();
      this.state.buybackService = this.createBuybackService();

      console.log('✅ MuchandyHeroWrapper: Services created');

      // Pre-load manufacturers to ensure forms have data
      const manufacturers = await this.apiService.fetchManufacturers();
      console.log(
        `✅ MuchandyHeroWrapper: Loaded ${manufacturers.length} manufacturers`
      );

      this.state.loading = false;
    } catch (error) {
      console.error('❌ MuchandyHeroWrapper: Load failed:', error);
      this.state.error = error;
      this.state.loading = false;
    }
  }

  createRepairService() {
    console.log('🔧 Creating repair service wrapper');

    return {
      fetchManufacturers: async () => {
        try {
          const result = await this.apiService.fetchManufacturers();
          console.log(
            '✅ RepairService: manufacturers loaded:',
            result?.length || 0
          );
          return result || [];
        } catch (error) {
          console.error('❌ RepairService: fetchManufacturers failed:', error);
          return [];
        }
      },

      fetchDevices: async (manufacturerId) => {
        try {
          if (!manufacturerId) return [];
          const result = await this.apiService.fetchDevices(manufacturerId);
          console.log('✅ RepairService: devices loaded:', result?.length || 0);
          return result || [];
        } catch (error) {
          console.error('❌ RepairService: fetchDevices failed:', error);
          return [];
        }
      },

      fetchActions: async (deviceId) => {
        try {
          if (!deviceId) return [];
          const result = await this.apiService.fetchActionsByDevice(deviceId);
          console.log('✅ RepairService: actions loaded:', result?.length || 0);
          return result || [];
        } catch (error) {
          console.error('❌ RepairService: fetchActions failed:', error);
          return [];
        }
      },

      fetchPrice: async (actionId) => {
        try {
          if (!actionId) return null;
          const result = await this.apiService.fetchPriceByAction(actionId);
          console.log('✅ RepairService: price loaded:', result);
          return result;
        } catch (error) {
          console.error('❌ RepairService: fetchPrice failed:', error);
          return { amount: 0, currency: 'EUR', formatted: '0 €', price: 0 };
        }
      },
    };
  }

  createBuybackService() {
    console.log('🔧 Creating buyback service wrapper');

    // Static conditions since API doesn't have this endpoint
    const CONDITIONS = [
      { id: '1', name: 'Wie neu', value: 'like-new', multiplier: 0.7 },
      { id: '2', name: 'Sehr gut', value: 'very-good', multiplier: 0.5 },
      { id: '3', name: 'Gut', value: 'good', multiplier: 0.3 },
      { id: '4', name: 'Akzeptabel', value: 'acceptable', multiplier: 0.15 },
      { id: '5', name: 'Defekt', value: 'defective', multiplier: 0.05 },
    ];

    return {
      fetchManufacturers: async () => {
        try {
          const result = await this.apiService.fetchManufacturers();
          console.log(
            '✅ BuybackService: manufacturers loaded:',
            result?.length || 0
          );
          return result || [];
        } catch (error) {
          console.error('❌ BuybackService: fetchManufacturers failed:', error);
          return [];
        }
      },

      fetchDevices: async (manufacturerId) => {
        try {
          if (!manufacturerId) return [];
          const result = await this.apiService.fetchDevices(manufacturerId);
          console.log(
            '✅ BuybackService: devices loaded:',
            result?.length || 0
          );
          return result || [];
        } catch (error) {
          console.error('❌ BuybackService: fetchDevices failed:', error);
          return [];
        }
      },

      fetchConditions: async (deviceId) => {
        try {
          if (!deviceId) return [];
          console.log(
            '✅ BuybackService: returning static conditions:',
            CONDITIONS.length
          );
          return CONDITIONS;
        } catch (error) {
          console.error('❌ BuybackService: fetchConditions failed:', error);
          return [];
        }
      },

      fetchPrice: async (conditionId) => {
        try {
          if (!conditionId) return null;

          const condition = CONDITIONS.find((c) => c.id === conditionId);
          if (!condition) return null;

          const basePrice = 300;
          const buybackPrice = Math.round(basePrice * condition.multiplier);

          const price = {
            amount: buybackPrice * 100,
            currency: 'EUR',
            formatted: `${buybackPrice} €`,
            price: buybackPrice,
            conditionName: condition.name,
            conditionId: condition.id,
          };

          console.log('✅ BuybackService: price calculated:', price);
          return price;
        } catch (error) {
          console.error('❌ BuybackService: fetchPrice failed:', error);
          return { amount: 0, currency: 'EUR', formatted: '0 €', price: 0 };
        }
      },
    };
  }

  createForms() {
    console.log('🔧 MuchandyHeroWrapper: Creating forms...');

    // Create repair form
    this.state.repairForm = PhoneRepairForm({
      service: this.state.repairService,
      loading: false,
      onChange: (data) => {
        console.log('📝 Repair form changed:', data);
        this.props.onRepairPriceChange?.(data);
      },
      onSubmit: (data) => {
        console.log('📤 Repair form submitted:', data);
        this.props.onRepairPriceClick?.(data);
      },
    });

    // Create buyback form
    this.state.buybackForm = UsedPhonePriceForm({
      service: this.state.buybackService,
      loading: false,
      onChange: (data) => {
        console.log('📝 Buyback form changed:', data);
        this.props.onBuybackPriceChange?.(data);
      },
      onSubmit: (data) => {
        console.log('📤 Buyback form submitted:', data);
        this.props.onBuybackPriceSubmit?.(data);
      },
    });

    console.log('✅ MuchandyHeroWrapper: Forms created');
  }

  createHero() {
    console.log('🔧 MuchandyHeroWrapper: Creating hero component...');

    // Create the hero with the forms
    this.state.hero = MuchandyHero({
      title: this.props.title || 'Finden Sie<br>Ihren Preis',
      subtitle: this.props.subtitle || 'Jetzt Preis berechnen.',
      backgroundImageUrl: this.props.backgroundImageUrl || '',
      defaultTab: this.props.defaultTab || 'repair',
      className: this.props.className || '',
      blurIntensity:
        this.props.blurIntensity !== undefined ? this.props.blurIntensity : 4,
      overlayOpacity:
        this.props.overlayOpacity !== undefined
          ? this.props.overlayOpacity
          : 0.3,
      repairForm: this.state.repairForm,
      buybackForm: this.state.buybackForm,
    });

    console.log('✅ MuchandyHeroWrapper: Hero created');
  }

  render() {
    // Create container
    const container = document.createElement('div');
    container.className = 'muchandy-hero-wrapper';

    if (this.state.loading) {
      container.innerHTML = `
        <div class="muchandy-hero-wrapper__loading">
          <div class="muchandy-hero-wrapper__spinner"></div>
          <p>Loading services...</p>
        </div>
      `;

      // Add minimal loading styles
      const style = document.createElement('style');
      style.textContent = `
        .muchandy-hero-wrapper__loading {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 400px;
          padding: 2rem;
        }
        .muchandy-hero-wrapper__spinner {
          width: 40px;
          height: 40px;
          border: 3px solid #f3f3f3;
          border-top: 3px solid #3498db;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `;
      container.appendChild(style);

      return container;
    }

    if (this.state.error) {
      container.innerHTML = `
        <div class="muchandy-hero-wrapper__error">
          <h3>Error loading services</h3>
          <p>${this.state.error.message}</p>
        </div>
      `;
      return container;
    }

    // Create forms if not already created
    if (!this.state.repairForm || !this.state.buybackForm) {
      this.createForms();
    }

    // Create hero if not already created
    if (!this.state.hero) {
      this.createHero();
    }

    // Append hero to container
    container.appendChild(this.state.hero.getElement());

    return container;
  }

  async mounted() {
    console.log('🎯 MuchandyHeroWrapper: Mounted');

    // Watch for API service changes
    this.watchState('services.api.ready', (ready) => {
      if (ready && this.state.error) {
        console.log(
          '🔄 MuchandyHeroWrapper: API service recovered, retrying...'
        );
        this.state.error = null;
        this.state.loading = true;
        this.load().then(() => this.rerender());
      }
    });

    // Watch for manufacturer updates
    this.watchState('api.manufacturers', (manufacturers) => {
      console.log(
        '🔄 MuchandyHeroWrapper: Manufacturers updated:',
        manufacturers?.length
      );
    });
  }

  destroy() {
    console.log('🧹 MuchandyHeroWrapper: Destroying...');

    // Destroy hero component
    if (this.state.hero) {
      this.state.hero.destroy();
    }

    // Destroy forms
    if (this.state.repairForm) {
      this.state.repairForm.destroy();
    }

    if (this.state.buybackForm) {
      this.state.buybackForm.destroy();
    }

    // Call parent destroy
    super.destroy();
  }
}

// Factory function
export default function createMuchandyHeroWrapper(props) {
  return new MuchandyHeroWrapper(props);
}
