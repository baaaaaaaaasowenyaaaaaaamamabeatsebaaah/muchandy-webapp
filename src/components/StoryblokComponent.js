// src/components/StoryblokComponent.js - Fixed service interface compatibility
import {
  createElement,
  MuchandyHeroContainer, // Import the container from svarog-ui-core
} from 'svarog-ui-core';

import { serviceCoordinator } from '../utils/serviceCoordinator.js';
import { appState } from '../utils/stateStore.js';

console.log('=== STORYBLOK COMPONENT WITH FIXED API MAPPING ===');

// Render MuchandyHero using the container from svarog-ui with proper service interface
function renderMuchandyHero(blok) {
  console.log(
    '🚀 Rendering MuchandyHeroContainer with correct API mapping:',
    blok
  );

  // Check if services are ready using state management
  const servicesReady = appState.get('services.api.ready');
  if (!servicesReady) {
    console.warn('⚠️ API service not ready, showing loading state');
    return createLoadingHeroContainer(blok);
  }

  // Get API service from state - ensure we get the initialized instance
  const apiService = appState.get('services.api.instance');

  if (!apiService) {
    console.error('❌ API service instance not found in state');

    // Try service coordinator as fallback
    try {
      const coordinatorService = serviceCoordinator.get('api');
      console.warn(
        '⚠️ Using API service from coordinator (may not have loaded data)'
      );
      return createMuchandyHeroWithService(blok, coordinatorService);
    } catch (error) {
      console.error('❌ API service not available:', error.message);
      return createErrorHeroContainer(blok, error);
    }
  }

  console.log('✅ Using API service from state with loaded data');
  return createMuchandyHeroWithService(blok, apiService);
}

// Helper function to create hero with service
function createMuchandyHeroWithService(blok, apiService) {
  try {
    // Create repair service wrapper with proper interface
    const repairService = createRepairServiceWrapper(apiService);

    // Create buyback service wrapper with proper interface
    const buybackService = createBuybackServiceWrapper(apiService);

    // Validate service interfaces before creating container
    validateServiceInterfaces(repairService, buybackService);

    console.log('📦 Creating MuchandyHeroContainer with services...');

    // Create container with validated services from svarog-ui
    const heroContainer = MuchandyHeroContainer({
      // Services - properly wrapped and validated
      repairService,
      buybackService,

      // Hero props from Storyblok with proper fallbacks
      backgroundImageUrl: blok.background_image?.filename || '',
      title: blok.title || 'Finden Sie<br>Ihren Preis',
      subtitle: blok.subtitle || 'Jetzt Preis berechnen.',
      defaultTab: blok.default_tab || 'repair',

      // Additional props from Storyblok
      className: blok.className || 'muchandy-hero-from-storyblok',

      // Callbacks with proper error handling
      onScheduleClick: createScheduleClickHandler(),
      onSubmit: createSubmitHandler(),

      // Error handling callbacks
      onError: (error) => {
        console.error('🚨 MuchandyHeroContainer error:', error);
        appState.set('components.muchandy-hero.error', error.message);
      },
    });

    // Track component creation in state
    appState.set('components.muchandy-hero.status', 'created');
    appState.set('components.muchandy-hero.source', 'storyblok');

    console.log('✅ MuchandyHeroContainer created successfully');
    return heroContainer;
  } catch (error) {
    console.error('❌ Failed to create MuchandyHeroContainer:', error);
    return createErrorHeroContainer(blok, error);
  }
}

/**
 * Create repair service wrapper with proper interface matching svarog-ui expectations
 * Maps to actual API endpoints from server.js
 */
