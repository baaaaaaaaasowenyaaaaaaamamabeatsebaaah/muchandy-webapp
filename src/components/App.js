// src/components/App.js - Enhanced with phased initialization
import { createElement, CollapsibleHeader, Footer } from 'svarog-ui-core';
import { MuchandyComponent } from './MuchandyComponent.js';
import { router } from '../utils/router.js';
import { serviceCoordinator } from '../utils/serviceCoordinator.js';
import { appState } from '../utils/stateStore.js';
import { LoadPriority } from '../utils/priorityLoader.js';
import createPage from './Page.js';

console.log('=== ENHANCED APP WITH PHASED INITIALIZATION ===');

// Enhanced App with proper initialization sequence - KISS principle
class EnhancedApp extends MuchandyComponent {
  constructor(props = {}) {
    super(props);

    // App-specific state
    this.state = {
      initialized: false,
      phase: 'not-started',
      error: null,
    };

    // Component references
    this.currentPage = null;
    this.pageContainer = null;
    this.header = null;
    this.footer = null;

    console.log('🚀 Enhanced App created');
  }

  // === LIFECYCLE METHODS ===

  // Phase 1: Critical setup
  async beforeLoad() {
    console.log('📋 App Phase 1: Critical setup...');

    try {
      this.setState({ phase: 'critical-setup' });

      // Register all services with coordinator
      this.registerServices();

      // Initialize critical services (theme)
      await serviceCoordinator.waitForPriority(LoadPriority.CRITICAL);

      console.log('✅ Critical setup complete');
    } catch (error) {
      console.error('❌ Critical setup failed:', error);
      throw error;
    }
  }

  // Phase 2: Load global services
  async load() {
    console.log('📊 App Phase 2: Loading global services...');

    try {
      this.setState({ phase: 'loading-services' });

      // Load all services
      const results = await serviceCoordinator.loadAll();

      // Check for critical failures
      const criticalServices = ['storyblok', 'header', 'footer'];
      const failures = criticalServices.filter(
        (name) =>
          results[name]?.error || !appState.get(`services.${name}.ready`)
      );

      if (failures.length > 0) {
        throw new Error(`Critical services failed: ${failures.join(', ')}`);
      }

      console.log('✅ All services loaded successfully');
    } catch (error) {
      console.error('❌ Service loading failed:', error);
      this.setState({
        error: {
          phase: 'services',
          message: error.message,
        },
      });
      throw error;
    }
  }

  // Phase 3: Create UI structure
  async beforeRender() {
    console.log('🎯 App Phase 3: Creating UI structure...');

    this.setState({ phase: 'creating-ui' });

    // Get configurations from services
    this.headerConfig = appState.get('header.config');
    this.footerConfig = appState.get('footer.config');

    if (!this.headerConfig || !this.footerConfig) {
      throw new Error('Header or footer configuration not available');
    }

    console.log('✅ UI structure prepared');
  }

  // Render the app - Algorithmic Elegance
  render() {
    console.log('🎨 Rendering app structure');

    // Create app container
    const app = createElement('div', {
      className: 'app',
      style: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      },
    });

    // Create and add header
    this.header = this.createHeader();
    app.appendChild(this.header.getElement());

    // Create main content area
    const main = createElement('main', {
      className: 'app-main',
      style: { flex: '1' },
    });

    // Create page container
    this.pageContainer = createElement('div', {
      className: 'app-content',
      style: { width: '100%', minHeight: '50vh' },
    });

    // Add loading message initially
    this.pageContainer.innerHTML = `
      <div class="page-loading" style="
        display: flex;
        align-items: center;
        justify-content: center;
        min-height: 50vh;
        font-size: 1.2rem;
        color: var(--color-primary, #ff7f50);
      ">
        <span class="loading-spinner">⏳ Seite wird geladen...</span>
      </div>
    `;

    main.appendChild(this.pageContainer);
    app.appendChild(main);

    // Create and add footer
    this.footer = this.createFooter();
    app.appendChild(this.footer.getElement());

