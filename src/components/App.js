// src/components/App.js
/**
 * @file Enhanced App component with phased initialization
 * @description Main application container with service coordination
 */

import {
  createElement,
  CollapsibleHeaderContainer,
  Footer,
} from 'svarog-ui-core';
import { MuchandyComponent } from './MuchandyComponent.js';
import { appState } from '../utils/stateStore.js';
import { priorityLoader, LoadPriority } from '../utils/priorityLoader.js';
import { serviceCoordinator } from '../utils/serviceCoordinator.js';

console.log('=== ENHANCED APP WITH PHASED INITIALIZATION ===');

/**
 * Enhanced App with proper initialization phases
 */
class EnhancedApp extends MuchandyComponent {
  constructor(props = {}) {
    super({ ...props, componentType: 'EnhancedApp' });

    this.coordinator = serviceCoordinator; // Use the imported singleton
    this.router = null;
    this.currentPage = null;
    this.element = null;

    // UI references
    this.header = null;
    this.footer = null;
    this.pageContainer = null;
  }

  /**
   * Phase 1: Critical setup
   */
  async initializeCritical() {
    console.log('📋 App Phase 1: Critical setup...');
    this.setState({ phase: 'critical-setup' });

    // Register all services with proper dependencies and priorities
    this.registerServices();

    // Wait for critical services - use priorityLoader directly
    await priorityLoader.waitForPriority(LoadPriority.CRITICAL);

    console.log('✅ Critical setup complete');
  }

  /**
   * Register all services
   */
  registerServices() {
    console.log('📝 Registering services...');

    // Theme service (CRITICAL - needed before any UI)
    this.coordinator.register('theme', {
      factory: async () => {
        console.log('  Creating theme instance...');
        appState.set('services.theme.loading', true);

        try {
          const { default: theme } = await import('@svarog-ui/theme-muchandy');
          theme.apply();

          appState.set('services.theme.instance', theme);
          appState.set('services.theme.ready', true);
          return theme;
        } finally {
          appState.set('services.theme.loading', false);
        }
      },
      dependencies: [],
      priority: LoadPriority.CRITICAL,
    });

    // Storyblok service (HIGH - needed for header/footer)
    this.coordinator.register('storyblok', {
      factory: async () => {
        console.log('  Creating storyblok instance...');
        appState.set('services.storyblok.loading', true);

        const { storyblok } = await import('../services/storyblok.js');

        appState.set('services.storyblok.instance', storyblok);
        appState.set('services.storyblok.ready', true);
        appState.set('services.storyblok.loading', false);
        return storyblok;
      },
      dependencies: [],
      priority: LoadPriority.HIGH,
    });

    // API service (HIGH - needed for forms)
    this.coordinator.register('api', {
      factory: async () => {
        console.log('  Creating api instance...');
        appState.set('services.api.loading', true);

        const { apiService } = await import('../services/apiService.js');
        await apiService.load();

        appState.set('services.api.instance', apiService);
        appState.set('services.api.ready', true);
        appState.set('services.api.loading', false);
        return apiService;
      },
      dependencies: [],
      priority: LoadPriority.HIGH,
    });

    // Header service (HIGH - but depends on storyblok)
    this.coordinator.register('header', {
      factory: async () => {
        console.log('  Creating header instance...');
        appState.set('services.header.loading', true);

        const { headerService } = await import('../services/headerService.js');
        await headerService.load();

        appState.set('services.header.instance', headerService);
        appState.set('services.header.ready', true);
        appState.set('services.header.loading', false);
        return headerService;
      },
      dependencies: ['storyblok'],
      priority: LoadPriority.HIGH,
    });

    // Footer service (HIGH - but depends on storyblok)
    this.coordinator.register('footer', {
      factory: async () => {
        console.log('  Creating footer instance...');
        appState.set('services.footer.loading', true);

        const { footerService } = await import('../services/footerService.js');
        await footerService.load();

        appState.set('services.footer.instance', footerService);
        appState.set('services.footer.ready', true);
        appState.set('services.footer.loading', false);
        return footerService;
      },
      dependencies: ['storyblok'],
      priority: LoadPriority.HIGH,
    });

    // SEO service (NORMAL - depends on storyblok)
    this.coordinator.register('seo', {
      factory: async () => {
        console.log('  Creating seo instance...');
        appState.set('services.seo.loading', true);

        const { seoService } = await import('../services/seoService.js');
        await seoService.load();

        appState.set('services.seo.instance', seoService);
        appState.set('services.seo.ready', true);
        appState.set('services.seo.loading', false);
        return seoService;
      },
      dependencies: ['storyblok'],
      priority: LoadPriority.NORMAL,
    });

    console.log('✅ All services registered');
  }

  /**
   * Phase 2: Load global services
   */
  async loadGlobalServices() {
    console.log('📊 App Phase 2: Loading global services...');
    this.setState({ phase: 'loading-services' });

    await this.coordinator.loadAll();

    console.log('✅ All services loaded successfully');
  }

  /**
   * Phase 3: Create UI structure
   */
  async createUIStructure() {
    console.log('🎯 App Phase 3: Creating UI structure...');
    this.setState({ phase: 'creating-ui' });

    // Create the basic app structure
    this.element = createElement('div', {
      className: 'app',
      style: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      },
    });