function createRepairServiceWrapper(apiService) {
  console.log('🔧 Creating repair service wrapper with correct API mapping');

  return {
    // Fetch manufacturers - maps to GET /api/manufacturers
    fetchManufacturers: async () => {
      try {
        console.log('📞 RepairService: fetchManufacturers');
        const result = await apiService.fetchManufacturers();
        console.log(
          '✅ RepairService: manufacturers loaded:',
          result?.length || 0
        );

        // Ensure we return an array
        if (!Array.isArray(result)) {
          console.error(
            '❌ RepairService: Invalid manufacturers data:',
            result
          );
          return [];
        }

        return result;
      } catch (error) {
        console.error('❌ RepairService: fetchManufacturers failed:', error);
        // Always return an array, even on error
        return [];
      }
    },

    // Fetch devices by manufacturer - maps to GET /api/devices?manufacturerId={id}
    fetchDevices: async (manufacturerId) => {
      try {
        console.log(
          '📞 RepairService: fetchDevices for manufacturer:',
          manufacturerId
        );

        if (!manufacturerId) {
          console.warn('⚠️ RepairService: No manufacturerId provided');
          return [];
        }

        const result = await apiService.fetchDevices(manufacturerId);
        console.log('✅ RepairService: devices loaded:', result?.length || 0);

        // Ensure we return an array
        if (!Array.isArray(result)) {
          console.error('❌ RepairService: Invalid devices data:', result);
          return [];
        }

        return result;
      } catch (error) {
        console.error('❌ RepairService: fetchDevices failed:', error);
        return [];
      }
    },

    // Fetch actions by device - maps to GET /api/device/{deviceId}/actions
    fetchActions: async (deviceId) => {
      try {
        console.log('📞 RepairService: fetchActions for device:', deviceId);

        if (!deviceId) {
          console.warn('⚠️ RepairService: No deviceId provided');
          return [];
        }

        // Use the correct method that maps to the right endpoint
        const result = await apiService.fetchActionsByDevice(deviceId);
        console.log('✅ RepairService: actions loaded:', result?.length || 0);

        // Ensure we return an array
        if (!Array.isArray(result)) {
          console.error('❌ RepairService: Invalid actions data:', result);
          return [];
        }

        return result;
      } catch (error) {
        console.error('❌ RepairService: fetchActions failed:', error);
        return [];
      }
    },

    // Fetch price - maps to GET /api/price?actionId={actionId}
    fetchPrice: async (actionId) => {
      try {
        console.log('📞 RepairService: fetchPrice for action:', actionId);

        if (!actionId) {
          console.warn('⚠️ RepairService: No actionId provided');
          return null;
        }

        // Use the correct method
        const response = await apiService.fetchPriceByAction(actionId);

        // Ensure we return the expected format
        const price = {
          amount: response?.amount || 0,
          currency: response?.currency || 'EUR',
          formatted: response?.formatted || '0 €',
          price: response?.price || 0,
        };

        console.log('✅ RepairService: price loaded:', price);
        return price;
      } catch (error) {
        console.error('❌ RepairService: fetchPrice failed:', error);
        // Return null on error as expected by the component
        return null;
      }
    },
  };
}

/**
 * Create buyback service wrapper with proper interface
 * Maps to actual API endpoints from server.js
 */
