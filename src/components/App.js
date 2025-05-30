import { createElement } from 'svarog-ui-core';
import { router } from '../utils/router.js';
import createPage from './Page.js';
import MuchandyTheme from '@svarog-ui/theme-muchandy';

console.log('=== APP.JS LOADING ===');

const createApp = () => {
  console.log('Creating app instance...');

  let element = null;
  let currentPage = null;
  let pageContainer = null;

  console.log('Applying Muchandy theme...');
  try {
    MuchandyTheme.apply();
    console.log('✅ Muchandy theme applied successfully');
  } catch (error) {
    console.error('❌ Error applying Muchandy theme:', error);
  }

  const handleRoute = async (path) => {
    console.log(`=== HANDLING ROUTE: ${path} ===`);

    if (!pageContainer) {
      console.error('❌ Page container not available');
      return;
    }
    console.log('✅ Page container available');

    // Clean up current page
    if (currentPage) {
      console.log('Destroying previous page...');
      currentPage.destroy();
    }

    // Create new page
    console.log('Creating new page...');
    currentPage = createPage();
    console.log('✅ New page created');

    // Determine story slug from path
    const slug = path === '/' ? 'home' : path.substring(1);
    console.log(`Loading story with slug: ${slug}`);

    try {
      console.log('Loading story from Storyblok...');
      await currentPage.loadStory(slug);
      console.log('✅ Story loaded successfully');

      console.log('Getting page element...');
      const pageElement = currentPage.getElement();
      console.log('✅ Page element retrieved:', pageElement);

      console.log('Clearing page container...');
      pageContainer.innerHTML = '';

      console.log('Appending page element...');
      pageContainer.appendChild(pageElement);
      console.log('✅ Page rendered successfully');
    } catch (error) {
      console.error('❌ Route handling error:', error);
      console.error('Error stack:', error.stack);

      // Show the actual error using correct createElement
      const errorElement = createElement('div', {
        classes: 'error-container',
        style: {
          padding: '2rem',
          color: 'red',
          border: '1px solid red',
          margin: '1rem',
          borderRadius: '4px',
        },
        html: `
          <h2>Error Loading Content</h2>
          <p><strong>Error:</strong> ${error.message}</p>
          <p><strong>Path:</strong> ${path}</p>
          <p><strong>Slug:</strong> ${slug}</p>
          <details>
            <summary>Stack Trace</summary>
            <pre>${error.stack}</pre>
          </details>
        `,
      });

      pageContainer.innerHTML = '';
      pageContainer.appendChild(errorElement);
    }
  };

  const render = () => {
    console.log('Rendering app element...');

    // Create app container using Svarog createElement
    element = createElement('div', {
      classes: ['app', 'muchandy-theme'],
    });
    console.log('✅ App div created with classes:', element.className);

    // Create content container using Svarog createElement
    pageContainer = createElement('div', {
      classes: 'app-content',
    });
    console.log(
      '✅ Content container created with classes:',
      pageContainer.className
    );

    // Append content to app
    element.appendChild(pageContainer);
    console.log('✅ Content container appended to app');

    // Debug the structure
    console.log('Final element structure:');
    console.log('- Element tag:', element.tagName);
    console.log('- Element classes:', element.className);
    console.log('- Element children:', element.children.length);
    console.log('- First child classes:', element.children[0]?.className);

    return element;
  };

  const init = () => {
    console.log('Initializing app...');

    console.log('Setting up router...');
    router.addRoute('/', handleRoute);
    router.addRoute('*', handleRoute);
    console.log('✅ Router routes added');

    console.log('Rendering app...');
    render();
    console.log('✅ App rendered');

    console.log('Handling initial route...');
    router.handleRoute();
    console.log('✅ Initial route handled');

    return element;
  };

  return {
    getElement: () => {
      console.log('getElement called, element exists:', !!element);
      return element || init();
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

console.log('✅ App factory function created');
export default createApp;
