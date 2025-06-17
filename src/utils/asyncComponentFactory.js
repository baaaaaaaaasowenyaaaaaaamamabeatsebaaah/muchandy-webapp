// src/utils/asyncComponentFactory.js - Async component factory with loading states
/**
 * @file Async-aware component factory that handles loading states
 * @description Extends Svarog patterns for async component initialization
 */

import { createElement } from 'svarog-ui-core';

console.log('=== ASYNC COMPONENT FACTORY LOADING ===');

/**
 * Creates an async component wrapper - KISS principle
 * @param {Function} componentFactory - Factory that returns component or promise
 * @param {Object} options - Configuration options
 * @returns {Object} Component API with async support
 */
export function createAsyncComponent(componentFactory, options = {}) {
  const {
    loadingComponent = () => createDefaultLoadingElement(),
    errorComponent = (error) => createDefaultErrorElement(error),
    onError = (error) => console.error('Async component error:', error),
  } = options;

  let element = null;
  let component = null;
  let state = 'initial'; // initial, loading, ready, error
  let error = null;
  let destroyed = false;

  // Create container element - Economy of Expression
  const getElement = () => {
    if (!element) {
      element = createElement('div', {
        className: 'async-component-wrapper',
        'data-state': state,
      });

      // Start initialization
      initialize();
    }
    return element;
  };

  // Initialize component - Algorithmic Elegance
  const initialize = async () => {
    if (destroyed || state !== 'initial') return;

    state = 'loading';
    element.setAttribute('data-state', state);

    // Show loading state
    element.innerHTML = '';
    element.appendChild(loadingComponent());

    try {
      // Create component (may be async)
      const result = await Promise.resolve(componentFactory());

      if (destroyed) return;

      // Validate component API
      if (!result || typeof result.getElement !== 'function') {
        throw new Error('Invalid component: must have getElement() method');
      }

      component = result;
      state = 'ready';
      element.setAttribute('data-state', state);

      // Replace loading with actual component
      const componentElement = component.getElement();
      element.innerHTML = '';
      element.appendChild(componentElement);
    } catch (err) {
      if (destroyed) return;

      error = err;
      state = 'error';
      element.setAttribute('data-state', state);

      // Show error state
      element.innerHTML = '';
      element.appendChild(errorComponent(err));

      onError(err);
    }
  };

  // Update component - KISS approach
  const update = (props) => {
    if (destroyed) return;

    if (component && state === 'ready') {
      component.update?.(props);
    }
  };

  // Destroy component - Maximum Conciseness
  const destroy = () => {
    if (destroyed) return;

    destroyed = true;
    component?.destroy?.();
    element?.remove();
    element = null;
    component = null;
  };

  // Retry failed initialization
  const retry = () => {
    if (destroyed || state !== 'error') return;

    state = 'initial';
    error = null;
    initialize();
  };

  return {
    getElement,
    update,
    destroy,
    retry,
    getState: () => ({ state, error }),
    getComponent: () => component,
  };
}

/**
 * Default loading element - Economy of Expression
 */
function createDefaultLoadingElement() {
  return createElement('div', {
    className: 'async-loading',
    style: {
      padding: '2rem',
      textAlign: 'center',
      color: '#666',
    },
    innerHTML: `
      <div style="
        width: 40px;
        height: 40px;
        border: 3px solid #f3f3f3;
        border-top: 3px solid #007bff;
        border-radius: 50%;
        margin: 0 auto 1rem;
        animation: spin 1s linear infinite;
      "></div>
      <p>Loading component...</p>
      <style>
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      </style>
    `,
  });
}

/**
 * Default error element - KISS principle
 */
function createDefaultErrorElement(error) {
  const errorEl = createElement('div', {
    className: 'async-error',
    style: {
      padding: '2rem',
      background: '#fee',
      border: '1px solid #fcc',
      borderRadius: '4px',
      color: '#c00',
      margin: '1rem 0',
    },
  });

  errorEl.innerHTML = `
    <h3 style="margin: 0 0 0.5rem 0;">Component Load Error</h3>
    <p style="margin: 0;">${error.message || 'Failed to load component'}</p>
  `;

  return errorEl;
}

// Export for development
if (import.meta.env.DEV) {
  window.createAsyncComponent = createAsyncComponent;
}

console.log('✅ Async Component Factory ready');
