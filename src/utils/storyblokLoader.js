// src/utils/storyblokLoader.js
import { Page } from '@svarog-ui/core';
import { storyblokMapper } from './storyblokMapper.js';

/**
 * Storyblok API configuration
 */
const STORYBLOK_CONFIG = {
  baseUrl: 'https://api.storyblok.com/v2/cdn/stories',
  token: process.env.STORYBLOK_TOKEN || 'your-storyblok-token-here',
};

/**
 * Loads all global configurations and page content from Storyblok
 * @param {string} pageSlug - Page slug to load
 * @returns {Promise<Object>} Svarog Page component
 */
export const loadPageFromStoryblok = async (pageSlug) => {
  try {
    console.log(`🔄 Loading page: ${pageSlug}`);

    // Load all configurations in parallel for performance
    const [headerResponse, footerResponse, seoResponse, pageResponse] =
      await Promise.all([
        fetchStory('global-header'),
        fetchStory('global-footer'),
        fetchStory('global-seo'),
        fetchStory(`pages/${pageSlug}`),
      ]);

    const configs = {
      header: headerResponse.story.content,
      footer: footerResponse.story.content,
      seoDefaults: seoResponse.story.content,
      page: pageResponse.story,
    };

    console.log('✅ All configurations loaded successfully');

    return createPageFromStoryblokData(configs);
  } catch (error) {
    console.error('❌ Failed to load Storyblok data:', error);
    throw error;
  }
};

/**
 * Creates a page with loading states for better UX
 * @param {string} pageSlug - Page slug to load
 * @returns {Promise<Object>} Svarog Page component with loading handling
 */
export const createDynamicPageFromStoryblok = async (pageSlug) => {
  // Create page with loading state first
  const page = Page({
    id: `storyblok-${pageSlug}`,
    loading: true,
    loadingOptions: {
      message: 'Loading content...',
      showSpinner: true,
    },
    includeSkipLink: true,
  });

  try {
    // Load all Storyblok data
    const [headerResponse, footerResponse, seoResponse, pageResponse] =
      await Promise.all([
        fetchStory('global-header'),
        fetchStory('global-footer'),
        fetchStory('global-seo'),
        fetchStory(`pages/${pageSlug}`),
      ]);

    const configs = {
      header: headerResponse.story.content,
      footer: footerResponse.story.content,
      seoDefaults: seoResponse.story.content,
      page: pageResponse.story,
    };

    // Update page with actual content
    const pageContent = configs.page.content;
    const mergedSEO = createMergedSEO(
      configs.seoDefaults,
      pageContent.seo_config,
      configs.header
    );

    page.update({
      id: pageContent.page_id || configs.page.slug,
      type: pageContent.page_type || 'page',
      includeSkipLink: pageContent.include_skip_link !== false,
      loading: false,
      error: null,

      seo: mergedSEO,

      header: {
        components: [
          {
            component: 'header_from_storyblok',
            config: configs.header,
          },
        ],
      },

      content: {
        components: pageContent.content_components || [],
      },

      footer: {
        components: [
          {
            component: 'footer_from_storyblok',
            config: configs.footer,
          },
        ],
      },

      componentMapper: storyblokMapper,
    });

    // Render SEO to document head
    page.renderSEO();

    console.log('✅ Page updated with Storyblok content');
  } catch (error) {
    console.error('❌ Failed to load page:', error);

    // Show error state
    page.setError({
      title: 'Page Not Found',
      message: 'Could not load the requested page content.',
      code: error.status || 500,
    });
  }

  return page;
};

/**
 * Fetches a story from Storyblok API
 * @param {string} path - Story path
 * @returns {Promise<Object>} Story data
 */
const fetchStory = async (path) => {
  const url = `${STORYBLOK_CONFIG.baseUrl}/${path}?token=${STORYBLOK_CONFIG.token}&version=published`;

  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(
      `Failed to fetch ${path}: ${response.status} ${response.statusText}`
    );
  }

  return response.json();
};

/**
 * Creates a Svarog Page from Storyblok configurations
 * @param {Object} configs - All loaded configurations
 * @returns {Object} Svarog Page component
 */
