import { createElement } from 'svarog-ui-core';
import { router } from '../utils/router.js';
import createPage from './Page.js';

console.log('=== APP.JS LOADING ===');

const createApp = () => {
  console.log('Creating app instance...');

  let element = null;
  let currentPage = null;
  let pageContainer = null;
  let themeLoaded = false;

  // Force load and apply Muchandy theme
  const initTheme = async () => {
    if (themeLoaded) return;

    try {
      console.log('Loading Muchandy theme module...');

      // Import the theme module
      const themeModule = await import('@svarog-ui/theme-muchandy');
      console.log('Theme module loaded:', themeModule);

      // Apply the theme using its apply method
      if (themeModule.default && themeModule.default.apply) {
        console.log('Applying theme via default.apply()...');
        themeModule.default.apply();
        themeLoaded = true;
        console.log('✅ Muchandy theme applied successfully');
      } else if (themeModule.muchandyTheme && themeModule.muchandyTheme.apply) {
        console.log('Applying theme via muchandyTheme.apply()...');
        themeModule.muchandyTheme.apply();
        themeLoaded = true;
        console.log('✅ Muchandy theme applied successfully');
      } else {
        console.error('Theme module structure:', {
          hasDefault: !!themeModule.default,
          defaultKeys: themeModule.default
            ? Object.keys(themeModule.default)
            : [],
          moduleKeys: Object.keys(themeModule),
        });
        throw new Error('Theme module does not have apply method');
      }

      // Verify theme variables are loaded
      setTimeout(() => {
        const buttonBg = getComputedStyle(
          document.documentElement
        ).getPropertyValue('--button-bg');
        const brandPrimary = getComputedStyle(
          document.documentElement
        ).getPropertyValue('--color-brand-primary');
        console.log('Theme verification:');
        console.log('  --button-bg:', buttonBg || 'NOT FOUND');
        console.log('  --color-brand-primary:', brandPrimary || 'NOT FOUND');

        // Check if theme classes were applied
        console.log(
          '  Theme classes on html:',
          document.documentElement.className
        );
        console.log('  Theme classes on body:', document.body.className);
      }, 100);
    } catch (error) {
      console.error('❌ Failed to load theme:', error);

      // Fallback: inject theme CSS directly
      try {
        console.log('Attempting fallback CSS injection...');
        const style = document.createElement('style');
        style.id = 'muchandy-theme-fallback';
        style.textContent = `
          :root {
            --color-brand-primary: #ff7f50;
            --color-brand-primary-dark: #cc643f;
            --color-brand-primary-light: #ffa07a;
            --color-brand-secondary: #4aa2d9;
            --button-bg: transparent;
            --button-color: var(--color-brand-primary);
            --button-border: 2px solid var(--color-brand-primary);
            --button-radius: 0;
            --button-padding: 0.5rem 1.25rem;
            --button-primary-bg: var(--color-brand-primary);
            --button-primary-color: white;
            --button-secondary-bg: var(--color-brand-secondary);
            --button-secondary-color: white;
          }
        `;
        document.head.appendChild(style);
        console.log('✅ Fallback styles injected');
      } catch (fallbackError) {
        console.error('❌ Fallback injection failed:', fallbackError);
      }
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
          color: '#dc3545',
          border: '1px solid #dc3545',
          margin: '1rem',
          borderRadius: '4px',
          background: '#f8d7da',
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
              createElement('pre', {
                text: error.stack,
                style: { fontSize: '0.8rem', overflow: 'auto' },
              }),
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

    // Initialize theme first
    await initTheme();

    // Create app container
    element = createElement('div', {
      classes: ['app'],
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

    // Render app (which includes theme loading)
    await render();

    // Handle initial route
    router.handleRoute();

    return element;
  };

  return {
    getElement: async () => {
      if (!element) {
        await init();
      }
      return element;
    },
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
