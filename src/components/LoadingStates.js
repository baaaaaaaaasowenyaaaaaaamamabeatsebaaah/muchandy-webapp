// src/components/LoadingStates.js
/**
 * @file Loading states component for API data
 * @description Shows loading, error, and empty states
 */

import { createStyleInjector, css } from 'svarog-ui-core';
import { createElement } from '../utils/componentFactory.js';
import { appState } from '../utils/stateStore.js';

// Styles
const styles = css`
  .loading-container {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: var(--space-8) var(--space-4);
    min-height: 200px;
    text-align: center;
  }

  .loading-spinner {
    width: 48px;
    height: 48px;
    border: 4px solid var(--color-gray-200);
    border-top-color: var(--color-primary);
    border-radius: 50%;
    animation: spin 1s linear infinite;
    margin-bottom: var(--space-4);
  }

  @keyframes spin {
    to {
      transform: rotate(360deg);
    }
  }

  .loading-text {
    font-size: var(--font-size-base);
    color: var(--color-text-secondary);
    margin: 0;
  }

  .error-container {
    background: var(--color-danger-light);
    border: 1px solid var(--color-danger);
    border-radius: var(--radius-md);
    padding: var(--space-4);
    margin: var(--space-4) 0;
  }

  .error-title {
    color: var(--color-danger-dark);
    font-weight: var(--font-weight-semibold);
    margin: 0 0 var(--space-2) 0;
  }

  .error-message {
    color: var(--color-text);
    margin: 0 0 var(--space-3) 0;
  }

  .error-actions {
    display: flex;
    gap: var(--space-2);
    flex-wrap: wrap;
  }

  .retry-button {
    background: var(--color-danger);
    color: white;
    border: none;
    padding: var(--space-2) var(--space-4);
    border-radius: var(--radius-sm);
    cursor: pointer;
    font-size: var(--font-size-sm);
    transition: var(--transition-fast);
  }

  .retry-button:hover {
    background: var(--color-danger-dark);
  }

  .cache-notice {
    font-size: var(--font-size-sm);
    color: var(--color-text-muted);
    font-style: italic;
  }
`;

const injectStyles = createStyleInjector('LoadingStates');

/**
 * Create loading spinner
 */
function createLoadingSpinner(text = 'Loading...') {
  return createElement('div', {
    className: 'loading-container',
    children: [
      createElement('div', { className: 'loading-spinner' }),
      createElement('p', {
        className: 'loading-text',
        textContent: text,
      }),
    ],
  });
}

/**
 * Create error state
 */
function createErrorState(options = {}) {
  const {
    title = 'Connection Error',
    message = 'Unable to load data from server',
    onRetry = null,
    showCache = false,
  } = options;

  const children = [
    createElement('h3', {
      className: 'error-title',
      textContent: title,
    }),
    createElement('p', {
      className: 'error-message',
      textContent: message,
    }),
  ];

  if (showCache) {
    children.push(
      createElement('p', {
        className: 'cache-notice',
        textContent: 'Using cached data. Some information may be outdated.',
      })
    );
  }

  const actions = [];

  if (onRetry) {
    actions.push(
      createElement('button', {
        className: 'retry-button',
        textContent: 'Retry',
        onclick: onRetry,
      })
    );
  }

  actions.push(
    createElement('button', {
      className: 'retry-button',
      textContent: 'Refresh Page',
      onclick: () => window.location.reload(),
    })
  );

  children.push(
    createElement('div', {
      className: 'error-actions',
      children: actions,
    })
  );

  return createElement('div', {
    className: 'error-container',
    children,
  });
}

/**
 * Create loading states component
 */
function LoadingStates(props = {}) {
  const {
    loading = false,
    error = null,
    loadingText = 'Loading...',
    errorTitle = 'Connection Error',
    errorMessage = 'Unable to load data',
    onRetry = null,
    showCache = false,
    children = null,
  } = props;

  // Inject styles
  injectStyles(styles);

  // Show loading state
  if (loading) {
    return createLoadingSpinner(loadingText);
  }

  // Show error state
  if (error) {
    return createErrorState({
      title: errorTitle,
      message: errorMessage,
      error,
      onRetry,
      showCache,
    });
  }

  // Show children or empty state
  return children || createElement('div');
}

/**
 * Create API status banner
 */
function ApiStatusBanner() {
  let element = null;
  let unsubscribe = null;

  const render = () => {
    const health = appState.get('api.health');
    const hasErrors = Object.keys(appState.get('api.errors') || {}).length > 0;

    if (!health || (health.status === 'healthy' && !hasErrors)) {
      return null;
    }

    injectStyles(styles);

    return createElement('div', {
      className: 'error-container',
      style: {
        position: 'fixed',
        top: 'var(--space-4)',
        right: 'var(--space-4)',
        left: 'var(--space-4)',
        maxWidth: '400px',
        marginLeft: 'auto',
        zIndex: '1000',
      },
      children: [
        createElement('h3', {
          className: 'error-title',
          textContent: 'API Connection Issue',
        }),
        createElement('p', {
          className: 'error-message',
          textContent:
            'Some features may be limited. Using cached data where available.',
        }),
        createElement('button', {
          className: 'retry-button',
          textContent: 'Retry Connection',
          onclick: async () => {
            await window.apiService.healthCheck();
            element = render();
            if (element && element.parentNode) {
              element.parentNode.replaceChild(element, element);
            }
          },
        }),
      ],
    });
  };

  // Watch for API health changes
  unsubscribe = appState.subscribe('api.health', () => {
    const newElement = render();
    if (element && element.parentNode) {
      if (newElement) {
        element.parentNode.replaceChild(newElement, element);
        element = newElement;
      } else {
        element.remove();
        element = null;
      }
    } else if (newElement && document.body) {
      document.body.appendChild(newElement);
      element = newElement;
    }
  });

  return {
    getElement: () => element || render(),
    destroy: () => {
      unsubscribe?.();
      element?.remove();
    },
  };
}

export {
  LoadingStates,
  ApiStatusBanner,
  createLoadingSpinner,
  createErrorState,
};