const createPageFromStoryblokData = (configs) => {
  const pageContent = configs.page.content;
  const mergedSEO = createMergedSEO(
    configs.seoDefaults,
    pageContent.seo_config,
    configs.header
  );

  return Page({
    id: pageContent.page_id || configs.page.slug,
    type: pageContent.page_type || 'page',
    includeSkipLink: pageContent.include_skip_link !== false,

    seo: mergedSEO,

    header: {
      components: [
        {
          component: 'header_from_storyblok',
          config: configs.header,
        },
      ],
    },

    content: {
      components: pageContent.content_components || [],
    },

    footer: {
      components: [
        {
          component: 'footer_from_storyblok',
          config: configs.footer,
        },
      ],
    },

    componentMapper: storyblokMapper,
  });
};

/**
 * Merges global SEO defaults with page-specific SEO
 * @param {Object} seoDefaults - Global SEO configuration
 * @param {Object} pageSEO - Page-specific SEO
 * @param {Object} headerConfig - Header configuration for business data
 * @returns {Object} Merged SEO configuration
 */
const createMergedSEO = (seoDefaults, pageSEO = {}, headerConfig) => {
  return {
    // Basic SEO - page overrides defaults
    title: pageSEO.title
      ? `${pageSEO.title}${seoDefaults?.site_title_suffix || ''}`
      : `${headerConfig?.site_name || 'Page'}${seoDefaults?.site_title_suffix || ''}`,

    description: pageSEO.description || seoDefaults?.default_description,

    canonicalUrl:
      pageSEO.canonical_url ||
      `${seoDefaults?.canonical_base_url || ''}/${pageSEO.slug || ''}`,

    keywords: [
      ...(seoDefaults?.default_keywords?.split(',').map((k) => k.trim()) || []),
      ...(pageSEO.keywords || []),
    ].filter(Boolean),

    // Favicon from global defaults
    favicon: {
      basePath: seoDefaults?.favicon?.base_path || '/favicon',
      format: seoDefaults?.favicon?.format || 'png',
    },

    // PWA configuration from global defaults
    pwa: seoDefaults?.pwa
      ? {
          appName: seoDefaults.pwa.app_name,
          themeColor: seoDefaults.pwa.theme_color || '#2563eb',
          backgroundColor: seoDefaults.pwa.background_color || '#ffffff',
          manifestUrl: seoDefaults.pwa.manifest_url || '/site.webmanifest',
        }
      : undefined,

    // Local business schema combining global + header data
    localBusiness: {
      name: headerConfig?.site_name,
      businessType:
        seoDefaults?.business_schema?.business_type || 'LocalBusiness',
      description: seoDefaults?.default_description,
      phone: headerConfig?.contact_phone,
      email: headerConfig?.contact_email,
      address: headerConfig?.contact_location,
      priceRange: seoDefaults?.business_schema?.price_range,
      geo:
        seoDefaults?.business_schema?.geo_latitude &&
        seoDefaults?.business_schema?.geo_longitude
          ? {
              latitude: seoDefaults.business_schema.geo_latitude,
              longitude: seoDefaults.business_schema.geo_longitude,
            }
          : undefined,
    },

    // Analytics from global configuration
    analytics: seoDefaults?.analytics?.google_analytics_id
      ? {
          googleAnalytics: {
            measurementId: seoDefaults.analytics.google_analytics_id,
          },
        }
      : undefined,

    // Social sharing - page image or default
    openGraph: {
      title: pageSEO.title || headerConfig?.site_name,
      description: pageSEO.description || seoDefaults?.default_description,
      image:
        pageSEO.og_image?.filename || seoDefaults?.default_og_image?.filename,
      type: 'website',
    },

    twitterCard: {
      title: pageSEO.title || headerConfig?.site_name,
      description: pageSEO.description || seoDefaults?.default_description,
      image:
        pageSEO.og_image?.filename || seoDefaults?.default_og_image?.filename,
      type: seoDefaults?.default_twitter_card_type || 'summary_large_image',
    },
  };
};
