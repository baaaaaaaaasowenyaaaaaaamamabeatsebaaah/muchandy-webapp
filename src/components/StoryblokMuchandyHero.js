// src/components/StoryblokMuchandyHero.js
/**
 * @file Custom MuchandyHero wrapper for Storyblok integration
 * @description Handles async service loading and form creation
 */

import { createElement, MuchandyHero } from 'svarog-ui-core';
import { appState } from '../utils/stateStore.js';
import { apiService } from '../services/apiService.js';

console.log('=== STORYBLOK MUCHANDY HERO WRAPPER ===');

/**
 * Service adapters to match form expectations - KISS principle
 */
const createRepairServiceAdapter = (api) => ({
  fetchManufacturers: () => api.fetchManufacturers(),
  fetchDevices: (manufacturerId) => api.fetchDevices(manufacturerId),
  fetchActions: (deviceId) => api.fetchActionsByDevice(deviceId),
  fetchPrice: (actionId) => api.fetchPriceByAction(actionId),
});

const createBuybackServiceAdapter = (api) => ({
  fetchManufacturers: () => api.fetchManufacturers(),
  fetchDevices: (manufacturerId) => api.fetchDevices(manufacturerId),
  fetchConditions: (deviceId) => api.fetchConditions(deviceId),
  fetchPrice: (conditionId) => api.fetchPrice(null, conditionId),
});

/**
 * Create loading state component - Economy of Expression
 */
const createLoadingState = () => {
  return createElement('div', {
    className: 'muchandy-hero-loading',
    style: {
      minHeight: '500px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
    },
    innerHTML: `
      <div style="text-align: center;">
        <div style="
          width: 60px;
          height: 60px;
          border: 4px solid #ddd;
          border-top-color: #007bff;
          border-radius: 50%;
          margin: 0 auto 20px;
          animation: spin 1s linear infinite;
        "></div>
        <h2 style="color: #333; margin: 0 0 10px 0;">Lade Preisrechner...</h2>
        <p style="color: #666; margin: 0;">Einen Moment bitte</p>
      </div>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `,
  });
};

/**
 * Create error state component - KISS principle
 */
const createErrorState = (error, onRetry) => {
  const errorEl = createElement('div', {
    className: 'muchandy-hero-error',
    style: {
      minHeight: '500px',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#fee',
      padding: '40px',
    },
  });

  errorEl.innerHTML = `
    <div style="text-align: center; max-width: 500px;">
      <h2 style="color: #c00; margin: 0 0 20px 0;">
        ⚠️ Fehler beim Laden
      </h2>
      <p style="color: #666; margin: 0 0 20px 0;">
        ${error.message || 'Der Preisrechner konnte nicht geladen werden.'}
      </p>
      <button onclick="this.onclick=null" style="
        padding: 12px 24px;
        background: #dc3545;
        color: white;
        border: none;
        border-radius: 4px;
        font-size: 16px;
        cursor: pointer;
      ">
        Erneut versuchen
      </button>
    </div>
  `;

  // Attach retry handler
  const button = errorEl.querySelector('button');
  button.addEventListener('click', onRetry);

  return errorEl;
};

/**
 * StoryblokMuchandyHero Component - Algorithmic Elegance
 */
