// src/services/headerService.js - Debug Fix Version
import { storyblok } from './storyblok.js';

class HeaderService {
  constructor() {
    this.cache = null;
    this.cacheTime = null;
    this.TTL = 5 * 60 * 1000; // 5 minutes cache
  }

  // FIXED: Always return valid config
  async getHeaderConfig() {
    console.log('🔄 HeaderService.getHeaderConfig() called');

    // Return fallback immediately if no Storyblok token
    if (!import.meta.env.VITE_STORYBLOK_TOKEN) {
      console.log('⚠️ No Storyblok token, using fallback config');
      return this.getFallbackConfig();
    }

    // Check cache
    if (this.cache && Date.now() - this.cacheTime < this.TTL) {
      console.log('📦 Using cached header config');
      return this.cache;
    }

    try {
      console.log('🔄 Fetching header config from Storyblok...');
      const story = await storyblok.getStory('global-header');
      console.log('✅ Storyblok story loaded:', story);

      const config = this.transformStoryToConfig(story.content);
      console.log('✅ Config transformed:', config);

      // FIXED: Validate config before caching
      const validatedConfig = this.validateAndFixConfig(config);

      this.cache = validatedConfig;
      this.cacheTime = Date.now();

      console.log('✅ Header config cached');
      return validatedConfig;
    } catch (error) {
      console.warn(
        '⚠️ Storyblok header failed, using fallback:',
        error.message
      );
      return this.getFallbackConfig();
    }
  }

  // FIXED: Robust transformation with validation
  transformStoryToConfig(content) {
    console.log('🔄 Transforming Storyblok content:', content);

    if (!content) {
      console.warn('⚠️ Empty content, using fallback');
      return this.getFallbackConfig();
    }

    const config = {
      siteName: content.site_name || 'MUCHANDY',
      logo: content.logo_url?.filename,
      compactLogo: content.compact_logo_url?.filename,

      // FIXED: Ensure navigation object exists
      navigation: {
        items: [],
      },

      contactInfo: {
        location: content.contact_location || 'Sendlinger Str. 7',
        phone: content.contact_phone || '089 / 26949777',
        email: content.contact_email || 'info@muchandy.de',
      },

      collapseThreshold: content.collapse_threshold || 100,
      callButtonText: content.call_button_text || 'Jetzt Anrufen',
      showStickyIcons: content.show_sticky_icons !== false,
      stickyIconsPosition: content.sticky_icons_position || 'right',
    };

    // FIXED: Safe navigation items mapping
    if (content.navigation_items && Array.isArray(content.navigation_items)) {
      config.navigation.items = content.navigation_items
        .map((item) => {
          if (!item || typeof item !== 'object') return null;

          return {
            id:
              item.id ||
              item.label?.toLowerCase().replace(/\s+/g, '-') ||
              'item',
            label: item.label || 'Menu Item',
            href: item.href || '#',
            target: item.target || '_self',
            icon: item.icon,
          };
        })
        .filter((item) => item && item.label && item.href); // Remove invalid items
    }

    console.log('✅ Transformation complete:', config);
    return config;
  }

  // NEW: Validation and fixing method
  validateAndFixConfig(config) {
    console.log('🔍 Validating config:', config);

    // Ensure navigation exists and has items
    if (
      !config.navigation ||
      !config.navigation.items ||
      !Array.isArray(config.navigation.items)
    ) {
      console.warn('⚠️ Invalid navigation, using fallback navigation');
      config.navigation = this.getFallbackNavigation();
    }

    // Ensure at least one navigation item
    if (config.navigation.items.length === 0) {
      console.warn('⚠️ Empty navigation items, using fallback navigation');
      config.navigation = this.getFallbackNavigation();
    }

    // Validate each navigation item
    config.navigation.items = config.navigation.items.map((item) => {
      if (!item.id)
        item.id = item.label?.toLowerCase().replace(/\s+/g, '-') || 'item';
      if (!item.label) item.label = 'Menu Item';
      if (!item.href) item.href = '#';
      if (!item.target) item.target = '_self';
      return item;
    });

    // Ensure contactInfo exists
    if (!config.contactInfo) {
      config.contactInfo = {
        location: 'Sendlinger Str. 7',
        phone: '089 / 26949777',
        email: 'info@muchandy.de',
      };
    }

    console.log('✅ Config validated and fixed:', config);
    return config;
  }

  // NEW: Get fallback navigation
  getFallbackNavigation() {
    return {
      items: [
        { id: 'repair', label: 'Reparatur', href: '/reparatur' },
        { id: 'purchase', label: 'Ankauf', href: '/ankauf' },
        { id: 'used', label: 'Gebrauchte', href: '/gebrauchte' },
        { id: 'services', label: 'Services', href: '/services' },
        { id: 'find-us', label: 'Kontakt', href: '/kontakt' },
      ],
    };
  }

  // FIXED: Robust fallback config (always valid)
  getFallbackConfig() {
    console.log('📋 Using fallback header config');

    const config = {
      siteName: 'MUCHANDY',
      logo: '/favicon.png', // Use local favicon
      compactLogo: '/favicon.png', // Use local favicon

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

    console.log('✅ Fallback config created:', config);
    return config;
  }

  // Cache management
  clearCache() {
    console.log('🗑️ Header cache cleared');
    this.cache = null;
    this.cacheTime = null;
  }

  async refresh() {
    this.clearCache();
    return await this.getHeaderConfig();
  }

  // ENHANCED: Better debugging info
  getConfigSummary(config = this.cache) {
    if (!config) return 'No config loaded';

    return {
      siteName: config.siteName,
      navigationItems: config.navigation?.items?.length || 0,
      hasLogo: !!config.logo,
      hasCompactLogo: !!config.compactLogo,
      contactPhone: config.contactInfo?.phone,
      cacheAge: this.cacheTime
        ? Math.round((Date.now() - this.cacheTime) / 1000) + 's'
        : 'none',
      navigationValid: !!(
        config.navigation &&
        config.navigation.items &&
        config.navigation.items.length > 0
      ),
    };
  }

  // NEW: Debug method
  async debug() {
    console.log('🔍 HeaderService Debug Info:');
    console.log(
      '- Has Storyblok token:',
      !!import.meta.env.VITE_STORYBLOK_TOKEN
    );
    console.log('- Cache state:', this.cache ? 'cached' : 'empty');
    console.log(
      '- Cache age:',
      this.cacheTime
        ? Math.round((Date.now() - this.cacheTime) / 1000) + 's'
        : 'none'
    );

    try {
      const config = await this.getHeaderConfig();
      console.log('- Config summary:', this.getConfigSummary(config));
      console.log('- Navigation items:', config.navigation.items);
      return config;
    } catch (error) {
      console.error('- Debug failed:', error);
      return null;
    }
  }
}

// Export singleton instance
export const headerService = new HeaderService();

// Development mode enhancements
if (import.meta.env.DEV) {
  window.headerService = headerService;
  console.log('🔧 HeaderService exposed to window.headerService for debugging');

  // Auto-debug on load
  setTimeout(() => {
    console.log('🔍 Auto-debugging HeaderService...');
    headerService.debug();
  }, 1000);
}

console.log('✅ HeaderService (Debug Version) ready');