function createBuybackServiceWrapper(apiService) {
  console.log('🔧 Creating buyback service wrapper with correct API mapping');

  // Static conditions since API doesn't have conditions endpoint
  const CONDITIONS = [
    {
      id: '1',
      name: 'Wie neu',
      value: 'like-new',
      description: 'Gerät sieht aus wie neu',
      multiplier: 0.7,
    },
    {
      id: '2',
      name: 'Sehr gut',
      value: 'very-good',
      description: 'Minimale Gebrauchsspuren',
      multiplier: 0.5,
    },
    {
      id: '3',
      name: 'Gut',
      value: 'good',
      description: 'Normale Gebrauchsspuren',
      multiplier: 0.3,
    },
    {
      id: '4',
      name: 'Akzeptabel',
      value: 'acceptable',
      description: 'Deutliche Gebrauchsspuren',
      multiplier: 0.15,
    },
    {
      id: '5',
      name: 'Defekt',
      value: 'defective',
      description: 'Gerät ist beschädigt',
      multiplier: 0.05,
    },
  ];

  // Store selected device for price calculation
  let currentDeviceId = null;

  return {
    // Fetch manufacturers - same as repair service
    fetchManufacturers: async () => {
      try {
        console.log('📞 BuybackService: fetchManufacturers');
        const result = await apiService.fetchManufacturers();
        console.log(
          '✅ BuybackService: manufacturers loaded:',
          result?.length || 0
        );

        // Ensure we return an array
        if (!Array.isArray(result)) {
          console.error(
            '❌ BuybackService: Invalid manufacturers data:',
            result
          );
          return [];
        }

        return result;
      } catch (error) {
        console.error('❌ BuybackService: fetchManufacturers failed:', error);
        return [];
      }
    },

    // Fetch devices - same as repair service
    fetchDevices: async (manufacturerId) => {
      try {
        console.log(
          '📞 BuybackService: fetchDevices for manufacturer:',
          manufacturerId
        );

        if (!manufacturerId) {
          console.warn('⚠️ BuybackService: No manufacturerId provided');
          return [];
        }

        const result = await apiService.fetchDevices(manufacturerId);
        console.log('✅ BuybackService: devices loaded:', result?.length || 0);

        // Ensure we return an array
        if (!Array.isArray(result)) {
          console.error('❌ BuybackService: Invalid devices data:', result);
          return [];
        }

        return result;
      } catch (error) {
        console.error('❌ BuybackService: fetchDevices failed:', error);
        return [];
      }
    },

    // Fetch conditions - returns static conditions but stores device ID
    fetchConditions: async (deviceId) => {
      try {
        console.log('📞 BuybackService: fetchConditions for device:', deviceId);

        if (!deviceId) {
          console.warn('⚠️ BuybackService: No deviceId provided');
          return [];
        }

        // Store the device ID for price calculation
        currentDeviceId = deviceId;

        // Return static conditions since API doesn't have this endpoint
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

    // Fetch price for buyback - calculates based on device prices and condition
    fetchPrice: async (conditionId) => {
      try {
        console.log(
          '📞 BuybackService: fetchPrice for condition:',
          conditionId,
          'device:',
          currentDeviceId
        );

        if (!conditionId) {
          console.warn('⚠️ BuybackService: No conditionId provided');
          return null;
        }

        // Find the condition
        const condition = CONDITIONS.find((c) => c.id === conditionId);
        if (!condition) {
          console.warn('⚠️ BuybackService: Invalid conditionId:', conditionId);
          return null;
        }

        // Get device prices to calculate buyback value
        let basePrice = 300; // Default base price

        if (currentDeviceId && apiService.fetchDevicePrices) {
          try {
            // Fetch all prices for the device
            const devicePrices =
              await apiService.fetchDevicePrices(currentDeviceId);

            if (devicePrices && devicePrices.length > 0) {
              // Find the highest repair price as base for buyback
              let maxPrice = 0;
              devicePrices.forEach((action) => {
                if (action.prices && action.prices.length > 0) {
                  const actionMaxPrice = Math.max(
                    ...action.prices.map((p) => p.price || 0)
                  );
                  maxPrice = Math.max(maxPrice, actionMaxPrice);
                }
              });

              // Use a percentage of the highest repair price as base
              if (maxPrice > 0) {
                basePrice = Math.round(maxPrice * 1.5); // Assume device value is 1.5x highest repair
              }
            }
          } catch (error) {
            console.warn(
              '⚠️ Could not fetch device prices for buyback calculation:',
              error
            );
          }
        }

        // Calculate buyback price based on condition
        const buybackPrice = Math.round(basePrice * condition.multiplier);

        const price = {
          amount: buybackPrice * 100, // Convert to cents
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
        // Return null on error as expected by the component
        return null;
      }
    },
  };
}

/**
 * Validate service interfaces before passing to MuchandyHeroContainer
 */
function validateServiceInterfaces(repairService, buybackService) {
  console.log('🔍 Validating service interfaces...');

  // Required methods for repair service
  const repairMethods = [
    'fetchManufacturers',
    'fetchDevices',
    'fetchActions',
    'fetchPrice',
  ];
  const buybackMethods = [
    'fetchManufacturers',
    'fetchDevices',
    'fetchConditions',
    'fetchPrice',
  ];

  // Validate repair service
  for (const method of repairMethods) {
    if (typeof repairService[method] !== 'function') {
      throw new Error(`RepairService missing method: ${method}`);
    }
  }

  // Validate buyback service
  for (const method of buybackMethods) {
    if (typeof buybackService[method] !== 'function') {
      throw new Error(`BuybackService missing method: ${method}`);
    }
  }

  console.log('✅ Service interfaces validated successfully');
}

/**
 * Create loading state hero container
 */
function createLoadingHeroContainer(blok) {
  console.log('⏳ Creating loading hero container');

  return {
    getElement: () =>
      createElement('div', {
        className: 'muchandy-hero-loading',
        style: {
          minHeight: '600px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: blok.background_image?.filename
            ? `linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.7)), url(${blok.background_image.filename})`
            : 'linear-gradient(135deg, #ff7f50, #ffa07a)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          textAlign: 'center',
        },
        innerHTML: `
        <div>
          <div style="margin-bottom: 20px;">
            <div style="width: 48px; height: 48px; border: 4px solid rgba(255,255,255,0.3); border-top: 4px solid white; border-radius: 50%; animation: spin 1s linear infinite; margin: 0 auto;"></div>
          </div>
          <h1 style="margin: 0 0 10px 0; font-size: 2rem;">${blok.title || 'Lädt...'}</h1>
          <p style="margin: 0; opacity: 0.9;">${blok.subtitle || 'Preisrechner wird initialisiert...'}</p>
        </div>
        <style>
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        </style>
      `,
      }),
    update: () => {},
    destroy: () => {},
  };
}

/**
 * Create error state hero container
 */
function createErrorHeroContainer(blok, error) {
  console.log('❌ Creating error hero container:', error.message);

  return {
    getElement: () =>
      createElement('div', {
        className: 'muchandy-hero-error',
        style: {
          minHeight: '600px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: blok.background_image?.filename
            ? `linear-gradient(rgba(220,53,69,0.8), rgba(220,53,69,0.8)), url(${blok.background_image.filename})`
            : 'linear-gradient(135deg, #dc3545, #c82333)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          color: 'white',
          textAlign: 'center',
        },
        innerHTML: `
        <div>
          <div style="font-size: 3rem; margin-bottom: 20px;">⚠️</div>
          <h1 style="margin: 0 0 10px 0; font-size: 2rem;">Service nicht verfügbar</h1>
          <p style="margin: 0 0 20px 0; opacity: 0.9;">
            Der Preisrechner kann momentan nicht geladen werden.
          </p>
          <p style="margin: 0 0 30px 0; font-size: 0.9rem; opacity: 0.7;">
            ${error.message}
          </p>
          <a href="tel:08926949777" style="
            display: inline-block;
            padding: 12px 24px;
            background: white;
            color: #dc3545;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
            transition: transform 0.2s;
          " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            Jetzt anrufen: 089 / 26949777
          </a>
        </div>
      `,
      }),
    update: () => {},
    destroy: () => {},
  };
}

/**
 * Create schedule click handler with proper error handling
 */
function createScheduleClickHandler() {
  return (repairInfo) => {
    try {
      console.log('📅 Schedule repair clicked:', repairInfo);

      // Track interaction in state
      appState.set('analytics.interactions.repair-schedule', {
        timestamp: Date.now(),
        repairInfo: {
          device: repairInfo.device?.name || 'Unknown Device',
          action: repairInfo.action?.name || 'Unknown Action',
          price: repairInfo.price?.amount || repairInfo.price?.price || 0,
        },
      });

      // Show confirmation with proper formatting
      if (repairInfo.price) {
        const deviceName = repairInfo.device?.name || 'Gerät';
        const actionName = repairInfo.action?.name || 'Reparatur';
        const priceFormatted =
          repairInfo.price.formatted ||
          (repairInfo.price.amount &&
            `€${(repairInfo.price.amount / 100).toFixed(2)}`) ||
          (repairInfo.price.price && `€${repairInfo.price.price}`) ||
          'Preis auf Anfrage';

        alert(
          `Reparatur bestätigt!\n\nGerät: ${deviceName}\nService: ${actionName}\nPreis: ${priceFormatted}\n\nWir kontaktieren Sie in Kürze!`
        );
      } else {
        alert(
          'Reparatur bestätigt! Wir kontaktieren Sie in Kürze für weitere Details.'
        );
      }
    } catch (error) {
      console.error('❌ Error in schedule click handler:', error);
      alert(
        'Ein Fehler ist aufgetreten. Bitte rufen Sie uns direkt an: 089 / 26949777'
      );
    }
  };
}

/**
 * Create submit handler for buyback form
 */
function createSubmitHandler() {
  return (formData) => {
    try {
      console.log('📝 Buyback form submitted:', formData);

      // Track interaction in state
      appState.set('analytics.interactions.buyback-submit', {
        timestamp: Date.now(),
        formData: {
          device: formData.deviceName || formData.device || 'Unknown Device',
          condition:
            formData.conditionName || formData.condition || 'Unknown Condition',
          price: formData.price?.amount || formData.price || 0,
        },
      });

      // Show confirmation with proper formatting
      if (formData.price) {
        const deviceName =
          formData.deviceName || formData.device || 'Ihr Gerät';
        const conditionName =
          formData.conditionName ||
          formData.condition ||
          'ausgewählter Zustand';
        const priceFormatted =
          formData.formatted ||
          (formData.price && `€${formData.price}`) ||
          'Preis auf Anfrage';

        alert(
          `Ankauf bestätigt!\n\nGerät: ${deviceName}\nZustand: ${conditionName}\nAnkaufspreis: ${priceFormatted}\n\nWir kontaktieren Sie in Kürze!`
        );
      } else {
        alert(
          'Ankauf bestätigt! Wir kontaktieren Sie in Kürze für weitere Details.'
        );
      }
    } catch (error) {
      console.error('❌ Error in submit handler:', error);
      alert(
        'Ein Fehler ist aufgetreten. Bitte rufen Sie uns direkt an: 089 / 26949777'
      );
    }
  };
}

// Component map - only include what we actually use
const componentMap = {
  muchandy_hero: renderMuchandyHero, // Our enhanced version
  // Add other components here as needed
};

// Main component renderer
export function renderStoryblokComponent(blok) {
  console.log('=== RENDERING COMPONENT ===');
  console.log('Component type:', blok.component);

  const renderer = componentMap[blok.component];

  if (!renderer) {
    console.error(`❌ No renderer found for component: ${blok.component}`);
    console.log('Available renderers:', Object.keys(componentMap));
    throw new Error(`No renderer found for component: ${blok.component}`);
  }

  try {
    const result = renderer(blok);
    console.log('✅ Component rendered successfully');
    return result;
  } catch (error) {
    console.error(`❌ Error rendering component ${blok.component}:`, error);
    throw error;
  }
}

// Main components renderer
export function renderStoryblokComponents(bloks) {
  console.log('=== RENDERING COMPONENTS ===');
  console.log('Components to render:', bloks.length);

  const container = createElement('div', {
    className: 'storyblok-content',
    style: { width: '100%' },
  });

  let successCount = 0;
  let errorCount = 0;

  bloks.forEach((blok, index) => {
    try {
      const component = renderStoryblokComponent(blok);

      // Handle components with getElement method
      if (component.getElement && typeof component.getElement === 'function') {
        const element = component.getElement();
        container.appendChild(element);
      } else {
        // Direct DOM elements
        container.appendChild(component);
      }

      successCount++;
      console.log(
        `✅ Component ${index + 1} (${blok.component}) rendered successfully`
      );
    } catch (error) {
      errorCount++;
      console.error(
        `❌ Error rendering component ${index + 1} (${blok.component}):`,
        error
      );

      const errorElement = createElement('div', {
        className: 'component-error',
        style: {
          padding: '1rem',
          background: '#fee',
          border: '1px solid #dc3545',
          borderRadius: '4px',
          margin: '1rem 0',
          color: '#dc3545',
        },
        innerHTML: `<strong>⚠️ Error in ${blok.component} component:</strong><br>${error.message}`,
      });

      container.appendChild(errorElement);
    }
  });

  console.log(
    `✅ Component rendering complete: ${successCount} success, ${errorCount} errors`
  );
  return container;
}

// Development helpers
if (import.meta.env.DEV) {
  window.testMuchandyHeroServices = async () => {
    console.log('🧪 Testing MuchandyHero service interfaces...');

    try {
      // Wait for services to be ready
      await appState.waitFor('services.api.ready', 5000);

      const apiService = appState.get('services.api.instance');
      const repairService = createRepairServiceWrapper(apiService);
      const buybackService = createBuybackServiceWrapper(apiService);

      // Test interfaces
      validateServiceInterfaces(repairService, buybackService);

      // Test actual calls
      console.log('Testing repair service...');
      const manufacturers = await repairService.fetchManufacturers();
      console.log('Manufacturers:', manufacturers?.length || 0);

      if (manufacturers?.length > 0) {
        const devices = await repairService.fetchDevices(manufacturers[0].id);
        console.log('Devices:', devices?.length || 0);

        if (devices?.length > 0) {
          const actions = await repairService.fetchActions(devices[0].id);
          console.log('Actions:', actions?.length || 0);

          if (actions?.length > 0) {
            const price = await repairService.fetchPrice(actions[0].id);
            console.log('Price:', price);
          }
        }
      }

      console.log('✅ Service interface test completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Service interface test failed:', error);
      return false;
    }
  };

  // Add debug helper to check MuchandyHero state
  window.debugMuchandyHero = () => {
    console.log('=== MUCHANDY HERO DEBUG ===');
    const heroState = appState.get('components.muchandy-hero');
    console.log('Hero State:', heroState);

    // Check if there are any MuchandyHero elements in DOM
    const heroElements = document.querySelectorAll(
      '.muchandy-hero, .muchandy-hero-enhanced'
    );
    console.log('Hero Elements in DOM:', heroElements.length);

    heroElements.forEach((el, i) => {
      console.log(`Hero ${i + 1}:`, {
        classes: el.className,
        hasTabsContainer: !!el.querySelector('.tabs-container'),
        hasForms: !!el.querySelector(
          '.phone-repair-form, .used-phone-price-form'
        ),
        isVisible: el.offsetHeight > 0,
      });
    });

    console.log('========================');
  };

  console.log('🔧 StoryblokComponent service testing:');
  console.log(
    '  - window.testMuchandyHeroServices() - Test service interfaces'
  );
  console.log('  - window.debugMuchandyHero() - Debug hero state');
}

console.log('✅ StoryblokComponent with correct API mapping ready!');
