import './styles/global.css';
import createApp from './components/App.js';

console.log('=== MAIN.JS START ===');
console.log('Document ready state:', document.readyState);
console.log('Window loaded:', window.document !== undefined);

try {
  console.log('Creating app...');
  const app = createApp();
  console.log('App created:', app);

  console.log('Getting app element...');
  const appElement = app.getElement();
  console.log('App element:', appElement);

  console.log('Appending to body...');
  document.body.appendChild(appElement);
  console.log('App successfully mounted to body');

  // Debug body content
  console.log('Body innerHTML length:', document.body.innerHTML.length);
  console.log('Body children count:', document.body.children.length);
} catch (error) {
  console.error('=== ERROR IN MAIN.JS ===');
  console.error('Error details:', error);
  console.error('Stack trace:', error.stack);
}

// Handle cleanup on page unload
window.addEventListener('beforeunload', () => {
  console.log('Page unloading, cleaning up...');
});

// Development hot reload support
if (import.meta.hot) {
  console.log('Hot reload enabled');
  import.meta.hot.accept();
}

console.log('=== MAIN.JS END ===');
