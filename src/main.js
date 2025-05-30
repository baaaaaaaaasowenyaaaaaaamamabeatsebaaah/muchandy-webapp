import './styles/global.css';
import createApp from './components/App.js';

console.log('=== MAIN.JS START ===');

async function initializeApp() {
  try {
    console.log('Creating app...');
    const app = createApp();

    console.log('Getting app element...');
    const appElement = await app.getElement(); // Add await here!

    console.log('Appending to body...');
    document.body.appendChild(appElement);
    console.log('✅ App successfully mounted');

    // Handle cleanup on page unload
    window.addEventListener('beforeunload', () => {
      console.log('Page unloading, cleaning up...');
      app.destroy();
    });
  } catch (error) {
    console.error('=== ERROR IN MAIN.JS ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);

    // Show error in page
    document.body.innerHTML = `
      <div style="padding: 2rem; color: red; border: 2px solid red; margin: 2rem; border-radius: 8px;">
        <h1>Application Error</h1>
        <p><strong>Error:</strong> ${error.message}</p>
        <pre style="overflow: auto;">${error.stack}</pre>
      </div>
    `;
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
