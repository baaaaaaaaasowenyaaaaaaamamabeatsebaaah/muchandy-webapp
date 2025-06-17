// src/components/StoryblokComponent.js - Clean version without any predefined components

import { createElement } from '../utils/componentFactory.js';

console.log('=== CLEAN STORYBLOK COMPONENT RENDERER ===');

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
    // TODO: Add your component implementations here
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
 * @returns {Promise<DocumentFragment>} Document fragment containing all rendered elements
 */
export async function renderStoryblokComponents(components) {
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
      const element = await renderComponent(component);
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

// Export everything that might be needed
export default {
  renderComponent,
  renderStoryblokComponents,
};

console.log('✅ Clean StoryblokComponent ready for custom implementations!');
