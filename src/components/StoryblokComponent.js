// src/components/StoryblokComponent.js - CORRECTED VERSION

import { createElement } from '../utils/componentFactory.js';
import { StoryblokMuchandyHero } from './StoryblokMuchandyHero.js';

console.log('=== STORYBLOK COMPONENT RENDERER ===');

/**
 * Renders a single Storyblok component
 */
export function renderComponent(blok) {
  console.log('=== RENDERING COMPONENT ===');
  console.log('Component type:', blok.component);

  if (!blok || !blok.component) {
    console.error('Invalid blok:', blok);
    return createElement('div', {
      className: 'storyblok-error',
      textContent: 'Invalid component data',
    });
  }

  try {
    switch (blok.component) {
      case 'muchandy_hero':
        // Simply use our wrapper! - Maximum Conciseness
        console.log('🚀 Creating StoryblokMuchandyHero with data:', blok);

        const hero = StoryblokMuchandyHero({
          // Map Storyblok fields to component props
          backgroundImageUrl: blok.background_image?.filename || '',
          title: blok.title || 'Finden Sie<br>Ihren Preis',
          subtitle: blok.subtitle || 'Jetzt Preis berechnen.',
          defaultTab: blok.default_tab || 'repair',

          // Callbacks (if defined in Storyblok)
          onRepairPriceChange: (price) => {
            console.log('💰 Repair price:', price);
          },
          onRepairSchedule: (info) => {
            console.log('📅 Repair scheduled:', info);
          },
          onBuybackPriceChange: (price) => {
            console.log('💰 Buyback price:', price);
          },
          onBuybackSubmit: (data) => {
            console.log('📤 Buyback submitted:', data);
          },
        });

        return hero.getElement();

      default:
        console.warn(`Component type not implemented: ${blok.component}`);
        return renderUnknownComponent(blok);
    }
  } catch (error) {
    console.error(`Error rendering component ${blok.component}:`, error);
    return renderErrorComponent(blok.component, error);
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
 */
export function renderStoryblokComponents(components) {
  console.log('=== RENDERING COMPONENTS ===');
  console.log('Components to render:', components?.length || 0);

  if (!components || !Array.isArray(components) || components.length === 0) {
    console.warn('No components to render');
    return document.createDocumentFragment();
  }

  const fragment = document.createDocumentFragment();

  for (let i = 0; i < components.length; i++) {
    const component = components[i];
    console.log(`Rendering component ${i + 1}:`, component.component);

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
      const errorElement = renderErrorComponent(component.component, error);
      fragment.appendChild(errorElement);
    }
  }

  console.log('✅ Component rendering complete');
  return fragment;
}

// Development helpers
if (import.meta.env.DEV) {
  window.testMuchandyHeroServices = () => {
    console.log('🧪 Testing MuchandyHero service interfaces...');

    const api = appState.get('services.api.instance') || apiService;
    console.log('API Service:', api);

    const repairAdapter = {
      fetchManufacturers: () => api.fetchManufacturers(),
      fetchDevices: (id) => api.fetchDevices(id),
      fetchActions: (id) => api.fetchActionsByDevice(id),
      fetchPrice: (id) => api.fetchPriceByAction(id),
    };

    console.log('Repair adapter:', repairAdapter);
    return repairAdapter;
  };

  window.debugMuchandyHero = () => {
    const heroStatus = appState.get('components.muchandy-hero');
    console.log('MuchandyHero state:', heroStatus);

    const apiStatus = appState.get('services.api');
    console.log('API service state:', apiStatus);

    const manufacturers = appState.get('api.manufacturers');
    console.log('Loaded manufacturers:', manufacturers?.length);
  };

  console.log('🔧 StoryblokComponent service testing:');
  console.log(
    '  - window.testMuchandyHeroServices() - Test service interfaces'
  );
  console.log('  - window.debugMuchandyHero() - Debug hero state');
}

export default {
  renderComponent,
  renderStoryblokComponents,
};

console.log('✅ StoryblokComponent with correct API mapping ready!');
