// src/services/seoService.js - Enhanced with coordinated loading
import { appState } from '../utils/stateStore.js';
import { storyblok } from './storyblok.js';

console.log('=== ENHANCED SEO SERVICE LOADING ===');

class SEOService {
  constructor() {
    this.storySlug = 'global-seo';
    console.log('✅ SEOService initialized');
  }

  // Service lifecycle method for coordinator - KISS principle
  async load() {
    console.log('🚀 Loading SEO service...');

    try {
      // Mark service as loading
      appState.set('services.seo.loading', true);

      // Load global SEO configuration
      const config = await this.getGlobalSEO();

      // Mark service as ready
      appState.set('services.seo.ready', true);
      appState.set('services.seo.loading', false);

      console.log('✅ SEO service loaded');
      return config;
    } catch (error) {
      appState.set('services.seo.error', error.message);
      appState.set('services.seo.loading', false);
      throw error;
    }
  }

  // Get global SEO config with state integration - Economy of Expression
  async getGlobalSEO() {
    console.log('🔄 Loading global SEO configuration...');

    // Check state first
    const cached = appState.get('seo.global');
    if (cached) {
      console.log('📦 Global SEO config from state');
      return cached;
    }

    try {
      // Wait for Storyblok service to be ready
      await appState.waitFor('services.storyblok.ready');

      // Get story from Storyblok (already cached there)
      const story = await storyblok.getStory(this.storySlug);
      const config = this.transformStoryToSEO(story.content);

      // Store in state
      appState.set('seo.global', config);
      appState.set('seo.story', story);

      console.log('✅ Global SEO config loaded from Storyblok');
      return config;
    } catch (error) {
      console.warn('⚠️ Failed to load SEO from Storyblok:', error.message);

      // Use fallback configuration
      const fallback = this.getFallbackSEO();
      appState.set('seo.global', fallback);
      appState.set('seo.isFallback', true);

      return fallback;
    }
  }

  // Transform Storyblok content to SEO config - Algorithmic Elegance
  transformStoryToSEO(content) {
    console.log('🔄 Transforming global SEO content');

    const config = {
      // Basic SEO defaults
      siteTitleSuffix: content.site_title_suffix || ' | Muchandy',
      siteTitleSeparator: content.site_title_separator || '|',
      defaultTitle:
        content.default_title || 'Muchandy - Premium Mobile Solutions',
      defaultDescription:
        content.default_description ||
        'Premium Mobile Solutions in München - Professionelle Handy-Reparaturen und Geräte-Verkauf',

      // Keywords handling
      defaultKeywords: this.parseKeywords(content.default_keywords),

      // URLs
      canonicalBaseUrl: content.canonical_base_url || 'https://muchandy.de',

      // Favicon configuration
      favicon: {
        basePath: content.favicon?.base_path || '/favicon',
        format: content.favicon?.format || 'png',
        sizes: content.favicon?.sizes || ['16x16', '32x32', '96x96', '192x192'],
        appleTouchIcon:
          content.favicon?.apple_touch_icon || '/apple-touch-icon.png',
      },

      // PWA configuration
      pwa: content.pwa
        ? {
            appName: content.pwa.app_name || 'Muchandy',
            shortName: content.pwa.short_name || 'Muchandy',
            themeColor: content.pwa.theme_color || '#ff7f50',
            backgroundColor: content.pwa.background_color || '#ffffff',
            display: content.pwa.display || 'standalone',
            orientation: content.pwa.orientation || 'portrait',
            manifestUrl: content.pwa.manifest_url || '/site.webmanifest',
          }
        : null,

      // Analytics
      analytics: {
        googleAnalytics: content.analytics?.google_analytics_id
          ? {
              measurementId: content.analytics.google_analytics_id,
              anonymizeIp: content.analytics.anonymize_ip !== false,
            }
          : null,
        googleTagManager: content.analytics?.google_tag_manager_id
          ? {
              containerId: content.analytics.google_tag_manager_id,
            }
          : null,
      },

      // Local business schema
      businessSchema: {
        businessType:
          content.business_schema?.business_type || 'ElectronicsStore',
        priceRange: content.business_schema?.price_range || '€€',
        currenciesAccepted:
          content.business_schema?.currencies_accepted || 'EUR',
        paymentAccepted: content.business_schema?.payment_accepted || [
          'Cash',
          'Credit Card',
          'Debit Card',
        ],
        geo:
          content.business_schema?.geo_latitude &&
          content.business_schema?.geo_longitude
            ? {
                latitude: parseFloat(content.business_schema.geo_latitude),
                longitude: parseFloat(content.business_schema.geo_longitude),
              }
            : {
                latitude: 48.1351, // Munich coordinates
                longitude: 11.582,
              },
      },

      // Social media defaults
      social: {
        defaultOgImage: content.default_og_image?.filename,
        defaultOgType: content.default_og_type || 'website',
        defaultTwitterCardType:
          content.default_twitter_card_type || 'summary_large_image',
        twitterSite: content.twitter_site || '@muchandy',
        facebookAppId: content.facebook_app_id,
      },

      // Robots configuration
      robots: {
        index: content.robots?.index !== false,
        follow: content.robots?.follow !== false,
        maxSnippet: content.robots?.max_snippet || -1,
        maxImagePreview: content.robots?.max_image_preview || 'large',
        maxVideoPreview: content.robots?.max_video_preview || -1,
      },

      // Language and region
      language: content.language || 'de',
      region: content.region || 'DE',
      locale: content.locale || 'de_DE',
    };

    console.log('✅ SEO config transformed');
    return config;
  }

