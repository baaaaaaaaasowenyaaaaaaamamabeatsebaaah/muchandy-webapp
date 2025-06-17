// src/services/footerService.js - Enhanced with coordinated loading
import { appState } from '../utils/stateStore.js';
import { storyblok } from './storyblok.js';

console.log('=== ENHANCED FOOTER SERVICE LOADING ===');

class FooterService {
  constructor() {
    this.storySlug = 'global-footer';
    console.log('✅ FooterService initialized');
  }

  // Service lifecycle method for coordinator - KISS principle
  async load() {
    console.log('🚀 Loading footer service...');

    try {
      // Mark service as loading
      appState.set('services.footer.loading', true);

      // Load footer configuration
      const config = await this.getFooterConfig();

      // Mark service as ready
      appState.set('services.footer.ready', true);
      appState.set('services.footer.loading', false);

      console.log('✅ Footer service loaded');
      return config;
    } catch (error) {
      appState.set('services.footer.error', error.message);
      appState.set('services.footer.loading', false);
      throw error;
    }
  }

  // Get footer config with state integration - Economy of Expression
  async getFooterConfig() {
    console.log('🔄 Loading footer configuration...');

    // Check state first
    const cached = appState.get('footer.config');
    if (cached) {
      console.log('📦 Footer config from state');
      return cached;
    }

    try {
      // Wait for Storyblok service to be ready
      await appState.waitFor('services.storyblok.ready');

      // Get story from Storyblok (already cached there)
      const story = await storyblok.getStory(this.storySlug);
      const config = this.transformStoryToConfig(story.content);

      // Store in state
      appState.set('footer.config', config);
      appState.set('footer.story', story);

      console.log('✅ Footer config loaded from Storyblok');
      return config;
    } catch (error) {
      console.warn('⚠️ Failed to load footer from Storyblok:', error.message);

      // Use fallback configuration
      const fallback = this.getFallbackConfig();
      appState.set('footer.config', fallback);
      appState.set('footer.isFallback', true);

      return fallback;
    }
  }

  // Transform Storyblok content to footer config - Algorithmic Elegance
  transformStoryToConfig(content) {
    console.log('🔄 Transforming footer content');

    // Transform opening hours
    const openingHours = (content.opening_hours || [])
      .filter((hour) => hour.component === 'opening_hour' && hour.day)
      .map((hour) => ({
        day: hour.day,
        open: hour.open || '10:00',
        close: hour.close || '19:00',
        closed: hour.closed || false,
      }));

    // Transform social links
    const socialLinks = (content.social_links || [])
      .filter(
        (link) => link.component === 'social_link' && link.platform && link.url
      )
      .map((link) => ({
        platform: link.platform,
        href: link.url,
        icon: link.icon?.filename,
      }));

    // Transform footer links
    const footerLinks = (content.footer_links || [])
      .filter(
        (link) => link.component === 'footer_link' && link.label && link.url
      )
      .map((link) => ({
        label: link.label,
        href: link.url,
        target: link.target || '_self',
      }));

    const config = {
      // Business info
      siteName: content.business_name || 'MUCHANDY',
      description:
        content.business_description || 'Premium Mobile Solutions in München',

      // Contact
      contact: {
        phone: content.contact?.phone || '089 / 26949777',
        email: content.contact?.email || 'info@muchandy.de',
      },

      // Address
      address: content.address
        ? {
            street: content.address.street || 'Sendlinger Str. 7',
            city: content.address.city || 'München',
            zip: content.address.zip || '80331',
            country: content.address.country || 'Deutschland',
          }
        : {
            street: 'Sendlinger Str. 7',
            city: 'München',
            zip: '80331',
            country: 'Deutschland',
          },

      // Opening hours
      openingHours:
        openingHours.length > 0 ? openingHours : this.getFallbackOpeningHours(),

      // Footer content
      footer: {
        copyright:
          content.copyright_text ||
          `© ${new Date().getFullYear()} Muchandy. Alle Rechte vorbehalten.`,
        links: footerLinks.length > 0 ? footerLinks : this.getFallbackLinks(),
        social:
          socialLinks.length > 0 ? socialLinks : this.getFallbackSocialLinks(),
      },

      // Additional settings
      className: 'muchandy-footer',
      showMap: content.show_map !== false,
      showNewsletter: content.show_newsletter || false,
      newsletterTitle: content.newsletter_title || 'Newsletter abonnieren',
      newsletterPlaceholder:
        content.newsletter_placeholder || 'Ihre E-Mail-Adresse',
    };

    console.log('✅ Footer config transformed');
    return config;
  }

  // Fallback configuration - KISS approach
  getFallbackConfig() {
    console.log('📋 Using fallback footer configuration');

    return {
      siteName: 'MUCHANDY',
      description:
        'Premium Mobile Solutions in München - Professionelle Handy-Reparaturen und Geräte-Verkauf',

      contact: {
        phone: '089 / 26949777',
        email: 'info@muchandy.de',
      },

      address: {
        street: 'Sendlinger Str. 7',
        city: 'München',
        zip: '80331',
        country: 'Deutschland',
      },

      openingHours: this.getFallbackOpeningHours(),

      footer: {
        copyright: `© ${new Date().getFullYear()} Muchandy. Alle Rechte vorbehalten.`,
        links: this.getFallbackLinks(),
        social: this.getFallbackSocialLinks(),
      },

      className: 'muchandy-footer',
      showMap: true,
      showNewsletter: false,
    };
  }

