// src/components/MuchandyComponent.js - Base component with lifecycle management
import { createElement } from 'svarog-ui-core';
import { appState } from '../utils/stateStore.js';

console.log('=== MUCHANDY COMPONENT BASE CLASS LOADING ===');

// Base component class with lifecycle hooks - KISS principle
export class MuchandyComponent {
  constructor(props = {}) {
    this.props = props;
    this.state = {};
    this.element = null;
    this.mounted = false;
    this.destroyed = false;
    this.subscriptions = [];
    this.children = new Map();
    this.initialized = false;

    // Unique component ID
    this.id = props.id || `muchandy-${Math.random().toString(36).slice(2, 9)}`;

    console.log(`🎨 Creating component: ${this.constructor.name} [${this.id}]`);
  }

  // === LIFECYCLE METHODS ===

  // Called before data loading - Override in subclasses
  async beforeLoad() {
    console.log(`📋 beforeLoad: ${this.constructor.name}`);
    // Override in subclasses for setup tasks
  }

  // Load required data - Override in subclasses
  async load() {
    console.log(`📊 load: ${this.constructor.name}`);
    // Override in subclasses to load data
  }

  // Called after data loaded, before render - Override in subclasses
  async beforeRender() {
    console.log(`🎯 beforeRender: ${this.constructor.name}`);
    // Override in subclasses for pre-render setup
  }

  // Render component - Must be implemented in subclasses
  render() {
    throw new Error(`${this.constructor.name} must implement render() method`);
  }

  // Called after render - Override in subclasses
  async afterRender() {
    console.log(`✨ afterRender: ${this.constructor.name}`);
    // Override in subclasses for post-render tasks
  }

  // Called when component is mounted to DOM - Override in subclasses
  async onMount() {
    console.log(`🚀 onMount: ${this.constructor.name}`);
    // Override in subclasses for DOM-dependent initialization
  }

  // Called before component is destroyed - Override in subclasses
  async beforeDestroy() {
    console.log(`⚠️ beforeDestroy: ${this.constructor.name}`);
    // Override in subclasses for cleanup preparation
  }

  // === CORE METHODS ===

  // Initialize component with proper lifecycle - Algorithmic Elegance
  async init() {
    if (this.destroyed) {
      console.warn(`Cannot init destroyed component: ${this.id}`);
      return null;
    }

    if (this.initialized) {
      console.warn(`Component already initialized: ${this.id}`);
      return this.element;
    }

    console.log(
      `🔄 Initializing component: ${this.constructor.name} [${this.id}]`
    );

    try {
      // Track initialization in state
      appState.set(`components.${this.id}.status`, 'initializing');

      // Execute lifecycle
      await this.beforeLoad();
      await this.load();
      await this.beforeRender();

      // Render component
      this.element = this.render();

      if (!this.element) {
        throw new Error('render() must return an HTMLElement');
      }

      // Add component ID to element
      this.element.setAttribute('data-component-id', this.id);

      await this.afterRender();

      // Mark as initialized
      this.initialized = true;
      appState.set(`components.${this.id}.status`, 'initialized');

      console.log(
        `✅ Component initialized: ${this.constructor.name} [${this.id}]`
      );
      return this.element;
    } catch (error) {
      console.error(
        `❌ Component initialization failed: ${this.constructor.name}`,
        error
      );
      appState.set(`components.${this.id}.status`, 'error');
      appState.set(`components.${this.id}.error`, error.message);

      return this.renderError(error);
    }
  }

  // Get element (initializes if needed) - Maximum Conciseness
  async getElement() {
    if (!this.initialized && !this.destroyed) {
      await this.init();
    }
    return this.element;
  }

  // Mount component to DOM
  async mount(container) {
    if (this.destroyed) return;

    const element = await this.getElement();
    if (!element) return;

    console.log(`🎯 Mounting component: ${this.constructor.name} [${this.id}]`);

    if (typeof container === 'string') {
      container = document.querySelector(container);
    }

    if (!container) {
      throw new Error('Invalid mount container');
    }

    container.appendChild(element);
    this.mounted = true;

    // Update state
    appState.set(`components.${this.id}.mounted`, true);

    // Call mount lifecycle
    await this.onMount();

    console.log(`✅ Component mounted: ${this.constructor.name} [${this.id}]`);
  }

  // === STATE MANAGEMENT ===

  // Set local component state - KISS principle
  setState(updates) {
    if (this.destroyed) return;

    const oldState = { ...this.state };
    this.state = { ...this.state, ...updates };

    console.log(`📝 State updated for ${this.id}:`, updates);

    // Trigger re-render if mounted
    if (this.mounted && this.shouldUpdate(oldState, this.state)) {
      this.rerender();
    }
  }

  // Determine if component should update - Override for custom logic
  shouldUpdate(oldState, newState) {
    return JSON.stringify(oldState) !== JSON.stringify(newState);
  }

  // Subscribe to app state changes - Economy of Expression
  watchState(path, callback) {
    const unsubscribe = appState.subscribe(path, (value, oldValue) => {
      if (!this.destroyed) {
        callback(value, oldValue);
      }
    });

    this.subscriptions.push(unsubscribe);
    return unsubscribe;
  }

  // Watch and auto-update on state change
  watchAndUpdate(path) {
    return this.watchState(path, () => {
      if (this.mounted) {
        this.rerender();
      }
    });
  }

  // === UPDATE METHODS ===

