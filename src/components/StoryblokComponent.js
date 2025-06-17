// src/components/StoryblokComponent.js - Fixed service interface compatibility
import {
  createElement,
  MuchandyHeroContainer, // Import the container from svarog-ui-core
} from 'svarog-ui-core';

import { serviceCoordinator } from '../utils/serviceCoordinator.js';
import { appState } from '../utils/stateStore.js';
import { router } from '../utils/router.js';

console.log('=== STORYBLOK COMPONENT WITH FIXED SERVICE INTERFACE ===');

// Render MuchandyHero using the container from svarog-ui with proper service interface
function renderMuchandyHero(blok) {
  console.log(
    '🚀 Rendering MuchandyHeroContainer with fixed service interface:',
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
  // Create repair service wrapper with proper interface
  const repairService = createRepairServiceWrapper(apiService);

  // Create buyback service wrapper with proper interface
  const buybackService = createBuybackServiceWrapper(apiService);

  // Validate service interfaces before creating container
  try {
    validateServiceInterfaces(repairService, buybackService);
  } catch (error) {
    console.error('❌ Service interface validation failed:', error.message);
    return createErrorHeroContainer(blok, error);
  }

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
}

/**
 * Create repair service wrapper with proper interface matching svarog-ui expectations
 */
function createRepairServiceWrapper(apiService) {
  console.log(
    '🔧 Creating repair service wrapper with apiService:',
    apiService
  );

  return {
    // Fetch manufacturers - direct mapping
    fetchManufacturers: async () => {
      try {
        console.log('📞 RepairService: fetchManufacturers');
        const result = await apiService.fetchManufacturers();
        console.log(
          '✅ RepairService: manufacturers loaded:',
          result?.length || 0
        );

        // Debug: Check if this is real data or fallback
        if (result && result.length > 0) {
          console.log('🔍 First manufacturer:', result[0]);
          if (result[0].name === 'Apple' && result[0].id === '1') {
            console.warn('⚠️ This looks like fallback data!');
          }
        }

        return result;
      } catch (error) {
        console.error('❌ RepairService: fetchManufacturers failed:', error);
        // Return fallback data to prevent component failure
        return apiService.getFallbackManufacturers?.() || [];
      }
    },

    // Fetch devices by manufacturer - direct mapping
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
        return result;
      } catch (error) {
        console.error('❌ RepairService: fetchDevices failed:', error);
        return apiService.getFallbackDevices?.(manufacturerId) || [];
      }
    },

    // Fetch actions (repair types) by device - FIXED METHOD NAME
    fetchActions: async (deviceId) => {
      try {
        console.log('📞 RepairService: fetchActions for device:', deviceId);

        if (!deviceId) {
          console.warn('⚠️ RepairService: No deviceId provided');
          return [];
        }

        // Use the correct method name from apiService
        const result = await apiService.fetchActionsByDevice(deviceId);
        console.log('✅ RepairService: actions loaded:', result?.length || 0);
        return result;
      } catch (error) {
        console.error('❌ RepairService: fetchActions failed:', error);
        return apiService.getFallbackActions?.() || [];
      }
    },

    // Fetch price for repair - FIXED PARAMETER ORDER
    fetchPrice: async (actionId, deviceId = null) => {
      try {
        console.log(
          '📞 RepairService: fetchPrice for action:',
          actionId,
          'device:',
          deviceId
        );

        if (!actionId) {
          console.warn('⚠️ RepairService: No actionId provided');
          return null;
        }

        // svarog-ui expects fetchPrice(actionId) but our API needs (deviceId, actionId)
        // Try to get deviceId from context or use fallback
        const result = deviceId
          ? await apiService.fetchPrice(deviceId, actionId)
          : await apiService.fetchPrice(actionId); // fallback for backward compatibility

        console.log('✅ RepairService: price loaded:', result);
        return result;
      } catch (error) {
        console.error('❌ RepairService: fetchPrice failed:', error);
        return (
          apiService.getFallbackPrice?.(deviceId, actionId) || {
            price: 0,
            currency: 'EUR',
          }
        );
      }
    },
  };
}

/**
 * Create buyback service wrapper with proper interface
 */
function createBuybackServiceWrapper(apiService) {
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
        return result;
      } catch (error) {
        console.error('❌ BuybackService: fetchManufacturers failed:', error);
        return apiService.getFallbackManufacturers?.() || [];
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
        return result;
      } catch (error) {
        console.error('❌ BuybackService: fetchDevices failed:', error);
        return apiService.getFallbackDevices?.(manufacturerId) || [];
      }
    },

    // Fetch conditions (device conditions for buyback) - BUYBACK SPECIFIC
    fetchConditions: async (deviceId) => {
      try {
        console.log('📞 BuybackService: fetchConditions for device:', deviceId);

        if (!deviceId) {
          console.warn('⚠️ BuybackService: No deviceId provided');
          return [];
        }

        // Use conditions endpoint if available, otherwise fallback
        const result = (await apiService.fetchConditions?.()) || [];
        console.log(
          '✅ BuybackService: conditions loaded:',
          result?.length || 0
        );
        return result;
      } catch (error) {
        console.error('❌ BuybackService: fetchConditions failed:', error);
        return apiService.getFallbackConditions?.() || [];
      }
    },

    // Fetch price for buyback - DIFFERENT INTERFACE
    fetchPrice: async (conditionId, deviceId = null) => {
      try {
        console.log(
          '📞 BuybackService: fetchPrice for condition:',
          conditionId,
          'device:',
          deviceId
        );

        if (!conditionId) {
          console.warn('⚠️ BuybackService: No conditionId provided');
          return null;
        }

        // For buyback, we might need device info in the price calculation
        const result = deviceId
          ? await apiService.fetchPrice(deviceId, conditionId)
          : await apiService.fetchPrice(conditionId);

        console.log('✅ BuybackService: price loaded:', result);
        return result;
      } catch (error) {
        console.error('❌ BuybackService: fetchPrice failed:', error);
        return (
          apiService.getFallbackPrice?.(deviceId, conditionId) || {
            price: 0,
            currency: 'EUR',
          }
        );
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
        }
      }

      console.log('✅ Service interface test completed successfully');
      return true;
    } catch (error) {
      console.error('❌ Service interface test failed:', error);
      return false;
    }
  };

  console.log('🔧 StoryblokComponent service testing:');
  console.log(
    '  - window.testMuchandyHeroServices() - Test service interfaces'
  );
}

console.log('✅ StoryblokComponent with fixed service interface ready!');