export function StoryblokMuchandyHero(props = {}) {
  const {
    // Hero props
    backgroundImageUrl = '',
    title = 'Finden Sie<br>Ihren Preis',
    subtitle = 'Jetzt Preis berechnen.',
    defaultTab = 'repair',
    className = '',

    // Callbacks
    onRepairPriceChange = () => {},
    onRepairSchedule = () => {},
    onBuybackPriceChange = () => {},
    onBuybackSubmit = () => {},

    // Custom components
    loadingComponent = createLoadingState,
    errorComponent = createErrorState,
  } = props;

  let container = null;
  let hero = null;
  let repairForm = null;
  let buybackForm = null;
  let isDestroyed = false;
  let currentState = 'loading';

  // Create container
  const getContainer = () => {
    if (!container) {
      container = createElement('div', {
        className: 'storyblok-muchandy-hero-wrapper',
      });
      initialize();
    }
    return container;
  };

  // Initialize component - Maximum Conciseness
  const initialize = async () => {
    console.log('🚀 Initializing StoryblokMuchandyHero...');

    // Show loading state
    showLoading();

    try {
      // Wait for API service
      await waitForApiService();

      // Create forms
      await createForms();

      // Create hero
      createHero();

      // Show hero
      showHero();

      console.log('✅ StoryblokMuchandyHero initialized successfully');
    } catch (error) {
      console.error('❌ StoryblokMuchandyHero initialization failed:', error);
      showError(error);
    }
  };

  // Wait for API service - Economy of Expression
  const waitForApiService = async () => {
    console.log('⏳ Waiting for API service...');

    // Check if already ready
    if (appState.get('services.api.ready')) {
      console.log('✅ API service already ready');
      return;
    }

    // Wait for it
    await appState.waitFor('services.api.ready', 10000);
    console.log('✅ API service ready');
  };

  // Create forms with services - KISS principle
  const createForms = async () => {
    console.log('🔧 Creating forms...');

    // Get API service instance
    const api = appState.get('services.api.instance') || apiService;

    // Create service adapters
    const repairService = createRepairServiceAdapter(api);
    const buybackService = createBuybackServiceAdapter(api);

    // Import form components
    const [{ PhoneRepairFormContainer }, { UsedPhonePriceFormContainer }] =
      await Promise.all([import('svarog-ui-core'), import('svarog-ui-core')]);

    // Create repair form
    repairForm = PhoneRepairFormContainer({
      service: repairService,
      onPriceChange: onRepairPriceChange,
      onScheduleClick: onRepairSchedule,
    });

    // Create buyback form
    buybackForm = UsedPhonePriceFormContainer({
      service: buybackService,
      onPriceChange: onBuybackPriceChange,
      onSubmit: onBuybackSubmit,
    });

    console.log('✅ Forms created successfully');
  };

  // Create hero component
  const createHero = () => {
    console.log('🎨 Creating MuchandyHero...');

    hero = MuchandyHero({
      backgroundImageUrl,
      title,
      subtitle,
      defaultTab,
      className,
      repairForm,
      buybackForm,
    });

    console.log('✅ MuchandyHero created');
  };

  // Show loading state
  const showLoading = () => {
    if (isDestroyed) return;

    currentState = 'loading';
    container.innerHTML = '';
    container.appendChild(loadingComponent());
  };

  // Show error state
  const showError = (error) => {
    if (isDestroyed) return;

    currentState = 'error';
    container.innerHTML = '';
    container.appendChild(errorComponent(error, retry));
  };

  // Show hero
  const showHero = () => {
    if (isDestroyed || !hero) return;

    currentState = 'ready';
    container.innerHTML = '';
    container.appendChild(hero.getElement());
  };

  // Retry initialization
  const retry = async () => {
    console.log('🔄 Retrying initialization...');
    await initialize();
  };

  // Update hero props
  const update = (newProps) => {
    if (isDestroyed) return;

    // Update hero if it exists
    if (hero && currentState === 'ready') {
      // Update visual props directly
      if (newProps.title !== undefined) hero.setTitle(newProps.title);
      if (newProps.subtitle !== undefined) hero.setSubtitle(newProps.subtitle);
      if (newProps.backgroundImageUrl !== undefined) {
        hero.setBackgroundImageUrl(newProps.backgroundImageUrl);
      }
    }
  };

  // Destroy component
  const destroy = () => {
    if (isDestroyed) return;

    console.log('🗑️ Destroying StoryblokMuchandyHero...');

    isDestroyed = true;

    // Destroy forms
    repairForm?.destroy?.();
    buybackForm?.destroy?.();

    // Destroy hero
    hero?.destroy?.();

    // Clear container
    if (container) {
      container.innerHTML = '';
      container = null;
    }

    console.log('✅ StoryblokMuchandyHero destroyed');
  };

  // Return component API
  return {
    getElement: getContainer,
    update,
    destroy,
    retry,
    getState: () => currentState,
  };
}

// Export for StoryblokComponent
export default StoryblokMuchandyHero;

console.log('✅ StoryblokMuchandyHero wrapper ready');
