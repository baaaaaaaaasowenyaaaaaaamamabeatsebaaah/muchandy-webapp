// src/main.js - Enhanced with new initialization sequence
import './styles/global.css';
import createApp from './components/App.js';
import { appState } from './utils/stateStore.js';
import { serviceCoordinator } from './utils/serviceCoordinator.js';

console.log('=== MAIN.JS WITH NEW INITIALIZATION SEQUENCE ===');

// Enhanced app initialization with proper error handling - KISS principle
async function initializeApp() {
  console.log('🚀 Starting enhanced app initialization...');

  // Track initialization in state
  appState.set('app.status', 'initializing');
  appState.set('app.startTime', Date.now());

  try {
    // Create app instance
    console.log('📦 Creating app instance...');
    const app = createApp();

    // Store app reference for debugging
    if (import.meta.env.DEV) {
      window.muchandyApp = app;
    }

    // Get app element (triggers full initialization)
    console.log('🔄 Initializing app with phased loading...');
    const appElement = await app.getElement();

    if (!appElement) {
      throw new Error('App initialization returned no element');
    }

    // Clear any existing content
    document.body.innerHTML = '';

    // Mount app to DOM
    console.log('🎯 Mounting app to DOM...');
    document.body.appendChild(appElement);

    // Mark as ready
    appState.set('app.status', 'ready');
    const loadTime = Date.now() - appState.get('app.startTime');
    console.log(`✅ App successfully initialized in ${loadTime}ms`);

    // Log initial state
    if (import.meta.env.DEV) {
      console.log('📊 Initial app state:', app.getState());
    }

    // Setup cleanup on page unload
    window.addEventListener('beforeunload', () => {
      console.log('🧹 Page unloading, cleaning up...');
      app.destroy();
      serviceCoordinator.clear();
    });

    // Return app for further use
    return app;
  } catch (error) {
    console.error('❌ APP INITIALIZATION FAILED:', error);
    console.error('Stack trace:', error.stack);

    // Update state with error
    appState.set('app.status', 'error');
    appState.set('app.error', {
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
    });

    // Show enhanced error page
    showErrorPage(error);

    throw error;
  }
}

// Enhanced error page display - Economy of Expression
function showErrorPage(error) {
  const errorHTML = `
    <div style="
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #ff7f50, #ffa07a);
      color: white;
      text-align: center;
    ">
      <div style="
        background: rgba(255, 255, 255, 0.1);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 12px;
        padding: 3rem;
        max-width: 600px;
        box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
      ">
        <h1 style="margin: 0 0 1rem 0; font-size: 2rem; font-weight: 700;">
          Muchandy App Fehler
        </h1>
        <p style="margin: 0 0 1.5rem 0; font-size: 1.1rem; opacity: 0.9;">
          Die Anwendung konnte nicht gestartet werden.
        </p>
        <details style="text-align: left; margin: 1.5rem 0;">
          <summary style="cursor: pointer; font-weight: 600; margin-bottom: 1rem;">
            Technische Details
          </summary>
          <div style="
            background: rgba(0, 0, 0, 0.2);
            padding: 1rem;
            border-radius: 8px;
            font-family: monospace;
            font-size: 0.9rem;
            overflow-x: auto;
          ">
            <strong>Fehler:</strong> ${error.message}<br><br>
            <strong>Phase:</strong> ${appState.get('app.phase') || 'initialization'}<br><br>
            <strong>Services:</strong> ${JSON.stringify(serviceCoordinator.getStats().services, null, 2)}<br><br>
            <strong>Stack Trace:</strong><br>
            <pre style="margin: 0; white-space: pre-wrap; word-break: break-word;">
${error.stack}
            </pre>
          </div>
        </details>
        <button onclick="window.location.reload()" style="
          background: white;
          color: #ff7f50;
          border: none;
          padding: 0.75rem 2rem;
          border-radius: 6px;
          font-size: 1rem;
          font-weight: 600;
          cursor: pointer;
          transition: all 0.2s ease;
          margin-top: 1rem;
        " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
          Seite neu laden
        </button>
      </div>
    </div>
  `;

  document.body.innerHTML = errorHTML;
}

// Start app when DOM is ready - Algorithmic Elegance
if (document.readyState === 'loading') {
  console.log('⏳ Waiting for DOM...');
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  console.log('✅ DOM ready, initializing immediately...');
  initializeApp();
}

// Development helpers and debugging - Maximum Conciseness
if (import.meta.env.DEV) {
  // Hot reload support
  if (import.meta.hot) {
    console.log('🔥 Hot reload enabled');
    import.meta.hot.accept();
  }

  // Global error handler for debugging
  window.addEventListener('error', (event) => {
    console.error('🚨 Global error:', event.error);
    console.error('Error in:', event.filename);
    console.error('Line:', event.lineno, 'Column:', event.colno);
  });

  // Unhandled promise rejection handler
  window.addEventListener('unhandledrejection', (event) => {
    console.error('🚨 Unhandled promise rejection:', event.reason);
  });

  // Debug helpers
  window.debugApp = () => {
    console.group('🔍 App Debug Information');
    console.log('App Status:', appState.get('app.status'));
    console.log('App State:', appState.get('app'));
    console.log('Services:', serviceCoordinator.getStats());
    console.log('All State:', appState.getSnapshot());
    console.groupEnd();
  };

  window.debugServices = () => {
    console.group('🔍 Service Debug Information');
    const stats = serviceCoordinator.getStats();
    console.table(stats.services);
    console.log('Loaded:', stats.loaded);
    console.log('Failed:', stats.failed);
    console.groupEnd();
  };

  window.restartApp = async () => {
    console.log('🔄 Restarting app...');

    // Clear everything
    document.body.innerHTML = '';
    serviceCoordinator.clear();
    appState.clear();

    // Reinitialize
    await initializeApp();
  };

  // Automatic state logging
  appState.subscribe('app.phase', (phase) => {
    console.log(`📊 App phase changed to: ${phase}`);
  });

  appState.subscribe('app.error', (error) => {
    if (error) {
      console.error('📊 App error recorded:', error);
    }
  });

  console.log('🔧 Development helpers available:');
  console.log('  - window.muchandyApp - App instance');
  console.log('  - window.debugApp() - Show app debug info');
  console.log('  - window.debugServices() - Show service status');
  console.log('  - window.restartApp() - Restart the application');
  console.log('  - window.appState - Direct state access');
  console.log('  - window.serviceCoordinator - Service coordinator');
}

console.log('=== MAIN.JS READY ===');
