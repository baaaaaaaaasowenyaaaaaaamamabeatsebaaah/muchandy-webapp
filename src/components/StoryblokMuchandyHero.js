// src/components/StoryblokMuchandyHero.js

import {
  MuchandyHero,
  PhoneRepairFormContainer,
  UsedPhonePriceFormContainer,
} from 'svarog-ui-core';

import { createElement } from '../utils/componentFactory.js';
import { appState } from '../utils/stateStore.js'; // ADD THIS IMPORT

/**
 * @file StoryblokMuchandyHero - Wrapper for MuchandyHero with service integration
 * @description Handles async initialization of forms and services for MuchandyHero
 */

console.log('=== STORYBLOK MUCHANDY HERO WRAPPER ===');

/**
 * Creates a MuchandyHero component with integrated services
 * @param {Object} props - Component props from Storyblok
 * @returns {Object} Component API
 */
export function StoryblokMuchandyHero(props = {}) {
  const {
    // Hero props from Storyblok
    background_image, // Storyblok uses this
    title = 'Finden Sie<br>Ihren Preis',
    subtitle = 'Jetzt Preis berechnen.',
    default_tab = 'repair',
    className = '',

    // Callbacks (if passed from Storyblok)
    onRepairPriceChange = () => {},
    onRepairSchedule = () => {},
    onBuybackPriceChange = () => {},
    onBuybackSubmit = () => {},

    // Custom components
    loadingComponent = createLoadingState,
    errorComponent = createErrorState,
  } = props;

  // Handle Storyblok image format
  let backgroundImageUrl = '';
  if (background_image) {
    // Storyblok images can be objects with filename property or direct strings
    backgroundImageUrl =
      typeof background_image === 'string'
        ? background_image
        : background_image.filename || '';
  }

  console.log('🖼️ StoryblokMuchandyHero background mapping:', {
    received: background_image,
    mapped: backgroundImageUrl,
  });

  // Component state
  let container = null;
  let hero = null;
  let repairForm = null;
  let buybackForm = null;
  let apiService = null;
  let isInitialized = false;
  let isDestroyed = false;

  // Create container element
  const createContainer = () => {
    if (!container) {
      container = createElement('div', {
        className: 'storyblok-muchandy-hero-wrapper',
        style: {
          width: '100%',
          minHeight: '400px',
        },
      });
    }
    return container;
  };

  // Default loading state
  function createLoadingState() {
    const loadingEl = createElement('div', {
      className: 'muchandy-hero-loading',
      style: {
        minHeight: '500px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
      },
    });

    loadingEl.innerHTML = `
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
    `;

    return loadingEl;
  }

  // Default error state
  function createErrorState(error) {
    const errorEl = createElement('div', {
      className: 'muchandy-hero-error',
      style: {
        padding: '2rem',
        background: '#fee',
        border: '1px solid #fcc',
        borderRadius: '4px',
        margin: '1rem 0',
      },
    });

    errorEl.innerHTML = `
      <h3 style="color: #c00;">Fehler beim Laden</h3>
      <p>${error.message || 'Ein unerwarteter Fehler ist aufgetreten'}</p>
      <button onclick="window.location.reload()" style="
        margin-top: 1rem;
        padding: 0.5rem 1rem;
        background: #c00;
        color: white;
        border: none;
        border-radius: 4px;
        cursor: pointer;
      ">Seite neu laden</button>
    `;

    return errorEl;
  }

  // Initialize component
  const initialize = async () => {
    console.log('🚀 Initializing StoryblokMuchandyHero...');

    if (isDestroyed) {
      console.warn('Component was destroyed, aborting initialization');
      return;
    }

    // Show loading state
    const containerEl = createContainer();
    const loadingEl = loadingComponent();
    containerEl.innerHTML = '';
    containerEl.appendChild(loadingEl);

    try {
      // Wait for API service
      console.log('⏳ Waiting for API service...');

      // Use imported appState instead of window.appState
      if (appState?.get('services.api.ready')) {
        console.log('✅ API service already ready');
        apiService = appState.get('services.api.instance');
      } else if (appState) {
        // Wait for service to be ready
        apiService = await appState.waitFor('services.api.instance', 10000);
        console.log('✅ API service loaded');
      } else {
        throw new Error('AppState not available');
      }

      // Create forms
      console.log('🔧 Creating forms...');

      repairForm = PhoneRepairFormContainer({
        service: apiService,
        onPriceChange: (price) => {
          console.log('💰 Repair price changed:', price);
          onRepairPriceChange(price);
        },
        onScheduleClick: (repairInfo) => {
          console.log('📅 Repair scheduled:', repairInfo);
          onRepairSchedule(repairInfo);
        },
      });

      buybackForm = UsedPhonePriceFormContainer({
        service: apiService,
        onPriceChange: (price) => {
          console.log('💰 Buyback price changed:', price);
          onBuybackPriceChange(price);
        },
        onSubmit: (formData) => {
          console.log('📤 Buyback submitted:', formData);
          onBuybackSubmit(formData);
        },
      });

      console.log('✅ Forms created successfully');

      // Create hero component
      createHero();

      // Update container
      updateContainer();

      isInitialized = true;
      console.log('✅ StoryblokMuchandyHero initialized successfully');
    } catch (error) {
      console.error('❌ StoryblokMuchandyHero initialization failed:', error);
      const errorEl = errorComponent(error);
      containerEl.innerHTML = '';
      containerEl.appendChild(errorEl);
    }
  };

  // Create hero component
  const createHero = () => {
    console.log(
      '🎨 Creating MuchandyHero with background:',
      backgroundImageUrl
    );

    hero = MuchandyHero({
      backgroundImageUrl, // Now using the correctly mapped URL
      title,
      subtitle,
      defaultTab: default_tab,
      className,
      repairForm,
      buybackForm,
    });

    console.log('✅ MuchandyHero created');
  };

  // Update container content
  const updateContainer = () => {
    if (!container || !hero || isDestroyed) return;

    console.log('📦 Showing hero component...');
    const heroElement = hero.getElement();

    // Store state for debugging (use imported appState)
    if (appState) {
      appState.set('components.muchandy-hero.status', 'ready');
      appState.set('components.muchandy-hero.element', heroElement);
    }

    container.innerHTML = '';
    container.appendChild(heroElement);
    console.log('✅ Hero component added to DOM');
  };

  // Start initialization immediately
  const initPromise = initialize();

  // Component API
  return {
    /**
     * Get the component element
     * @returns {HTMLElement}
     */
    getElement() {
      return createContainer();
    },

    /**
     * Update component props
     * @param {Object} newProps
     */
    update(newProps) {
      if (!hero || isDestroyed) return;

      // Update hero with new props
      const {
        background_image: newBgImage,
        title: newTitle,
        subtitle: newSubtitle,
        className: newClassName,
        default_tab: newDefaultTab,
      } = newProps;

      const updates = {};

      if (newBgImage !== undefined) {
        updates.backgroundImageUrl =
          typeof newBgImage === 'string'
            ? newBgImage
            : newBgImage.filename || '';
      }

      if (newTitle !== undefined) updates.title = newTitle;
      if (newSubtitle !== undefined) updates.subtitle = newSubtitle;
      if (newClassName !== undefined) updates.className = newClassName;
      if (newDefaultTab !== undefined) updates.defaultTab = newDefaultTab;

      hero.update(updates);
    },

    /**
     * Destroy component
     */
    destroy() {
      console.log('🗑️ Destroying StoryblokMuchandyHero...');
      isDestroyed = true;

      if (hero) {
        hero.destroy();
        hero = null;
      }

      if (repairForm) {
        repairForm.destroy();
        repairForm = null;
      }

      if (buybackForm) {
        buybackForm.destroy();
        buybackForm = null;
      }

      if (container) {
        container.remove();
        container = null;
      }

      apiService = null;
      isInitialized = false;
    },

    /**
     * Wait for initialization (for testing)
     */
    async waitForInitialization() {
      return initPromise;
    },

    /**
     * Get initialization status
     */
    isInitialized() {
      return isInitialized;
    },
  };
}

// Also export as default
export default StoryblokMuchandyHero;

console.log('✅ StoryblokMuchandyHero wrapper ready');