  // Fallback opening hours - Maximum Conciseness
  getFallbackOpeningHours() {
    return [
      { day: 'Montag', open: '10:00', close: '19:00' },
      { day: 'Dienstag', open: '10:00', close: '19:00' },
      { day: 'Mittwoch', open: '10:00', close: '19:00' },
      { day: 'Donnerstag', open: '10:00', close: '19:00' },
      { day: 'Freitag', open: '10:00', close: '19:00' },
      { day: 'Samstag', open: '10:00', close: '18:00' },
      { day: 'Sonntag', closed: true },
    ];
  }

  // Fallback footer links
  getFallbackLinks() {
    return [
      { label: 'Impressum', href: '/impressum' },
      { label: 'Datenschutz', href: '/datenschutz' },
      { label: 'AGB', href: '/agb' },
      { label: 'Widerrufsbelehrung', href: '/widerruf' },
      { label: 'Garantie', href: '/garantie' },
      { label: 'FAQ', href: '/faq' },
    ];
  }

  // Fallback social links
  getFallbackSocialLinks() {
    return [
      { platform: 'Facebook', href: 'https://facebook.com/muchandy' },
      { platform: 'Instagram', href: 'https://instagram.com/muchandy' },
      { platform: 'Google', href: 'https://g.page/muchandy' },
    ];
  }

  // Refresh footer configuration - Economy of Expression
  async refresh() {
    console.log('🔄 Refreshing footer configuration...');

    // Clear state cache
    appState.delete('footer.config');
    appState.delete('footer.story');
    appState.delete('footer.isFallback');

    // Reload
    return this.getFooterConfig();
  }

  // Update specific footer properties
  updateConfig(updates) {
    console.log('📝 Updating footer config:', Object.keys(updates));

    const currentConfig = appState.get('footer.config') || {};
    const newConfig = { ...currentConfig, ...updates };

    appState.set('footer.config', newConfig);
    return newConfig;
  }

  // Get current configuration from state
  getConfig() {
    return appState.get('footer.config');
  }

  // Check if using fallback
  isUsingFallback() {
    return appState.get('footer.isFallback') === true;
  }

  // Get today's opening hours - Algorithmic Elegance
  getTodayHours() {
    const config = this.getConfig();
    if (!config?.openingHours) return null;

    const days = [
      'Sonntag',
      'Montag',
      'Dienstag',
      'Mittwoch',
      'Donnerstag',
      'Freitag',
      'Samstag',
    ];
    const today = days[new Date().getDay()];

    return config.openingHours.find((hours) => hours.day === today);
  }

  // Check if currently open
  isCurrentlyOpen() {
    const todayHours = this.getTodayHours();
    if (!todayHours || todayHours.closed) return false;

    const now = new Date();
    const currentTime = now.getHours() * 60 + now.getMinutes();

    const [openHour, openMin] = todayHours.open.split(':').map(Number);
    const [closeHour, closeMin] = todayHours.close.split(':').map(Number);

    const openTime = openHour * 60 + openMin;
    const closeTime = closeHour * 60 + closeMin;

    return currentTime >= openTime && currentTime < closeTime;
  }

  // Get service status
  getStatus() {
    return {
      ready: appState.get('services.footer.ready') || false,
      loading: appState.get('services.footer.loading') || false,
      error: appState.get('services.footer.error'),
      hasConfig: !!appState.get('footer.config'),
      isFallback: this.isUsingFallback(),
      currentlyOpen: this.isCurrentlyOpen(),
    };
  }

  // Destroy method for service coordinator
  destroy() {
    console.log('🧹 Destroying footer service');
    appState.delete('footer');
  }
}

// Create singleton instance
export const footerService = new FooterService();

// Development helpers
if (import.meta.env.DEV) {
  window.footerService = footerService;

  // Debug helper
  window.debugFooter = () => {
    console.group('🔍 Footer Service Debug');
    console.log('Status:', footerService.getStatus());
    console.log('Config:', footerService.getConfig());
    console.log("Today's hours:", footerService.getTodayHours());
    console.log('Currently open:', footerService.isCurrentlyOpen());
    console.log('State:', appState.get('footer'));
    console.groupEnd();
  };

  // Test state reactivity
  window.watchFooter = () => {
    return appState.subscribe('footer.config', (newConfig, oldConfig) => {
      console.log('📊 Footer config changed:', { oldConfig, newConfig });
    });
  };

  console.log('🔧 Footer Service development helpers:');
  console.log('  - window.footerService - Service instance');
  console.log('  - window.debugFooter() - Show debug info');
  console.log('  - window.watchFooter() - Watch config changes');
}

console.log('✅ Enhanced Footer Service ready');
