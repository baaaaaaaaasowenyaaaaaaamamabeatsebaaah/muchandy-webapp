// src/components/StoryblokComponent.js

import { appState } from '../utils/stateStore.js';
import { createElement } from '../utils/componentFactory.js';

console.log('=== STORYBLOK COMPONENT WITH FIXED API MAPPING ===');

/**
 * Renders a single Storyblok component
 * @param {Object} blok - Storyblok block data
 * @returns {Promise<HTMLElement>} Rendered component element
 */
export async function renderComponent(blok) {
  if (!blok || !blok.component) {
    console.error('Invalid blok:', blok);
    return createElement('div', {
      className: 'storyblok-error',
      textContent: 'Invalid component data',
    });
  }

  const { component } = blok;

  try {
    // Handle muchandy_hero with our custom wrapper
    if (component === 'muchandy_hero') {
      console.log('🚀 Rendering MuchandyHero with custom wrapper:', blok);

      // Import our custom wrapper
      const { default: createMuchandyHeroWrapper } = await import(
        './MuchandyHeroWrapper.js'
      );

      // Create the wrapper with all props from Storyblok
      const heroWrapper = createMuchandyHeroWrapper({
        title: blok.title || 'Finden Sie<br>Ihren Preis',
        subtitle: blok.subtitle || 'Jetzt Preis berechnen.',
        backgroundImageUrl: blok.background_image?.filename || '',
        defaultTab: blok.default_tab || 'repair',
        blurIntensity:
          blok.blur_intensity !== undefined ? Number(blok.blur_intensity) : 4,
        overlayOpacity:
          blok.overlay_opacity !== undefined
            ? Number(blok.overlay_opacity)
            : 0.3,
        className: blok.class_name || '',

        // Event handlers
        onRepairPriceChange: (data) => {
          console.log('💰 Repair price changed:', data);
          appState.set('forms.repair.lastPrice', data);
        },
        onRepairPriceClick: (data) => {
          console.log('📞 Schedule repair clicked:', data);
          // Handle repair scheduling
          if (data.price && data.deviceName) {
            alert(
              `Reparatur für ${data.deviceName} - Preis: ${data.price.formatted}\nWir rufen Sie zurück!`
            );
          }
        },
        onBuybackPriceChange: (data) => {
          console.log('💰 Buyback price changed:', data);
          appState.set('forms.buyback.lastPrice', data);
        },
        onBuybackPriceSubmit: (data) => {
          console.log('💸 Submit buyback clicked:', data);
          // Handle buyback submission
          if (data.price && data.deviceName) {
            alert(
              `Ankauf für ${data.deviceName} - Preis: ${data.price.formatted}\nVielen Dank für Ihre Anfrage!`
            );
          }
        },
      });

      // Initialize and return element
      const element = await heroWrapper.init();
      console.log('✅ MuchandyHero wrapper created successfully');

      return element;
    }

    // For any other component type, return a placeholder
    console.warn(`Component type not implemented: ${component}`);
    return renderUnknownComponent(blok);
  } catch (error) {
    console.error(`Error rendering component ${component}:`, error);
    return renderErrorComponent(component, error);
  }
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
      background: '#f0f0f0',
      border: '2px dashed #ccc',
      borderRadius: '8px',
      textAlign: 'center',
    },
  });

  placeholder.innerHTML = `
    <h3>Unknown Component: ${blok.component}</h3>
    <p>This component type is not yet implemented.</p>
    <details>
      <summary>Component Data</summary>
      <pre>${JSON.stringify(blok, null, 2)}</pre>
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
 * @returns {Promise<Array<HTMLElement>>} Array of rendered elements
 */
export async function renderComponents(components) {
  console.log('=== RENDERING COMPONENTS ===');
  console.log('Components to render:', components.length);

  const results = [];
  const errors = [];

  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    console.log('=== RENDERING COMPONENT ===');
    console.log('Component type:', component.component);

    try {
      const element = await renderComponent(component);
      results.push(element);
      console.log('✅ Component rendered successfully');
    } catch (error) {
      console.error('❌ Component rendering failed:', error);
      errors.push({ component, error });

      // Add error placeholder
      const errorElement = renderErrorComponent(component.component, error);
      results.push(errorElement);
    }
  }

  console.log(
    `✅ Component ${i + 1} (${component.component}) rendered successfully`
  );

  if (errors.length > 0) {
    console.error('=== COMPONENT RENDERING ERRORS ===');
    errors.forEach(({ component, error }) => {
      console.error(`Component ${component.component}:`, error);
    });
  }

  console.log(
    `✅ Component rendering complete: ${results.length} success, ${errors.length} errors`
  );

  return results;
}

console.log('✅ StoryblokComponent with MuchandyHeroWrapper ready!');
