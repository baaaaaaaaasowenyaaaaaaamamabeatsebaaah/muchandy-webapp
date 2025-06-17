// src/components/StoryblokComponent.js - Fixed service interface compatibility
import {
  Button,
  Card,
  BlogCard,
  ContactInfo,
  Form,
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

  // Get API service through service coordinator
  let apiService;
  try {
    apiService = serviceCoordinator.get('api');
  } catch (error) {
    console.error('❌ API service not available:', error.message);
    return createErrorHeroContainer(blok, error);
  }

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

// All other component renderers remain unchanged from original
function renderHero(blok) {
  console.log('🎯 Rendering standard hero:', blok);

  const heroElement = createElement('section', {
    className: 'svarog-hero',
    style: {
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-8, 2rem) var(--space-4, 1rem)',
      textAlign: 'center',
      background: blok.background_image?.filename
        ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${blok.background_image.filename})`
        : 'var(--color-primary, #FF6B35)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: 'white',
    },
  });

  const children = [];

  if (blok.title) {
    children.push(
      createElement('h1', {
        className: 'svarog-hero__title',
        innerHTML: blok.title,
        style: {
          fontSize: 'clamp(2rem, 5vw, 4rem)',
          fontWeight: '700',
          margin: '0 0 1rem 0',
          lineHeight: '1.2',
        },
      })
    );
  }

  if (blok.subtitle) {
    children.push(
      createElement('p', {
        className: 'svarog-hero__subtitle',
        textContent: blok.subtitle,
        style: {
          fontSize: 'clamp(1rem, 3vw, 1.5rem)',
          margin: '0 0 2rem 0',
          opacity: '0.9',
          lineHeight: '1.4',
        },
      })
    );
  }

  if (blok.cta_text && blok.cta_link?.url) {
    try {
      const ctaButton = Button({
        children: blok.cta_text,
        variant: 'secondary',
        size: 'large',
        className: 'hero-cta-button',
        onClick: (e) => {
          if (blok.cta_link.url.startsWith('http')) {
            window.open(blok.cta_link.url, blok.cta_link.target || '_self');
          } else {
            e.preventDefault();
            router.navigate(blok.cta_link.url);
          }
        },
      });
      children.push(ctaButton.getElement());
    } catch (error) {
      console.error('❌ Error creating CTA button:', error);
    }
  }

  children.forEach((child) => heroElement.appendChild(child));

  return {
    getElement: () => heroElement,
    update: () => {},
    destroy: () => heroElement.remove(),
  };
}

function renderSection(blok) {
  const sectionElement = createElement('section', {
    className: 'svarog-section',
    style: {
      padding: 'var(--space-8, 2rem) var(--space-4, 1rem)',
      maxWidth: '1200px',
      margin: '0 auto',
    },
  });

  if (blok.title) {
    sectionElement.appendChild(
      createElement('h2', {
        textContent: blok.title,
        style: {
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
          fontWeight: '700',
          margin: '0 0 1rem 0',
          color: 'var(--color-primary, #FF6B35)',
        },
      })
    );
  }

  if (blok.subtitle) {
    sectionElement.appendChild(
      createElement('p', {
        textContent: blok.subtitle,
        style: {
          fontSize: '1.125rem',
          margin: '0 0 2rem 0',
          opacity: '0.8',
        },
      })
    );
  }

  if (blok.content && blok.content.length > 0) {
    const contentContainer = createElement('div', {
      className: 'section-content',
      style: {
        display: 'grid',
        gap: 'var(--space-6, 1.5rem)',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      },
    });

    blok.content.forEach((nestedBlok) => {
      try {
        const nestedComponent = renderStoryblokComponent(nestedBlok);
        if (nestedComponent) {
          contentContainer.appendChild(nestedComponent.getElement());
        }
      } catch (error) {
        console.error(`Error rendering nested component:`, error);
      }
    });

    sectionElement.appendChild(contentContainer);
  }

  return {
    getElement: () => sectionElement,
    update: () => {},
    destroy: () => sectionElement.remove(),
  };
}

function renderCard(blok) {
  return Card({
    title: blok.title || 'Untitled',
    description: blok.description || '',
    imageUrl: blok.image?.filename,
    alt: blok.image?.alt || blok.title,
    href: blok.link?.url,
    variant: blok.variant || 'default',
  });
}

function renderBlogCard(blok) {
  return BlogCard({
    title: blok.title || 'Untitled Blog Post',
    description: blok.description || '',
    imageUrl: blok.image?.filename,
    alt: blok.image?.alt || blok.title,
    href: blok.link?.url || '#',
    date: blok.date,
    author: blok.author,
    readTime: blok.read_time,
  });
}

function renderButton(blok) {
  if (!blok.text) {
    throw new Error('Button component requires text prop');
  }

  const variantMap = {
    default: 'primary',
    primary: 'primary',
    secondary: 'secondary',
    tertiary: 'tertiary',
    link: 'link',
    icon: 'icon',
  };

  const sizeMap = {
    small: 'small',
    medium: 'medium',
    large: 'large',
    sm: 'small',
    md: 'medium',
    lg: 'large',
  };

  return Button({
    children: blok.text,
    variant: variantMap[blok.variant] || 'primary',
    size: sizeMap[blok.size] || 'medium',
    disabled: blok.disabled || false,
    className: blok.className,
    onClick: (e) => {
      if (blok.link?.url) {
        if (blok.link.url.startsWith('http')) {
          window.open(blok.link.url, blok.link.target || '_self');
        } else {
          e.preventDefault();
          router.navigate(blok.link.url);
        }
      }
      if (blok.onClick) {
        blok.onClick(e);
      }
    },
  });
}

function renderText(blok) {
  const textElement = createElement('div', {
    className: 'richtext-content',
    innerHTML: blok.text || '',
    style: {
      lineHeight: '1.6',
      margin: '1rem 0',
    },
  });

  return {
    getElement: () => textElement,
    update: () => {},
    destroy: () => textElement.remove(),
  };
}

function renderContactInfo(blok) {
  return ContactInfo({
    phone: blok.phone || '',
    email: blok.email || '',
    address: blok.address || '',
    showMap: blok.show_map || false,
  });
}

function renderForm(blok) {
  return Form({
    title: blok.title || '',
    fields: blok.fields || [],
    submitText: blok.submit_text || 'Submit',
    onSubmit: async (data) => {
      console.log('📝 Form submitted:', data);
      if (blok.endpoint) {
        try {
          const response = await fetch(blok.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            throw new Error('Form submission failed');
          }

          alert(blok.success_message || 'Form submitted successfully!');
        } catch (error) {
          console.error('Form submission error:', error);
          alert(
            blok.error_message || 'Form submission failed. Please try again.'
          );
        }
      }
    },
  });
}

// Component map
const componentMap = {
  hero: renderHero,
  muchandy_hero: renderMuchandyHero, // Our enhanced version
  section: renderSection,
  card: renderCard,
  blog_card: renderBlogCard,
  button: renderButton,
  text: renderText,
  contact_info: renderContactInfo,
  form: renderForm,
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

      const apiService = serviceCoordinator.get('api');
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
