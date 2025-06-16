// src/services/footerService.js - Global footer from Storyblok
import { storyblok } from './storyblok.js';

class FooterService {
  constructor() {
    this.cache = null;
    this.TTL = 5 * 60 * 1000; // 5 minutes
  }

  // Get footer config from global-footer story - KISS principle
  async getFooterConfig() {
    console.log('🔄 Loading footer from global-footer story...');

    // Cache check
    if (this.cache && Date.now() - this.cache.timestamp < this.TTL) {
      console.log('📦 Using cached footer config');
      return this.cache.data;
    }

    try {
      const story = await storyblok.getStory('global-footer');
      const config = this.transformStoryToConfig(story.content);

      // Cache with timestamp
      this.cache = { data: config, timestamp: Date.now() };

      console.log('✅ Footer config loaded from Storyblok');
      return config;
    } catch (error) {
      console.warn(
        '⚠️ Storyblok footer failed, using fallback:',
        error.message
      );
      return this.getFallbackConfig();
    }
  }

  // Transform Storyblok content to footer config - Economy of Expression
  transformStoryToConfig(content) {
    console.log('🔄 Transforming global-footer content:', content);

    // Transform opening hours - Algorithmic Elegance
    const openingHours = (content.opening_hours || [])
      .filter((hour) => hour.component === 'opening_hour' && hour.day)
      .map((hour) => ({
        day: hour.day,
        open: hour.open,
        close: hour.close,
      }));

    const config = {
      siteName: content.business_name || 'MUCHANDY',
      description:
        content.business_description || 'Premium Mobile Solutions in München',

      contact: {
        phone: content.contact?.phone || '089 / 26949777',
        email: content.contact?.email || 'info@muchandy.de',
      },

      address: content.address
        ? {
            street: content.address.street || 'Sendlinger Str. 7',
            city: content.address.city || 'München',
            zip: content.address.zip || '80331',
          }
        : null,

      openingHours,

      footer: {
        copyright:
          content.copyright_text ||
          `© ${new Date().getFullYear()} Muchandy. Alle Rechte vorbehalten.`,

        // Standard footer links for German businesses - SMB focus
        links: [
          { label: 'Impressum', href: '/impressum' },
          { label: 'Datenschutz', href: '/datenschutz' },
          { label: 'AGB', href: '/agb' },
          { label: 'Widerrufsbelehrung', href: '/widerruf' },
          { label: 'Garantie', href: '/garantie' },
          { label: 'FAQ', href: '/faq' },
        ],

        social: [
          { platform: 'Facebook', href: 'https://facebook.com/muchandy' },
          { platform: 'Instagram', href: 'https://instagram.com/muchandy' },
          { platform: 'Google', href: 'https://g.page/muchandy' },
        ],
      },

      className: 'muchandy-footer',
    };

    console.log('✅ Footer config transformed:', config);
    return config;
  }

  // Fallback configuration - Muchandy specific
  getFallbackConfig() {
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
      },

      openingHours: [
        { day: 'Montag', open: '10:00', close: '19:00' },
        { day: 'Dienstag', open: '10:00', close: '19:00' },
        { day: 'Mittwoch', open: '10:00', close: '19:00' },
        { day: 'Donnerstag', open: '10:00', close: '19:00' },
        { day: 'Freitag', open: '10:00', close: '19:00' },
        { day: 'Samstag', open: '10:00', close: '18:00' },
      ],

      footer: {
        copyright: `© ${new Date().getFullYear()} Muchandy. Alle Rechte vorbehalten.`,
        links: [
          { label: 'Impressum', href: '/impressum' },
          { label: 'Datenschutz', href: '/datenschutz' },
          { label: 'AGB', href: '/agb' },
          { label: 'Widerrufsbelehrung', href: '/widerruf' },
          { label: 'Garantie', href: '/garantie' },
          { label: 'FAQ', href: '/faq' },
        ],
        social: [
          { platform: 'Facebook', href: 'https://facebook.com/muchandy' },
          { platform: 'Instagram', href: 'https://instagram.com/muchandy' },
          { platform: 'Google', href: 'https://g.page/muchandy' },
        ],
      },

      className: 'muchandy-footer',
    };
  }

  // Cache management - Maximum Conciseness
  clearCache = () => (this.cache = null);
  async refresh() {
    this.clearCache();
    return await this.getFooterConfig();
  }
}

export const footerService = new FooterService();

// Development helpers
if (import.meta.env.DEV) {
  window.footerService = footerService;
  console.log('🔧 FooterService available at window.footerService');
}
