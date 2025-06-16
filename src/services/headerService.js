// src/services/headerService.js - Fixed for Storyblok global-header
import { storyblok } from './storyblok.js';

class HeaderService {
  constructor() {
    this.cache = null;
    this.TTL = 5 * 60 * 1000; // 5 minutes
  }

  // Main method - get header config from Storyblok - KISS principle
  async getHeaderConfig() {
    console.log('🔄 Loading header from global-header story...');

    // Cache check
    if (this.cache && Date.now() - this.cache.timestamp < this.TTL) {
      console.log('📦 Using cached header config');
      return this.cache.data;
    }

    try {
      const story = await storyblok.getStory('global-header');
      const config = this.transformStoryToConfig(story.content);

      // Cache with timestamp
      this.cache = { data: config, timestamp: Date.now() };

      console.log('✅ Header config loaded from Storyblok');
      return config;
    } catch (error) {
      console.warn(
        '⚠️ Storyblok header failed, using fallback:',
        error.message
      );
      return this.getFallbackConfig();
    }
  }

  // Transform Storyblok content to header config - Economy of Expression
  transformStoryToConfig(content) {
    console.log('🔄 Transforming global-header content:', content);

    const config = {
      siteName: content.site_name || 'MUCHANDY',
      logo: content.logo_url?.filename,
      compactLogo: content.compact_logo_url?.filename,

      // Transform navigation items - Algorithmic Elegance
      navigation: {
        items: (content.navigation_items || [])
          .filter(
            (item) => item.component === 'nav_item' && item.label && item.url
          )
          .map((item) => ({
            id: item.label.toLowerCase().replace(/\s+/g, '-'),
            label: item.label,
            href: item.url,
            target: item.target || '_self',
          })),
      },

      contactInfo: {
        phone: content.contact_phone || '089 / 26949777',
        email: content.contact_email || 'info@muchandy.de',
        location: content.contact_location || 'Sendlinger Str. 7',
      },

      collapseThreshold: content.collapse_threshold || 100,
      callButtonText: content.call_button_text || 'Jetzt Anrufen',
      showStickyIcons: content.show_sticky_icons !== false,
      stickyIconsPosition: content.sticky_icons_position || 'right',
    };

    // Ensure at least basic navigation
    if (config.navigation.items.length === 0) {
      config.navigation = this.getFallbackNavigation();
    }

    console.log('✅ Header config transformed:', config);
    return config;
  }

  // Fallback configuration - Muchandy specific
  getFallbackConfig() {
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
    };
  }

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

  // Cache management - Maximum Conciseness
  clearCache = () => (this.cache = null);
  async refresh() {
    this.clearCache();
    return await this.getHeaderConfig();
  }
}

export const headerService = new HeaderService();

// Development helpers
if (import.meta.env.DEV) {
  window.headerService = headerService;
  console.log('🔧 HeaderService available at window.headerService');
}
