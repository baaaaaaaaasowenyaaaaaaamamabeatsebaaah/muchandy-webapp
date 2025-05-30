import { createElement, ThemeManager } from 'svarog-ui-core';
import { router } from '../utils/router.js';
import createPage from './Page.js';

console.log('=== APP.JS LOADING ===');

const createApp = () => {
  console.log('Creating app instance...');

  let element = null;
  let currentPage = null;
  let pageContainer = null;

  // Load Muchandy theme using the new pattern
  const loadTheme = async () => {
    console.log('Loading Muchandy theme...');
    try {
      // Try the new API first
      if (ThemeManager && ThemeManager.load) {
        await ThemeManager.load('muchandy');
        console.log('✅ Muchandy theme loaded via ThemeManager');
      } else {
        // Fallback to importing and applying manually
        const MuchandyTheme = await import('@svarog-ui/theme-muchandy');
        if (MuchandyTheme.default && MuchandyTheme.default.apply) {
          MuchandyTheme.default.apply();
          console.log('✅ Muchandy theme applied manually');
        } else if (MuchandyTheme.apply) {
          MuchandyTheme.apply();
          console.log('✅ Muchandy theme applied directly');
        } else {
          throw new Error('Unable to apply Muchandy theme');
        }
      }

      // Verify theme variables are loaded
      const testVar = getComputedStyle(
        document.documentElement
      ).getPropertyValue('--button-bg');
      if (!testVar) {
        console.warn('⚠️ Theme variables may not be loaded correctly');
      } else {
        console.log('✅ Theme variables verified');
      }
    } catch (error) {
      console.error('❌ Error loading Muchandy theme:', error);
    }
  };

  const handleRoute = async (path) => {
    console.log(`=== HANDLING ROUTE: ${path} ===`);

    if (!pageContainer) {
      console.error('❌ Page container not available');
      return;
    }

    // Clean up current page
    if (currentPage) {
      console.log('Destroying previous page...');
      currentPage.destroy();
    }

    // Create new page
    console.log('Creating new page...');
    currentPage = createPage();

    // Determine story slug from path
    const slug = path === '/' ? 'home' : path.substring(1);
    console.log(`Loading story with slug: ${slug}`);

    try {
      await currentPage.loadStory(slug);
      const pageElement = currentPage.getElement();

      pageContainer.innerHTML = '';
      pageContainer.appendChild(pageElement);
      console.log('✅ Page rendered successfully');
    } catch (error) {
      console.error('❌ Route handling error:', error);

      const errorElement = createElement('div', {
        classes: ['error-container'],
        style: {
          padding: '2rem',
          color: 'red',
          border: '1px solid red',
          margin: '1rem',
          borderRadius: '4px',
        },
        children: [
          createElement('h2', { text: 'Error Loading Content' }),
          createElement('p', {
            html: `<strong>Error:</strong> ${error.message}`,
          }),
          createElement('p', { html: `<strong>Path:</strong> ${path}` }),
          createElement('p', { html: `<strong>Slug:</strong> ${slug}` }),
          createElement('details', {
            children: [
              createElement('summary', { text: 'Stack Trace' }),
              createElement('pre', { text: error.stack }),
            ],
          }),
        ],
      });

      pageContainer.innerHTML = '';
      pageContainer.appendChild(errorElement);
    }
  };

  const render = async () => {
    console.log('Rendering app element...');

    // Load theme before rendering
    await loadTheme();

    // Create app container
    element = createElement('div', {
      classes: ['app', 'muchandy-theme'],
    });

    // Create content container
    pageContainer = createElement('div', {
      classes: ['app-content'],
    });

    element.appendChild(pageContainer);
    return element;
  };

  const init = async () => {
    console.log('Initializing app...');

    // Setup router
    router.addRoute('/', handleRoute);
    router.addRoute('*', handleRoute);

    // Render app
    await render();

    // Handle initial route
    router.handleRoute();

    return element;
  };

  return {
    getElement: () => element || init(),
    destroy() {
      console.log('Destroying app...');
      if (currentPage) currentPage.destroy();
      element?.remove();
      element = null;
      pageContainer = null;
    },
  };
};

export default createApp;