  // Update component props
  async update(newProps) {
    if (this.destroyed) return;

    console.log(`🔄 Updating component: ${this.constructor.name} [${this.id}]`);

    const oldProps = this.props;
    this.props = { ...this.props, ...newProps };

    if (this.shouldUpdateProps(oldProps, this.props)) {
      await this.rerender();
    }
  }

  // Determine if props update requires re-render
  shouldUpdateProps(oldProps, newProps) {
    return JSON.stringify(oldProps) !== JSON.stringify(newProps);
  }

  // Re-render component - Algorithmic Elegance
  async rerender() {
    if (!this.element || this.destroyed) return;

    console.log(
      `🔄 Re-rendering component: ${this.constructor.name} [${this.id}]`
    );

    try {
      appState.set(`components.${this.id}.status`, 'rerendering');

      // Store parent and position
      const parent = this.element.parentNode;
      const nextSibling = this.element.nextSibling;

      // Create new element
      const oldElement = this.element;
      await this.beforeRender();
      this.element = this.render();
      await this.afterRender();

      // Replace in DOM if mounted
      if (parent) {
        parent.insertBefore(this.element, nextSibling);
        parent.removeChild(oldElement);
      }

      appState.set(`components.${this.id}.status`, 'initialized');
      console.log(
        `✅ Re-render complete: ${this.constructor.name} [${this.id}]`
      );
    } catch (error) {
      console.error(`❌ Re-render failed: ${this.constructor.name}`, error);
      appState.set(`components.${this.id}.status`, 'error');
      appState.set(`components.${this.id}.error`, error.message);
    }
  }

  // === CHILD COMPONENT MANAGEMENT ===

  // Register a child component - Maximum Conciseness
  registerChild(name, component) {
    this.children.set(name, component);
    return component;
  }

  // Get a child component
  getChild(name) {
    return this.children.get(name);
  }

  // Destroy all child components
  async destroyChildren() {
    for (const [name, child] of this.children) {
      console.log(`🧹 Destroying child: ${name}`);
      if (child && typeof child.destroy === 'function') {
        await child.destroy();
      }
    }
    this.children.clear();
  }

  // === ERROR HANDLING ===

  // Render error state - KISS principle
  renderError(error) {
    return createElement('div', {
      className: 'muchandy-component-error',
      style: {
        padding: '1rem',
        margin: '1rem 0',
        background: '#fee',
        border: '1px solid #fcc',
        borderRadius: '4px',
        color: '#c00',
      },
      innerHTML: `
        <h3 style="margin: 0 0 0.5rem 0;">Component Error</h3>
        <p style="margin: 0;">${error.message}</p>
        <small style="opacity: 0.7;">Component: ${this.constructor.name} [${this.id}]</small>
      `,
    });
  }

  // === CLEANUP ===

  // Destroy component - Economy of Expression
  async destroy() {
    if (this.destroyed) return;

    console.log(
      `🗑️ Destroying component: ${this.constructor.name} [${this.id}]`
    );

    try {
      // Call lifecycle hook
      await this.beforeDestroy();

      // Mark as destroyed
      this.destroyed = true;
      this.mounted = false;

      // Destroy children
      await this.destroyChildren();

      // Unsubscribe from state
      this.subscriptions.forEach((unsub) => unsub());
      this.subscriptions = [];

      // Remove from DOM
      this.element?.remove();
      this.element = null;

      // Clear from state
      appState.delete(`components.${this.id}`);

      console.log(
        `✅ Component destroyed: ${this.constructor.name} [${this.id}]`
      );
    } catch (error) {
      console.error(
        `❌ Error destroying component: ${this.constructor.name}`,
        error
      );
    }
  }

  // === UTILITY METHODS ===

  // Emit custom event - Fixed to use window.CustomEvent
  emit(eventName, detail = {}) {
    if (!this.element) return;

    const event = new window.CustomEvent(eventName, {
      detail,
      bubbles: true,
      cancelable: true,
    });

    this.element.dispatchEvent(event);
    console.log(`📢 Event emitted: ${eventName}`, detail);
  }

  // Get component info
  getInfo() {
    return {
      id: this.id,
      type: this.constructor.name,
      props: this.props,
      state: this.state,
      mounted: this.mounted,
      destroyed: this.destroyed,
      initialized: this.initialized,
      childCount: this.children.size,
    };
  }

  // Debug component
  debug() {
    console.group(`🔍 Component Debug: ${this.constructor.name} [${this.id}]`);
    console.log('Info:', this.getInfo());
    console.log('Element:', this.element);
    console.log('App State:', appState.get(`components.${this.id}`));
    console.groupEnd();
  }
}

// Development helpers
if (import.meta.env.DEV) {
  window.MuchandyComponent = MuchandyComponent;

  // Get all active components
  window.getActiveComponents = () => {
    const components = appState.get('components') || {};
    return Object.entries(components).map(([id, data]) => ({
      id,
      ...data,
    }));
  };

  // Debug specific component
  window.debugComponent = (id) => {
    const componentData = appState.get(`components.${id}`);
    console.group(`🔍 Component: ${id}`);
    console.log('State data:', componentData);
    console.groupEnd();
  };

  console.log('🔧 MuchandyComponent development helpers:');
  console.log('  - window.MuchandyComponent - Base class');
  console.log('  - window.getActiveComponents() - List all components');
  console.log('  - window.debugComponent(id) - Debug specific component');
}

console.log('✅ MuchandyComponent base class ready');

export default MuchandyComponent;