  // Parse keywords string into array - Maximum Conciseness
  parseKeywords(keywordsString) {
    if (!keywordsString) {
      return [
        'muchandy',
        'handy reparatur',
        'smartphone',
        'münchen',
        'display reparatur',
        'akku tausch',
      ];
    }

    return keywordsString
      .split(',')
      .map((k) => k.trim())
      .filter(Boolean);
  }

  // Create page-specific SEO by merging with global - KISS approach
  async createPageSEO(pageData) {
    console.log('🔄 Creating page SEO for:', pageData.slug);

    // Get global SEO config
    const globalSEO = await this.getGlobalSEO();

    // Build page SEO
    const pageSEO = {
      // Title handling
      title: this.buildPageTitle(pageData, globalSEO),

      // Description
      description:
        pageData.seo_description ||
        pageData.description ||
        globalSEO.defaultDescription,

      // Keywords - merge global and page
      keywords: [
        ...globalSEO.defaultKeywords,
        ...(pageData.seo_keywords || []),
      ].filter((k, i, arr) => arr.indexOf(k) === i), // Remove duplicates

      // URLs
      canonicalUrl: this.buildCanonicalUrl(pageData.slug, globalSEO),

      // Language alternates
      alternates: this.buildAlternates(pageData, globalSEO),

      // Favicon and PWA from global
      favicon: globalSEO.favicon,
      pwa: globalSEO.pwa,

      // Open Graph
      openGraph: {
        title: pageData.og_title || pageData.seo_title || pageData.title,
        description:
          pageData.og_description ||
          pageData.seo_description ||
          globalSEO.defaultDescription,
        image:
          pageData.og_image?.filename ||
          pageData.seo_image?.filename ||
          globalSEO.social.defaultOgImage,
        type: pageData.og_type || globalSEO.social.defaultOgType,
        url: this.buildCanonicalUrl(pageData.slug, globalSEO),
        siteName: 'Muchandy',
        locale: globalSEO.locale,
      },

      // Twitter Card
      twitterCard: {
        card:
          pageData.twitter_card_type || globalSEO.social.defaultTwitterCardType,
        title: pageData.twitter_title || pageData.seo_title || pageData.title,
        description:
          pageData.twitter_description ||
          pageData.seo_description ||
          globalSEO.defaultDescription,
        image:
          pageData.twitter_image?.filename ||
          pageData.seo_image?.filename ||
          globalSEO.social.defaultOgImage,
        site: globalSEO.social.twitterSite,
      },

      // Structured data
      structuredData: this.buildStructuredData(pageData, globalSEO),

      // Analytics
      analytics: globalSEO.analytics,

      // Robots
      robots: pageData.robots || globalSEO.robots,

      // Language
      language: globalSEO.language,
      locale: globalSEO.locale,
    };

    // Cache page SEO
    appState.set(`seo.pages.${pageData.slug}`, pageSEO);

    return pageSEO;
  }