    return app;
  }

  // Phase 4: Post-initialization
  async afterRender() {
    console.log('✨ App Phase 4: Post-initialization...');

    this.setState({ phase: 'post-init' });

    // Set up global error handling
    this.setupErrorHandling();

    // Track app state
    appState.set('app.initialized', true);
    appState.set('app.startTime', Date.now());
  }

  // Phase 5: Initialize routing after mount
  async onMount() {
    console.log('🚀 App Phase 5: Initialize routing...');

    this.setState({ phase: 'routing-init' });

    // Initialize routing
    this.initializeRouting();

    // Mark as fully initialized
    this.setState({
      initialized: true,
      phase: 'ready',
    });

    console.log('✅ App fully initialized and ready!');
  }

  // === SERVICE REGISTRATION ===

  // Register all services with coordinator - Economy of Expression
  registerServices() {
    console.log('📝 Registering services...');

    // Theme service (CRITICAL)
    serviceCoordinator.register('theme', {
      factory: async () => {
        const themeModule = await import('@svarog-ui/theme-muchandy');
        const theme = themeModule.default || themeModule.muchandyTheme;
        theme.apply();
        return theme;
      },
      priority: LoadPriority.CRITICAL,
    });

    // Storyblok service (HIGH)
    serviceCoordinator.register('storyblok', {
      factory: async () => {
        const { storyblok } = await import('../services/storyblok.js');
        await storyblok.load();
        return storyblok;
      },
      priority: LoadPriority.HIGH,
    });

    // API service (HIGH)
    serviceCoordinator.register('api', {
      factory: async () => {
        const ApiService = (await import('../services/apiService.js')).default;
        const api = new ApiService();
        await api.load();
        return api;
      },
      priority: LoadPriority.HIGH,
    });

    // Header service (HIGH)
    serviceCoordinator.register('header', {
      factory: async () => {
        const { headerService } = await import('../services/headerService.js');
        await headerService.load();
        return headerService;
      },
      dependencies: ['storyblok'],
      priority: LoadPriority.HIGH,
    });

    // Footer service (HIGH)
    serviceCoordinator.register('footer', {
      factory: async () => {
        const { footerService } = await import('../services/footerService.js');
        await footerService.load();
        return footerService;
      },
      dependencies: ['storyblok'],
      priority: LoadPriority.HIGH,
    });

    // SEO service (NORMAL)
    serviceCoordinator.register('seo', {
      factory: async () => {
        const { seoService } = await import('../services/seoService.js');
        await seoService.load();
        return seoService;
      },
      dependencies: ['storyblok'],
      priority: LoadPriority.NORMAL,
    });

    console.log('✅ All services registered');
  }

  // === UI CREATION ===

  // Create header with loaded config - Maximum Conciseness
  createHeader() {
    console.log('🎨 Creating header from config...');

    const config = this.headerConfig;

    return CollapsibleHeader({
      ...config,
      onCallClick: () => {
        const phone = config.contactInfo?.phone?.replace(/\s/g, '');
        if (phone) window.location.href = `tel:${phone}`;
      },
    });
  }

  // Create footer with loaded config
  createFooter() {
    console.log('🎨 Creating footer from config...');

    return Footer(this.footerConfig);
  }

  // === ROUTING ===

  // Initialize routing - KISS principle
  initializeRouting() {
    console.log('🔄 Initializing routing...');

    // Route handler
    const handleRoute = async (path) => {
      console.log(`📍 Handling route: ${path}`);

      try {
        // Update app state
        appState.set('app.routing', true);
        appState.set('app.currentPath', path);

        // Clean up current page
        if (this.currentPage) {
          await this.currentPage.destroy();
          this.currentPage = null;
        }

        // Show loading
        this.showPageLoading();

        // Create new page
        const slug = path === '/' ? 'home' : path.substring(1);
        this.currentPage = createPage({ slug });

        // Load and mount page
        const pageElement = await this.currentPage.getElement();

        // Replace content
        this.pageContainer.innerHTML = '';
        this.pageContainer.appendChild(pageElement);

        // Update state
        appState.set('app.routing', false);

        console.log('✅ Route handled successfully');
      } catch (error) {
        console.error('❌ Route handling failed:', error);
        this.showErrorPage(error);
        appState.set('app.routing', false);
      }
    };

    // Register routes
    router.addRoute('/', handleRoute);
    router.addRoute('*', handleRoute);

    // Start router
    router.start();

    console.log('✅ Routing initialized');
  }

  // === ERROR HANDLING ===

  // Setup global error handling - Algorithmic Elegance
  setupErrorHandling() {
    // Handle unhandled promise rejections
    window.addEventListener('unhandledrejection', (event) => {
      console.error('Unhandled promise rejection:', event.reason);

      appState.set('app.errors', [
        ...(appState.get('app.errors') || []),
        {
          type: 'unhandledRejection',
          error: event.reason,
          timestamp: Date.now(),
        },
      ]);
    });

    // Handle global errors
    window.addEventListener('error', (event) => {
      console.error('Global error:', event.error);

      appState.set('app.errors', [
        ...(appState.get('app.errors') || []),
        {
          type: 'globalError',
          error: event.error,
          timestamp: Date.now(),
        },
      ]);
    });
  }

  // Show page loading state
  showPageLoading() {
    this.pageContainer.innerHTML = `
      <div class="page-loading" style="
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        min-height: 50vh;
        text-align: center;
      ">
        <div class="loading-spinner" style="
          font-size: 3rem;
          margin-bottom: 1rem;
          animation: spin 1s linear infinite;
        ">⏳</div>
        <p style="
          font-size: 1.1rem;
          color: var(--color-text-secondary, #666);
        ">Seite wird geladen...</p>
      </div>
      <style>
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      </style>
    `;
  }

  // Show error page - Economy of Expression
  showErrorPage(error) {
    const errorPage = createPage();
    errorPage.setError({
      title: 'Fehler',
      message: error.message || 'Ein unerwarteter Fehler ist aufgetreten.',
      code: error.status || 500,
    });

    this.pageContainer.innerHTML = '';
    this.currentPage = errorPage;

    errorPage.getElement().then((element) => {
      this.pageContainer.appendChild(element);
    });
  }

  // === PUBLIC API ===

  getCurrentPage() {
    return this.currentPage;
  }

  async navigate(path) {
    router.navigate(path);
  }

  updatePage(props) {
    this.currentPage?.update(props);
  }

  async refreshServices() {
    console.log('🔄 Refreshing all services...');

    const services = ['header', 'footer', 'seo'];
    for (const name of services) {
      const service = serviceCoordinator.get(name);
      if (service?.refresh) {
        await service.refresh();
      }
    }

    // Re-render header and footer if needed
    if (this.header) {
      const newConfig = appState.get('header.config');
      this.header.update(newConfig);
    }

    if (this.footer) {
      const newConfig = appState.get('footer.config');
      this.footer.update(newConfig);
    }
  }

  getAppState() {
    return {
      ...this.state,
      currentPath: router.getCurrentPath(),
      pageState: this.currentPage?.getState(),
      services: serviceCoordinator.getStats(),
      errors: appState.get('app.errors') || [],
    };
  }

  // === CLEANUP ===

  async beforeDestroy() {
    console.log('⚠️ App cleanup starting...');

    // Destroy current page
    if (this.currentPage) {
      await this.currentPage.destroy();
      this.currentPage = null;
    }

    // Clear services
    serviceCoordinator.clear();
  }
}

// Factory function for app creation - Maximum Conciseness
const createApp = () => {
  const app = new EnhancedApp();

  return {
    async getElement() {
      return app.getElement();
    },

    getCurrentPage: () => app.getCurrentPage(),
    navigate: (path) => app.navigate(path),
    updatePage: (props) => app.updatePage(props),
    getState: () => app.getAppState(),
    refreshServices: () => app.refreshServices(),
    destroy: () => app.destroy(),
    debug: () => app.debug(),
  };
};

// Development helpers
if (import.meta.env.DEV) {
  window.EnhancedApp = EnhancedApp;

  // Debug app initialization phases
  window.debugAppInit = () => {
    console.group('🔍 App Initialization Debug');
    console.log('Services:', serviceCoordinator.getStats());
    console.log('App State:', appState.get('app'));
    console.log('Current Phase:', appState.get('components')?.app?.status);
    console.groupEnd();
  };

  console.log('🔧 Enhanced App development helpers:');
  console.log('  - window.EnhancedApp - App class');
  console.log('  - window.debugAppInit() - Debug initialization');
}

console.log('✅ Enhanced App with phased initialization ready');

export default createApp;
