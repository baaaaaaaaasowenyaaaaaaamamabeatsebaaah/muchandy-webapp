// src/services/seoService.js - Global SEO from Storyblok
import { storyblok } from './storyblok.js';

class SEOService {
  constructor() {
    this.cache = null;
    this.TTL = 10 * 60 * 1000; // 10 minutes (SEO changes less frequently)
  }

  // Get global SEO config - KISS principle
  async getGlobalSEO() {
    console.log('🔄 Loading SEO from global-seo story...');

    // Cache check
    if (this.cache && Date.now() - this.cache.timestamp < this.TTL) {
      console.log('📦 Using cached SEO config');
      return this.cache.data;
    }

    try {
      const story = await storyblok.getStory('global-seo');
      const config = this.transformStoryToSEO(story.content);

      // Cache with timestamp
      this.cache = { data: config, timestamp: Date.now() };

      console.log('✅ Global SEO loaded from Storyblok');
      return config;
    } catch (error) {
      console.warn('⚠️ Storyblok SEO failed, using fallback:', error.message);
      return this.getFallbackSEO();
    }
  }

  // Transform Storyblok content to SEO config - Economy of Expression
  transformStoryToSEO(content) {
    console.log('🔄 Transforming global-seo content:', content);

    const config = {
      // Basic SEO defaults
      siteTitleSuffix: content.site_title_suffix || ' | Muchandy',
      defaultDescription:
        content.default_description ||
        'Premium Mobile Solutions in München - Professionelle Handy-Reparaturen und Geräte-Verkauf',
      defaultKeywords: content.default_keywords
        ? content.default_keywords.split(',').map((k) => k.trim())
        : [
            'muchandy',
            'handy reparatur',
            'smartphone',
            'münchen',
            'display reparatur',
            'akku tausch',
          ],
      canonicalBaseUrl: content.canonical_base_url || 'https://muchandy.de',

      // Favicon configuration
      favicon: {
        basePath: content.favicon?.base_path || '/favicon',
        format: content.favicon?.format || 'png',
      },

      // PWA configuration - SMB focused
      pwa: content.pwa
        ? {
            appName: content.pwa.app_name || 'Muchandy',
            themeColor: content.pwa.theme_color || '#ff7f50',
            backgroundColor: content.pwa.background_color || '#ffffff',
            manifestUrl: content.pwa.manifest_url || '/site.webmanifest',
          }
        : null,

      // Analytics
      analytics: content.analytics?.google_analytics_id
        ? {
            googleAnalytics: {
              measurementId: content.analytics.google_analytics_id,
            },
          }
        : null,

      // Local business schema - Algorithmic Elegance
      businessSchema: {
        businessType:
          content.business_schema?.business_type || 'Electronics Store',
        priceRange: content.business_schema?.price_range || '€€',
        geo:
          content.business_schema?.geo_latitude &&
          content.business_schema?.geo_longitude
            ? {
                latitude: content.business_schema.geo_latitude,
                longitude: content.business_schema.geo_longitude,
              }
            : {
                latitude: 48.1351, // Munich coordinates
                longitude: 11.582,
              },
      },

      // Default social sharing image
      defaultOgImage: content.default_og_image?.filename,
      defaultTwitterCardType:
        content.default_twitter_card_type || 'summary_large_image',
    };

    console.log('✅ SEO config transformed:', config);
    return config;
  }

