// src/main.js - Enhanced version with better error handling
import './styles/global.css';
import createApp from './components/App.js';

console.log('=== MAIN.JS START (Enhanced Version) ===');

async function initializeApp() {
  try {
    console.log('Creating enhanced app...');
    const app = createApp();

    console.log('Getting app element...');
    const appElement = await app.getElement();

    console.log('Appending to body...');
    document.body.appendChild(appElement);
    console.log('✅ Enhanced app successfully mounted');

    // Log initial state
    const appState = app.getState();
    console.log('Initial app state:', appState);

    // Handle cleanup on page unload
    window.addEventListener('beforeunload', () => {
      console.log('Page unloading, cleaning up...');
      app.destroy();
    });

    // Development helpers
    if (import.meta.env.DEV) {
      window.muchandyApp = app;
      console.log('🔧 App exposed to window.muchandyApp for debugging');

      // Test navigation
      window.testNavigation = () => {
        console.log('Testing navigation...');
        app.navigate('/reparatur');
        setTimeout(() => app.navigate('/'), 3000);
      };

      // Test page functionality
      window.testPage = () => {
        const currentPage = app.getCurrentPage();
        if (currentPage) {
          console.log('Current page state:', currentPage.getState());
          console.log(
            'Accessibility report:',
            currentPage.validateAccessibility()
          );
        }
      };

      console.log('🧪 Debug helpers available:');
      console.log('  - window.muchandyApp (app instance)');
      console.log('  - window.testNavigation() (test routing)');
      console.log('  - window.testPage() (test current page)');
    }
  } catch (error) {
    console.error('=== ERROR IN ENHANCED MAIN.JS ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);

    // Show enhanced error page
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
            Die Anwendung konnte nicht geladen werden.
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
          " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            Seite neu laden
          </button>
        </div>
      </div>
    `;

    document.body.innerHTML = errorHTML;
  }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Development hot reload support
if (import.meta.hot) {
  console.log('Hot reload enabled');
  import.meta.hot.accept();
}

console.log('=== MAIN.JS END ===');