    // Create page container (content will be added later)
    this.pageContainer = createElement('div', {
      className: 'app-content',
      style: { flex: '1', width: '100%' },
    });

    const main = createElement('main', {
      className: 'app-main',
      style: { flex: '1', display: 'flex', flexDirection: 'column' },
      children: [this.pageContainer],
    });

    this.element.appendChild(main);

    console.log('✅ UI structure prepared');
  }

  /**
   * Load implementation
   */
  async load() {
    // Phase 1: Critical setup
    await this.initializeCritical();

    // Phase 2: Load services
    await this.loadGlobalServices();

    // Phase 3: Create UI structure
    await this.createUIStructure();
  }

  /**
   * Render the app
   */
  render() {
    console.log('🎨 Rendering app structure');

    // Header
    const headerConfig = appState.get('header.config');
    if (headerConfig) {
      this.header = this.createHeader(headerConfig);
      this.element.insertBefore(this.header, this.element.firstChild);
    }

    // Footer
    const footerConfig = appState.get('footer.config');
    if (footerConfig) {
      this.footer = this.createFooter(footerConfig);
      this.element.appendChild(this.footer);
    }

    return this.element;
  }

  /**
   * After render - set up routing
   */
  async afterRender() {
    await this.initializeRouting();
  }

  /**
   * Post initialization
   */
  async mounted() {
    console.log('✨ App Phase 4: Post-initialization...');
    this.setState({ phase: 'post-init' });

    // Set up state watchers
    this.setupStateWatchers();

    // Mark app as initialized
    appState.set('app.initialized', true);
    appState.set('app.loadTime', Date.now() - appState.get('app.startTime'));
  }

  /**
   * Initialize routing
   */
  async initializeRouting() {
    const { router } = await import('../utils/router.js');
    this.router = router;

    // Set up routes
    router.addRoute('/', this.handleRoute.bind(this));
    router.addRoute('*', this.handleRoute.bind(this));

    // Start routing
    router.start();
  }

  /**
   * Handle route changes
   */
  async handleRoute(path) {
    try {
      appState.set('app.routing', true);

      // Clean up current page
      if (this.currentPage) {
        await this.currentPage.destroy();
      }

      // Create new page
      const { EnhancedPage } = await import('./Page.js');
      const slug = path === '/' ? 'home' : path.substring(1);

      this.currentPage = new EnhancedPage({ slug });
      const pageElement = await this.currentPage.getElement();

      // Update container
      this.pageContainer.innerHTML = '';
      this.pageContainer.appendChild(pageElement);

      appState.set('app.currentPage', slug);
      appState.set('app.routing', false);
    } catch (error) {
      console.error('Route handling failed:', error);
      this.showErrorPage(error);
    }
  }

  /**
   * Create header component
   */
  createHeader(config) {
    console.log('🎨 Creating header from config...');

    const header = CollapsibleHeaderContainer({
      siteName: config.siteName,
      logo: {
        imageUrl: config.logo,
        alt: config.siteName,
        fallbackImageUrl: config.compactLogo,
      },
      navigation: {
        items: config.navigation.items,
        ctaButton: config.navigation.ctaButton,
      },
      contactInfo: config.contactInfo,
      mobileMenuButton: {
        variant: 'icon',
        icon: '☰',
        ariaLabel: 'Toggle mobile menu',
      },
    });

    return header.getElement();
  }

  /**
   * Create footer component
   */
  createFooter(config) {
    console.log('🎨 Creating footer from config...');

    const footer = Footer({
      siteName: config.siteName,
      description: config.description,
      contact: config.contact,
      address: config.address,
      socialLinks: config.socialLinks,
      legalLinks: config.legalLinks,
      openingHours: config.openingHours,
    });

    return footer.getElement();
  }

  /**
   * Set up state watchers
   */
  setupStateWatchers() {
    // Watch for header config changes
    this.watchState('header.config', (config) => {
      if (config && this.header) {
        const newHeader = this.createHeader(config);
        this.header.parentNode.replaceChild(newHeader, this.header);
        this.header = newHeader;
      }
    });

    // Watch for footer config changes
    this.watchState('footer.config', (config) => {
      if (config && this.footer) {
        const newFooter = this.createFooter(config);
        this.footer.parentNode.replaceChild(newFooter, this.footer);
        this.footer = newFooter;
      }
    });
  }

  /**
   * Show error page
   */
  showErrorPage(error) {
    this.pageContainer.innerHTML = `
      <div style="padding: 40px; text-align: center;">
        <h1>Page Load Error</h1>
        <p>${error.message}</p>
        <button onclick="window.location.reload()">Reload</button>
      </div>
    `;
  }

  /**
   * Get the app element
   */
  getElement() {
    return this.element || this.init();
  }
}

// Export for development
if (typeof window !== 'undefined') {
  window.EnhancedApp = EnhancedApp;
  window.debugAppInit = () => {
    console.log('=== APP INITIALIZATION DEBUG ===');
    console.log('Services:', appState.get('services'));
    console.log('App State:', appState.get('app'));
    console.log('Components:', appState.get('components'));
    console.log('================================');
  };

  console.log('🔧 Enhanced App development helpers:');
  console.log('   - window.EnhancedApp - App class');
  console.log('   - window.debugAppInit() - Debug initialization');
}

// Export the class
export { EnhancedApp };
export default EnhancedApp;

console.log('✅ Enhanced App with phased initialization ready');
