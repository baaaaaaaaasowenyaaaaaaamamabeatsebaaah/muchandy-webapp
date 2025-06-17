// src/components/StoryblokComponent.js - Fixed duplicate export

import { createElement } from '../utils/componentFactory.js';
import { StoryblokMuchandyHero } from './StoryblokMuchandyHero.js';

console.log('=== CLEAN STORYBLOK COMPONENT RENDERER ===');

/**
 * Renders a single Storyblok component
 * @param {Object} blok - Storyblok block data
 * @returns {HTMLElement} Rendered component element
 */
function renderComponent(blok) {
  if (!blok || !blok.component) {
    console.error('Invalid blok:', blok);
    return createElement('div', {
      className: 'storyblok-error',
      textContent: 'Invalid component data',
    });
  }

  const { component } = blok;

  try {
    switch (component) {
      case 'muchandy_hero':
        return renderMuchandyHero(blok);

      default:
        console.warn(`Component type not implemented: ${component}`);
        return renderUnknownComponent(blok);
    }
  } catch (error) {
    console.error(`Error rendering component ${component}:`, error);
    return renderErrorComponent(component, error);
  }
}

/**
 * Render MuchandyHero using our wrapper - Maximum Conciseness
 */
function renderMuchandyHero(blok) {
  console.log('🚀 Rendering MuchandyHero from Storyblok:', blok);

  const hero = StoryblokMuchandyHero({
    // Visual props from Storyblok
    backgroundImageUrl: blok.background_image?.filename || '',
    title: blok.title || 'Finden Sie<br>Ihren Preis',
    subtitle: blok.subtitle || 'Jetzt Preis berechnen.',
    defaultTab: blok.default_tab || 'repair',
    className: blok.css_class || '',

    // Callbacks - can be enhanced based on Storyblok configuration
    onRepairPriceChange: (price) => {
      console.log('💰 Repair price updated:', price);
      // Emit custom event for tracking
      window.dispatchEvent(
        new CustomEvent('muchandy:repair-price', {
          detail: { price, componentId: blok._uid },
        })
      );
    },

    onRepairSchedule: (repairInfo) => {
      console.log('📅 Repair scheduled:', repairInfo);
      // Could open a modal or redirect based on Storyblok config
      if (blok.repair_schedule_url) {
        window.location.href = blok.repair_schedule_url;
      }
    },

    onBuybackPriceChange: (price) => {
      console.log('💰 Buyback price updated:', price);
      // Emit custom event for tracking
      window.dispatchEvent(
        new CustomEvent('muchandy:buyback-price', {
          detail: { price, componentId: blok._uid },
        })
      );
    },

    onBuybackSubmit: (formData) => {
      console.log('📤 Buyback form submitted:', formData);
      // Could submit to an endpoint defined in Storyblok
      if (blok.buyback_submit_url) {
        // Post to configured endpoint
        fetch(blok.buyback_submit_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
        });
      }
    },
  });

  return hero.getElement();
}

/**
 * Renders an unknown component placeholder
 */
function renderUnknownComponent(blok) {
  console.warn(`Unknown component type: ${blok.component}`, blok);

  const placeholder = createElement('div', {
    className: 'storyblok-unknown-component',
    style: {
      padding: '2rem',
      background: '#f8f9fa',
      border: '2px dashed #dee2e6',
      borderRadius: '8px',
      textAlign: 'center',
      margin: '1rem 0',
    },
  });

  placeholder.innerHTML = `
    <h3 style="color: #6c757d; margin: 0 0 1rem 0;">
      📦 Component: ${blok.component}
    </h3>
    <p style="color: #868e96; margin: 0 0 1rem 0;">
      This component type is not yet implemented.
    </p>
    <details style="text-align: left; max-width: 500px; margin: 0 auto;">
      <summary style="cursor: pointer; color: #495057;">Show Component Data</summary>
      <pre style="background: #f1f3f4; padding: 1rem; border-radius: 4px; overflow: auto; font-size: 0.75rem;">
${JSON.stringify(blok, null, 2)}
      </pre>
    </details>
  `;

  return placeholder;
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
 * Renders multiple components
 * @param {Array} components - Array of component blocks
 * @returns {DocumentFragment} Document fragment containing all rendered elements
 */
function renderStoryblokComponents(components) {
  console.log('=== RENDERING COMPONENTS ===');
  console.log('Components to render:', components?.length || 0);

  if (!components || !Array.isArray(components) || components.length === 0) {
    console.warn('No components to render');
    return document.createDocumentFragment();
  }

  const fragment = document.createDocumentFragment();
  const errors = [];

  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    console.log(`=== RENDERING COMPONENT ${i + 1} ===`);
    console.log('Component type:', component.component);

    try {
      const element = renderComponent(component);
      if (element) {
        fragment.appendChild(element);
        console.log(
          `✅ Component ${i + 1} (${component.component}) rendered successfully`
        );
      }
    } catch (error) {
      console.error('❌ Component rendering failed:', error);
      errors.push({ component, error });

      // Add error placeholder
      const errorElement = renderErrorComponent(component.component, error);
      fragment.appendChild(errorElement);
    }
  }

  if (errors.length > 0) {
    console.error('=== COMPONENT RENDERING ERRORS ===');
    errors.forEach(({ component, error }) => {
      console.error(`Component ${component.component}:`, error);
    });
  }

  console.log(
    `✅ Component rendering complete: ${components.length - errors.length} success, ${errors.length} errors`
  );

  return fragment;
}

// Export everything properly - FIXED: removed duplicate named export
export { renderComponent, renderStoryblokComponents };

// Default export
export default {
  renderComponent,
  renderStoryblokComponents,
};

console.log('✅ Clean StoryblokComponent ready for custom implementations!');
