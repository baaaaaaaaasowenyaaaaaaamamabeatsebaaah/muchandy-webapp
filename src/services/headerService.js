// src/services/headerService.js - Enhanced with coordinated loading
import { appState } from '../utils/stateStore.js';
import { storyblok } from './storyblok.js';

console.log('=== ENHANCED HEADER SERVICE LOADING ===');

class HeaderService {
  constructor() {
    this.storySlug = 'global-header';
    console.log('✅ HeaderService initialized');
  }

  // Service lifecycle method for coordinator - KISS principle
  async load() {
    console.log('🚀 Loading header service...');

    try {
      // Mark service as loading
      appState.set('services.header.loading', true);

      // Load header configuration
      const config = await this.getHeaderConfig();

      // Mark service as ready
      appState.set('services.header.ready', true);
      appState.set('services.header.loading', false);

      console.log('✅ Header service loaded');
      return config;
    } catch (error) {
      appState.set('services.header.error', error.message);
      appState.set('services.header.loading', false);
      throw error;
    }
  }

  // Get header config with state integration - Economy of Expression
  async getHeaderConfig() {
    console.log('🔄 Loading header configuration...');

    // Check state first
    const cached = appState.get('header.config');
    if (cached) {
      console.log('📦 Header config from state');
      return cached;
    }

    try {
      // Wait for Storyblok service to be ready
      await appState.waitFor('services.storyblok.ready');

      // Get story from Storyblok (already cached there)
      const story = await storyblok.getStory(this.storySlug);
      const config = this.transformStoryToConfig(story.content);

      // Store in state
      appState.set('header.config', config);
      appState.set('header.story', story);

      console.log('✅ Header config loaded from Storyblok');
      return config;
    } catch (error) {
      console.warn('⚠️ Failed to load header from Storyblok:', error.message);

      // Use fallback configuration
      const fallback = this.getFallbackConfig();
      appState.set('header.config', fallback);
      appState.set('header.isFallback', true);

      return fallback;
    }
  }

  // Transform Storyblok content to header config - Algorithmic Elegance
  transformStoryToConfig(content) {
    console.log('🔄 Transforming header content');

    const config = {
      siteName: content.site_name || 'MUCHANDY',
      logo: content.logo_url?.filename,
      compactLogo: content.compact_logo_url?.filename,

      // Transform navigation items
      navigation: {
        items: (content.navigation_items || [])
          .filter(
            (item) => item.component === 'nav_item' && item.label && item.url
          )
          .map((item) => ({
            id: this.generateNavId(item.label),
            label: item.label,
            href: item.url,
            target: item.target || '_self',
            icon: item.icon?.filename,
          })),
      },

      // Contact information
      contactInfo: {
        phone: content.contact_phone || '089 / 26949777',
        email: content.contact_email || 'info@muchandy.de',
        location: content.contact_location || 'Sendlinger Str. 7',
      },

      // Behavior settings
      collapseThreshold: content.collapse_threshold || 100,
      callButtonText: content.call_button_text || 'Jetzt Anrufen',
      showStickyIcons: content.show_sticky_icons !== false,
      stickyIconsPosition: content.sticky_icons_position || 'right',

      // Additional settings
      className: 'muchandy-header',
      transparent: content.transparent_header || false,
      sticky: content.sticky_header !== false,
    };

    // Ensure at least basic navigation
    if (config.navigation.items.length === 0) {
      config.navigation = this.getFallbackNavigation();
    }

    console.log('✅ Header config transformed');
    return config;
  }

  // Generate navigation item ID - Maximum Conciseness
  generateNavId(label) {
    return label
      .toLowerCase()
      .replace(/[äöü]/g, (char) => ({ ä: 'ae', ö: 'oe', ü: 'ue' })[char])
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  // Fallback configuration - KISS approach
  getFallbackConfig() {
    console.log('📋 Using fallback header configuration');

    return {
      siteName: 'MUCHANDY',
      logo: 'https://a.storyblok.com/f/340558/150x150/568478fef6/logo-farbe.svg',
      compactLogo:
        'https://a.storyblok.com/f/340558/150x150/fe8d57c0c5/logo-icon-farbe.svg',
      navigation: this.getFallbackNavigation(),
      contactInfo: {
        location: 'Sendlinger Str. 7',
        phone: '089 / 26949777',
        email: 'info@muchandy.de',
      },
      collapseThreshold: 100,
      callButtonText: 'Jetzt Anrufen',
      showStickyIcons: true,
      stickyIconsPosition: 'right',
      className: 'muchandy-header',
      transparent: false,
      sticky: true,
    };
  }

  // Fallback navigation
  getFallbackNavigation() {
    return {
      items: [
        { id: 'repair', label: 'Reparatur', href: '/reparatur' },
        { id: 'purchase', label: 'Ankauf', href: '/ankauf' },
        { id: 'used', label: 'Gebrauchte', href: '/gebrauchte' },
        { id: 'services', label: 'Services', href: '/services' },
        { id: 'contact', label: 'Kontakt', href: '/kontakt' },
      ],
    };
  }

  // Refresh header configuration - Economy of Expression
  async refresh() {
    console.log('🔄 Refreshing header configuration...');

    // Clear state cache
    appState.delete('header.config');
    appState.delete('header.story');
    appState.delete('header.isFallback');

    // Reload
    return this.getHeaderConfig();
  }

  // Update specific header properties
  updateConfig(updates) {
    console.log('📝 Updating header config:', Object.keys(updates));

    const currentConfig = appState.get('header.config') || {};
    const newConfig = { ...currentConfig, ...updates };

    appState.set('header.config', newConfig);
    return newConfig;
  }

  // Get current configuration from state
  getConfig() {
    return appState.get('header.config');
  }

  // Check if using fallback
  isUsingFallback() {
    return appState.get('header.isFallback') === true;
  }

  // Get service status
  getStatus() {
    return {
      ready: appState.get('services.header.ready') || false,
      loading: appState.get('services.header.loading') || false,
      error: appState.get('services.header.error'),
      hasConfig: !!appState.get('header.config'),
      isFallback: this.isUsingFallback(),
    };
  }

  // Destroy method for service coordinator
  destroy() {
    console.log('🧹 Destroying header service');
    appState.delete('header');
  }
}

// Create singleton instance
export const headerService = new HeaderService();

// Development helpers
if (import.meta.env.DEV) {
  window.headerService = headerService;

  // Debug helper
  window.debugHeader = () => {
    console.group('🔍 Header Service Debug');
    console.log('Status:', headerService.getStatus());
    console.log('Config:', headerService.getConfig());
    console.log('State:', appState.get('header'));
    console.groupEnd();
  };

  // Test state reactivity
  window.watchHeader = () => {
    return appState.subscribe('header.config', (newConfig, oldConfig) => {
      console.log('📊 Header config changed:', { oldConfig, newConfig });
    });
  };

  console.log('🔧 Header Service development helpers:');
  console.log('  - window.headerService - Service instance');
  console.log('  - window.debugHeader() - Show debug info');
  console.log('  - window.watchHeader() - Watch config changes');
}

console.log('✅ Enhanced Header Service ready');
