// src/components/StoryblokComponent.js - Fixed async component handling

import { createElement } from '../utils/componentFactory.js';
import { componentRegistry } from './StoryblokComponentRegistry.js';

console.log('=== STORYBLOK COMPONENT RENDERER WITH FIXED ASYNC HANDLING ===');

/**
 * Renders a single Storyblok component - FIXED for async components
 * @param {Object} blok - Storyblok block data
 * @returns {HTMLElement} Rendered component element
 */
export function renderComponent(blok) {
  if (!blok || !blok.component) {
    console.error('Invalid blok:', blok);
    return createElement('div', {
      className: 'storyblok-error',
      textContent: 'Invalid component data',
    });
  }

  const { component } = blok;
  console.log(`🎨 Rendering component: ${component}`);

  try {
    // Special handling for MuchandyHero - direct async loading
    if (component === 'muchandy_hero') {
      console.log('🚀 Creating MuchandyHero with async handling...');

      // Create placeholder
      const placeholder = createElement('div', {
        className: 'muchandy-hero-loading',
        style: {
          minHeight: '500px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f5f5f5 0%, #e0e0e0 100%)',
        },
      });

      placeholder.innerHTML = `
        <div style="text-align: center;">
          <div style="
            width: 60px;
            height: 60px;
            border: 4px solid #ddd;
            border-top-color: #007bff;
            border-radius: 50%;
            margin: 0 auto 20px;
            animation: spin 1s linear infinite;
          "></div>
          <h2 style="color: #333; margin: 0 0 10px 0;">Lade Preisrechner...</h2>
          <p style="color: #666; margin: 0;">Einen Moment bitte</p>
        </div>
        <style>
          @keyframes spin {
            to { transform: rotate(360deg); }
          }
        </style>
      `;

      // Load and initialize asynchronously
      (async () => {
        try {
          console.log('📦 Loading StoryblokMuchandyHero module...');
          const { default: StoryblokMuchandyHero } = await import(
            './StoryblokMuchandyHero.js'
          );

          console.log('🔨 Creating hero instance...');
          const heroWrapper = StoryblokMuchandyHero(blok);

          console.log('⏳ Getting hero element...');
          const heroElement = heroWrapper.getElement();

          console.log('🔄 Replacing placeholder with hero...');
          // CRITICAL FIX: Ensure we're in the DOM before replacing
          if (placeholder.parentNode) {
            placeholder.parentNode.replaceChild(heroElement, placeholder);
            console.log('✅ Hero successfully inserted into DOM');
          } else {
            console.error('❌ Placeholder has no parent - cannot insert hero');
          }
        } catch (error) {
          console.error('❌ Failed to load MuchandyHero:', error);

          if (placeholder.parentNode) {
            placeholder.innerHTML = `
              <div style="padding: 2rem; background: #fee; border: 1px solid #fcc; border-radius: 4px; margin: 1rem 0;">
                <h3 style="color: #c00;">Failed to load MuchandyHero</h3>
                <p>${error.message}</p>
              </div>
            `;
          }
        }
      })();

      return placeholder;
    }

    // Use registry for other components
    const instance = componentRegistry.create(component, blok);
    return instance.getElement();
  } catch (error) {
    console.error(`Error rendering component ${component}:`, error);
    return renderErrorComponent(component, error);
  }
}

/**
 * Renders an error component
 */
function renderErrorComponent(componentType, error) {
  const errorElement = createElement('div', {
    className: 'storyblok-error-component',
    style: {
      padding: '1rem',
      background: '#fee',
      border: '1px solid #fcc',
      borderRadius: '4px',
      color: '#c00',
      margin: '1rem 0',
    },
  });

  errorElement.innerHTML = `
    <h4>Error rendering component: ${componentType}</h4>
    <p>${error.message}</p>
  `;

  return errorElement;
}

/**
 * Renders multiple components - FIXED to handle async properly
 * @param {Array} components - Array of component blocks
 * @returns {DocumentFragment} Document fragment containing all rendered elements
 */
export function renderStoryblokComponents(components) {
  console.log('=== RENDERING COMPONENTS ===');
  console.log('Components to render:', components?.length || 0);

  if (!components || !Array.isArray(components) || components.length === 0) {
    console.warn('No components to render');
    return document.createDocumentFragment();
  }

  const fragment = document.createDocumentFragment();

  components.forEach((component, index) => {
    console.log(`Rendering component ${index + 1}:`, component.component);

    try {
      const element = renderComponent(component);
      if (element) {
        // Ensure async components get properly tracked
        element.setAttribute('data-component-index', index);
        element.setAttribute('data-component-type', component.component);
        fragment.appendChild(element);
      }
    } catch (error) {
      console.error('Component rendering failed:', error);
      fragment.appendChild(renderErrorComponent(component.component, error));
    }
  });

  console.log('✅ Component rendering complete');
  return fragment;
}

// Export everything
export default {
  renderComponent,
  renderStoryblokComponents,
};

console.log('✅ StoryblokComponent renderer ready with fixed async handling');
