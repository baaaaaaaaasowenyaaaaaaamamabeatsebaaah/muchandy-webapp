// src/components/StoryblokComponentRegistry.js - Component registry with async support
/**
 * @file Central registry for Storyblok components
 * @description Manages component registration and creation
 */

import { createAsyncComponent } from '../utils/asyncComponentFactory.js';

console.log('=== STORYBLOK COMPONENT REGISTRY LOADING ===');

class ComponentRegistry {
  constructor() {
    this.components = new Map();
    this.loaders = new Map();
    console.log('✅ Component Registry initialized');
  }

  /**
   * Register a component factory - KISS principle
   * @param {string} name - Component name (matches Storyblok component type)
   * @param {Function} factory - Factory function that creates the component
   */
  register(name, factory) {
    console.log(`📝 Registering component: ${name}`);
    this.components.set(name, factory);
  }

  /**
   * Register an async component loader - Economy of Expression
   * @param {string} name - Component name
   * @param {Function} loader - Async function that imports and returns factory
   */
  registerAsync(name, loader) {
    console.log(`📝 Registering async component: ${name}`);
    this.loaders.set(name, loader);
  }

  /**
   * Create a component instance - Algorithmic Elegance
   * @param {string} name - Component name
   * @param {Object} props - Component props
   * @returns {Object} Component instance or async wrapper
   */
  create(name, props = {}) {
    console.log(`🔨 Creating component: ${name}`);

    // Check for sync factory first
    if (this.components.has(name)) {
      const factory = this.components.get(name);
      return factory(props);
    }

    // Check for async loader
    if (this.loaders.has(name)) {
      const loader = this.loaders.get(name);

      // Create async component wrapper
      return createAsyncComponent(
        async () => {
          console.log(`⏳ Loading async component: ${name}`);
          const factory = await loader();
          return factory(props);
        },
        {
          loadingComponent: () => this.createLoadingElement(name),
          errorComponent: (error) => this.createErrorElement(name, error),
        }
      );
    }

    // Component not registered
    console.warn(`⚠️ Component not registered: ${name}`);
    return this.createUnknownComponent(name, props);
  }

  /**
   * Check if component is registered
   */
  has(name) {
    return this.components.has(name) || this.loaders.has(name);
  }

  /**
   * Create loading element - Maximum Conciseness
   */
  createLoadingElement(componentName) {
    const el = document.createElement('div');
    el.className = 'storyblok-component-loading';
    el.style.cssText =
      'padding: 2rem; text-align: center; background: #f5f5f5;';
    el.innerHTML = `<p>Loading ${componentName}...</p>`;
    return el;
  }

  /**
   * Create error element
   */
  createErrorElement(componentName, error) {
    const el = document.createElement('div');
    el.className = 'storyblok-component-error';
    el.style.cssText =
      'padding: 1rem; background: #fee; border: 1px solid #fcc; color: #c00;';
    el.innerHTML = `
      <h4>Failed to load: ${componentName}</h4>
      <p>${error.message}</p>
    `;
    return el;
  }

  /**
   * Create unknown component placeholder
   */
  createUnknownComponent(name, _props) {
    return {
      getElement: () => {
        const el = document.createElement('div');
        el.className = 'storyblok-unknown-component';
        el.style.cssText =
          'padding: 2rem; background: #f8f9fa; border: 2px dashed #dee2e6; text-align: center;';
        el.innerHTML = `
          <h3>Unknown Component: ${name}</h3>
          <p>This component is not registered</p>
        `;
        return el;
      },
      update: () => {},
      destroy: () => {},
    };
  }

  /**
   * Get registry stats
   */
  getStats() {
    return {
      sync: this.components.size,
      async: this.loaders.size,
      total: this.components.size + this.loaders.size,
    };
  }
}

// Create singleton instance
export const componentRegistry = new ComponentRegistry();

// Register built-in components - KISS approach
console.log('📝 Registering built-in Storyblok components...');

// Register MuchandyHero as async component
componentRegistry.registerAsync('muchandy_hero', async () => {
  const { default: StoryblokMuchandyHero } = await import(
    './StoryblokMuchandyHero.js'
  );
  return StoryblokMuchandyHero;
});

componentRegistry.registerAsync('contact_section', async () => {
  const { default: StoryblokContactSection } = await import(
    './StoryblokContactSection.js'
  );
  return StoryblokContactSection;
});

// Development helpers
if (import.meta.env.DEV) {
  window.componentRegistry = componentRegistry;

  console.log('🔧 Component Registry available:');
  console.log('  - window.componentRegistry - Registry instance');
  console.log('  - window.componentRegistry.getStats() - Show stats');
}

console.log('✅ Storyblok Component Registry ready');