  // Build page title with suffix - Economy of Expression
  buildPageTitle(pageData, globalSEO) {
    if (pageData.seo_title) {
      return `${pageData.seo_title}${globalSEO.siteTitleSuffix}`;
    }

    if (pageData.title) {
      return `${pageData.title}${globalSEO.siteTitleSuffix}`;
    }

    return globalSEO.defaultTitle;
  }

  // Build canonical URL
  buildCanonicalUrl(slug, globalSEO) {
    const baseUrl = globalSEO.canonicalBaseUrl.replace(/\/$/, '');
    const cleanSlug = slug === 'home' ? '' : slug.replace(/^\//, '');
    return cleanSlug ? `${baseUrl}/${cleanSlug}` : baseUrl;
  }

  // Build language alternates
  buildAlternates(pageData, globalSEO) {
    // For now, just German - can be extended
    return [
      {
        hreflang: 'de',
        href: this.buildCanonicalUrl(pageData.slug, globalSEO),
      },
    ];
  }

  // Build structured data - Algorithmic Elegance
  buildStructuredData(pageData, globalSEO) {
    const structuredData = [];

    // Local Business (on home and contact pages)
    if (['home', 'kontakt'].includes(pageData.slug)) {
      structuredData.push({
        '@context': 'https://schema.org',
        '@type': globalSEO.businessSchema.businessType,
        name: 'Muchandy',
        description: globalSEO.defaultDescription,
        url: globalSEO.canonicalBaseUrl,
        telephone: '+49 89 26949777',
        email: 'info@muchandy.de',
        address: {
          '@type': 'PostalAddress',
          streetAddress: 'Sendlinger Str. 7',
          addressLocality: 'München',
          postalCode: '80331',
          addressCountry: 'DE',
        },
        geo: {
          '@type': 'GeoCoordinates',
          latitude: globalSEO.businessSchema.geo.latitude,
          longitude: globalSEO.businessSchema.geo.longitude,
        },
        priceRange: globalSEO.businessSchema.priceRange,
        currenciesAccepted: globalSEO.businessSchema.currenciesAccepted,
        paymentAccepted: globalSEO.businessSchema.paymentAccepted,
        openingHoursSpecification: this.getOpeningHoursSchema(),
      });
    }

    // FAQ Schema (if page has FAQs)
    if (pageData.faqs && pageData.faqs.length > 0) {
      structuredData.push({
        '@context': 'https://schema.org',
        '@type': 'FAQPage',
        mainEntity: pageData.faqs.map((faq) => ({
          '@type': 'Question',
          name: faq.question,
          acceptedAnswer: {
            '@type': 'Answer',
            text: faq.answer,
          },
        })),
      });
    }

    // BreadcrumbList
    if (pageData.breadcrumbs) {
      structuredData.push({
        '@context': 'https://schema.org',
        '@type': 'BreadcrumbList',
        itemListElement: pageData.breadcrumbs.map((crumb, index) => ({
          '@type': 'ListItem',
          position: index + 1,
          name: crumb.name,
          item: crumb.url,
        })),
      });
    }

    return structuredData;
  }

  // Get opening hours schema from footer service
  getOpeningHoursSchema() {
    const footerConfig = appState.get('footer.config');
    if (!footerConfig?.openingHours) return [];

    const dayMap = {
      Montag: 'Monday',
      Dienstag: 'Tuesday',
      Mittwoch: 'Wednesday',
      Donnerstag: 'Thursday',
      Freitag: 'Friday',
      Samstag: 'Saturday',
      Sonntag: 'Sunday',
    };

    return footerConfig.openingHours
      .filter((hours) => !hours.closed)
      .map((hours) => ({
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: dayMap[hours.day] || hours.day,
        opens: hours.open,
        closes: hours.close,
      }));
  }

  // Fallback SEO configuration
  getFallbackSEO() {
    console.log('📋 Using fallback SEO configuration');

    return {
      siteTitleSuffix: ' | Muchandy',
      siteTitleSeparator: '|',
      defaultTitle: 'Muchandy - Premium Mobile Solutions',
      defaultDescription:
        'Premium Mobile Solutions in München - Professionelle Handy-Reparaturen und Geräte-Verkauf',
      defaultKeywords: [
        'muchandy',
        'handy reparatur',
        'smartphone',
        'münchen',
        'display reparatur',
        'akku tausch',
        'iphone reparatur',
        'samsung reparatur',
        'handy verkauf',
      ],
      canonicalBaseUrl: 'https://muchandy.de',

      favicon: {
        basePath: '/favicon',
        format: 'png',
        sizes: ['16x16', '32x32', '96x96', '192x192'],
        appleTouchIcon: '/apple-touch-icon.png',
      },

      pwa: {
        appName: 'Muchandy',
        shortName: 'Muchandy',
        themeColor: '#ff7f50',
        backgroundColor: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        manifestUrl: '/site.webmanifest',
      },

      businessSchema: {
        businessType: 'ElectronicsStore',
        priceRange: '€€',
        currenciesAccepted: 'EUR',
        paymentAccepted: ['Cash', 'Credit Card', 'Debit Card'],
        geo: {
          latitude: 48.1351,
          longitude: 11.582,
        },
      },

      social: {
        defaultOgType: 'website',
        defaultTwitterCardType: 'summary_large_image',
        twitterSite: '@muchandy',
      },

      robots: {
        index: true,
        follow: true,
        maxSnippet: -1,
        maxImagePreview: 'large',
        maxVideoPreview: -1,
      },

      language: 'de',
      region: 'DE',
      locale: 'de_DE',
    };
  }

  // Refresh SEO configuration
  async refresh() {
    console.log('🔄 Refreshing SEO configuration...');

    // Clear state cache
    appState.delete('seo.global');
    appState.delete('seo.story');
    appState.delete('seo.pages');
    appState.delete('seo.isFallback');

    // Reload
    return this.getGlobalSEO();
  }

  // Get service status
  getStatus() {
    return {
      ready: appState.get('services.seo.ready') || false,
      loading: appState.get('services.seo.loading') || false,
      error: appState.get('services.seo.error'),
      hasGlobalConfig: !!appState.get('seo.global'),
      isFallback: appState.get('seo.isFallback') === true,
      cachedPages: Object.keys(appState.get('seo.pages') || {}).length,
    };
  }

  // Destroy method for service coordinator
  destroy() {
    console.log('🧹 Destroying SEO service');
    appState.delete('seo');
  }
}

// Create singleton instance
export const seoService = new SEOService();

// Development helpers
if (import.meta.env.DEV) {
  window.seoService = seoService;

  // Debug helper
  window.debugSEO = () => {
    console.group('🔍 SEO Service Debug');
    console.log('Status:', seoService.getStatus());
    console.log('Global config:', appState.get('seo.global'));
    console.log('Cached pages:', appState.get('seo.pages'));
    console.log('State:', appState.get('seo'));
    console.groupEnd();
  };

  // Test page SEO generation
  window.testPageSEO = async (slug = 'home') => {
    const testPageData = {
      slug,
      title: 'Test Page',
      seo_title: 'Test Page SEO Title',
      seo_description: 'Test page description for SEO',
      seo_keywords: ['test', 'page'],
    };

    const pageSEO = await seoService.createPageSEO(testPageData);
    console.log('Generated page SEO:', pageSEO);
    return pageSEO;
  };

  console.log('🔧 SEO Service development helpers:');
  console.log('  - window.seoService - Service instance');
  console.log('  - window.debugSEO() - Show debug info');
  console.log('  - window.testPageSEO(slug) - Test page SEO generation');
}

console.log('✅ Enhanced SEO Service ready');
