// src/main.js
/**
 * @file Main application entry point with enhanced initialization
 * @description Bootstraps the Muchandy webapp with phased loading
 */

import { appState } from './utils/stateStore.js';
import { EnhancedApp } from './components/App.js';
import { ApiStatusBanner } from './components/LoadingStates.js';

console.log('=== MAIN.JS WITH NEW INITIALIZATION SEQUENCE ===');

/**
 * Show error page
 */
function showErrorPage(message) {
  const root = document.getElementById('app');
  root.innerHTML = `
    <div style="display: flex; align-items: center; justify-content: center; min-height: 100vh; padding: 20px;">
      <div style="text-align: center; max-width: 600px;">
        <h1 style="color: #dc3545; margin-bottom: 20px;">Application Error</h1>
        <p style="color: #666; margin-bottom: 30px;">${message}</p>
        <button onclick="window.location.reload()" style="
          background: #007bff;
          color: white;
          border: none;
          padding: 10px 20px;
          border-radius: 4px;
          cursor: pointer;
          font-size: 16px;
        ">Reload Page</button>
      </div>
    </div>
  `;
}

/**
 * Initialize the application
 */
async function initializeApp() {
  console.log('🚀 Starting enhanced app initialization...');

  // Update initial state
  appState.set('app.status', 'initializing');
  appState.set('app.startTime', Date.now());

  try {
    // Create app
    console.log('📦 Creating app instance...');
    const app = new EnhancedApp();
    console.log('🚀 Enhanced App created');

    // Initialize with phased loading
    console.log('🔄 Initializing app with phased loading...');
    const appElement = await app.getElement();

    if (!appElement) {
      console.error('❌ Failed to create app element');
      showErrorPage('Failed to initialize application');
      return;
    }

    // Mount to DOM
    console.log('🎯 Mounting app to DOM...');
    const root = document.getElementById('app');
    if (!root) {
      console.error('❌ Root element not found');
      showErrorPage('Application mount point not found');
      return;
    }

    root.innerHTML = '';
    root.appendChild(appElement);

    // Add API status banner
    const statusBanner = ApiStatusBanner();
    const bannerElement = statusBanner.getElement();
    if (bannerElement) {
      document.body.appendChild(bannerElement);
    }

    // Update state
    appState.set('app.status', 'ready');

    const loadTime = Date.now() - appState.get('app.startTime');
    console.log(`✅ App successfully initialized in ${loadTime}ms`);

    // Store references for development
    if (typeof window !== 'undefined') {
      window.muchandyApp = app;
      window.apiStatusBanner = statusBanner;
    }

    // Log initial state
    console.log('📊 Initial app state:', appState.get('app'));

    // Set up hot reload in development
    if (import.meta.hot) {
      import.meta.hot.accept(() => {
        console.log('🔥 Hot reload triggered');
        window.location.reload();
      });
    }
  } catch (error) {
    console.error('❌ Fatal initialization error:', error);
    showErrorPage(`Initialization failed: ${error.message}`);
    appState.set('app.status', 'error');
    appState.set('app.error', error.message);
  }
}

/**
 * Restart the application
 */
async function restartApp() {
  console.log('🔄 Restarting application...');

  // Clear state
  appState.set('app.status', 'restarting');

  // Destroy current app
  if (window.muchandyApp?.destroy) {
    window.muchandyApp.destroy();
  }

  // Clear API cache
  if (window.apiService?.clearCache) {
    window.apiService.clearCache();
  }

  // Reinitialize
  await initializeApp();
}

/**
 * Start the application when DOM is ready
 */
function startApp() {
  // Check if DOM is already loaded
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeApp);
  } else {
    // DOM is already ready
    console.log('✅ DOM ready, initializing immediately...');
    initializeApp();
  }
}

// Development helpers
if (typeof window !== 'undefined') {
  window.restartApp = restartApp;
  window.debugApp = () => {
    console.log('=== APP DEBUG INFO ===');
    console.log('App State:', appState.get('app'));
    console.log('Services:', appState.get('services'));
    console.log('API Health:', appState.get('api.health'));
    console.log('Components:', appState.get('components'));
    console.log('===================');
  };

  window.debugServices = () => {
    const services = appState.get('services') || {};
    console.log('=== SERVICE STATUS ===');
    Object.entries(services).forEach(([name, service]) => {
      console.log(`${name}:`, {
        ready: service.ready || false,
        loading: service.loading || false,
        error: service.error || null,
      });
    });
    console.log('===================');
  };

  console.log('🔥 Hot reload enabled');
  console.log('🔧 Development helpers available:');
  console.log('   - window.muchandyApp - App instance');
  console.log('   - window.debugApp() - Show app debug info');
  console.log('   - window.debugServices() - Show service status');
  console.log('   - window.restartApp() - Restart the application');
  console.log('   - window.appState - Direct state access');
  console.log('   - window.serviceCoordinator - Service coordinator');
}

// Start the app
startApp();

console.log('=== MAIN.JS READY ===');