  // Merge global SEO with page-specific SEO - Maximum Conciseness
  async createPageSEO(pageData) {
    const globalSEO = await this.getGlobalSEO();

    return {
      title: pageData.seo_title
        ? `${pageData.seo_title}${globalSEO.siteTitleSuffix}`
        : `${pageData.title || 'Muchandy'}${globalSEO.siteTitleSuffix}`,

      description: pageData.seo_description || globalSEO.defaultDescription,

      keywords: [
        ...globalSEO.defaultKeywords,
        ...(pageData.seo_keywords || []),
      ].filter(Boolean),

      canonicalUrl: `${globalSEO.canonicalBaseUrl}/${pageData.slug === 'home' ? '' : pageData.slug}`,

      favicon: globalSEO.favicon,
      pwa: globalSEO.pwa,

      // Open Graph
      openGraph: {
        title: pageData.seo_title || pageData.title || 'Muchandy',
        description: pageData.seo_description || globalSEO.defaultDescription,
        image:
          pageData.seo_image?.filename ||
          globalSEO.defaultOgImage ||
          'https://muchandy.de/og-image.jpg',
        type: 'website',
        url: `${globalSEO.canonicalBaseUrl}/${pageData.slug === 'home' ? '' : pageData.slug}`,
        siteName: 'Muchandy',
      },

      // Twitter Card
      twitterCard: {
        card: globalSEO.defaultTwitterCardType,
        title: pageData.seo_title || pageData.title || 'Muchandy',
        description: pageData.seo_description || globalSEO.defaultDescription,
        image:
          pageData.seo_image?.filename ||
          globalSEO.defaultOgImage ||
          'https://muchandy.de/og-image.jpg',
      },

      // Local business data for Muchandy - SMB focus
      localBusiness: {
        name: 'Muchandy',
        businessType: globalSEO.businessSchema.businessType,
        description: globalSEO.defaultDescription,
        phone: '+49 89 26949777',
        email: 'info@muchandy.de',
        address: {
          street: 'Sendlinger Str. 7',
          city: 'München',
          state: 'Bayern',
          zip: '80331',
          country: 'DE',
        },
        url: globalSEO.canonicalBaseUrl,
        geo: globalSEO.businessSchema.geo,
        priceRange: globalSEO.businessSchema.priceRange,
        openingHours: [
          { day: 'Monday', open: '10:00', close: '19:00' },
          { day: 'Tuesday', open: '10:00', close: '19:00' },
          { day: 'Wednesday', open: '10:00', close: '19:00' },
          { day: 'Thursday', open: '10:00', close: '19:00' },
          { day: 'Friday', open: '10:00', close: '19:00' },
          { day: 'Saturday', open: '10:00', close: '18:00' },
        ],
        services: [
          'Handy Reparatur',
          'Display Reparatur',
          'Akku Tausch',
          'Smartphone Verkauf',
          'Gebrauchte Handys',
        ],
      },

      // FAQ for rich snippets - relevant to Muchandy business
      faqs:
        pageData.slug === 'home' || pageData.slug === 'kontakt'
          ? [
              {
                question: 'Welche Handy-Reparaturen bieten Sie an?',
                answer:
                  'Wir reparieren Displays, tauschen Akkus, reparieren Kameras und beheben Software-Probleme für alle gängigen Smartphone-Marken.',
              },
              {
                question: 'Wie lange dauert eine Reparatur?',
                answer:
                  'Die meisten Reparaturen können am selben Tag durchgeführt werden. Komplexere Reparaturen dauern 1-2 Werktage.',
              },
              {
                question: 'Bieten Sie Garantie auf Reparaturen?',
                answer:
                  'Ja, wir geben 6 Monate Garantie auf alle Reparaturen und verwendeten Ersatzteile.',
              },
            ]
          : undefined,

      analytics: globalSEO.analytics,
    };
  }

  // Fallback SEO configuration - Muchandy specific
  getFallbackSEO() {
    return {
      siteTitleSuffix: ' | Muchandy',
      defaultDescription:
        'Premium Mobile Solutions in München - Professionelle Handy-Reparaturen und Geräte-Verkauf',
      defaultKeywords: [
        'muchandy',
        'handy reparatur',
        'smartphone',
        'münchen',
        'display reparatur',
        'akku tausch',
      ],
      canonicalBaseUrl: 'https://muchandy.de',

      favicon: {
        basePath: '/favicon',
        format: 'png',
      },

      pwa: {
        appName: 'Muchandy',
        themeColor: '#ff7f50',
        backgroundColor: '#ffffff',
        manifestUrl: '/site.webmanifest',
      },

      businessSchema: {
        businessType: 'Electronics Store',
        priceRange: '€€',
        geo: {
          latitude: 48.1351,
          longitude: 11.582,
        },
      },

      defaultTwitterCardType: 'summary_large_image',
    };
  }

  // Cache management - Maximum Conciseness
  clearCache = () => (this.cache = null);
  async refresh() {
    this.clearCache();
    return await this.getGlobalSEO();
  }
}

export const seoService = new SEOService();

// Development helpers
if (import.meta.env.DEV) {
  window.seoService = seoService;
  console.log('🔧 SEOService available at window.seoService');
}
