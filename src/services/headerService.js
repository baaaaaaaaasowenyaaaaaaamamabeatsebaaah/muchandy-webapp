// src/services/headerService.js - Enhanced with strict Storyblok-first approach
import { appState } from '../utils/stateStore.js';
import { storyblok } from './storyblok.js';

console.log('=== ENHANCED HEADER SERVICE WITH STORYBLOK-FIRST LOADING ===');

/**
 * Storyblok Validation Error for header-specific issues
 */
class HeaderStoryblokError extends Error {
  constructor(field, message) {
    super(`[HeaderService] Storyblok field '${field}': ${message}`);
    this.field = field;
    this.component = 'HeaderService';
  }
}

/**
 * Enhanced Header Service with strict Storyblok requirements
 */
class HeaderService {
  constructor() {
    this.storySlug = 'global-header';
    this.requiredFields = [
      'site_name',
      'contact_phone',
      'contact_email',
      'contact_location',
      'navigation_items',
    ];
    console.log(
      '✅ HeaderService initialized with strict Storyblok requirements'
    );
  }

  /**
   * Service lifecycle method for coordinator - KISS principle
   */
  async load() {
    console.log('🚀 Loading header service with Storyblok validation...');

    try {
      // Mark service as loading
      appState.set('services.header.loading', true);

      // Load header configuration - MUST succeed
      const config = await this.getHeaderConfig();

      // Mark service as ready
      appState.set('services.header.ready', true);
      appState.set('services.header.loading', false);

      console.log('✅ Header service loaded successfully');
      return config;
    } catch (error) {
      console.error('❌ Header service load failed:', error.message);
      appState.set('services.header.error', error.message);
      appState.set('services.header.loading', false);

      // In strict mode, we throw the error instead of using fallbacks
      throw new Error(`Header service initialization failed: ${error.message}`);
    }
  }

  /**
   * Get header config with strict Storyblok validation - Economy of Expression
   */
  async getHeaderConfig() {
    console.log(
      '🔄 Loading header configuration from Storyblok (strict mode)...'
    );

    // Check state first
    const cached = appState.get('header.config');
    if (cached && !cached.isFallback) {
      console.log('📦 Header config from state');
      return cached;
    }

    try {
      // Wait for Storyblok service to be ready - REQUIRED
      console.log('⏳ Waiting for Storyblok service...');
      await appState.waitFor('services.storyblok.ready', 10000);

      // Get story from Storyblok - MUST succeed
      console.log(`📖 Loading story: ${this.storySlug}`);
      const story = await storyblok.getStory(this.storySlug);

      if (!story) {
        throw new HeaderStoryblokError(
          'story',
          `Story '${this.storySlug}' not found in Storyblok`
        );
      }

      if (!story.content) {
        throw new HeaderStoryblokError(
          'story.content',
          `Story '${this.storySlug}' has no content`
        );
      }

      // Validate Storyblok component type
      if (story.content.component !== 'global_header') {
        throw new HeaderStoryblokError(
          'component',
          `Expected 'global_header', got '${story.content.component}' in story '${this.storySlug}'`
        );
      }

      // Validate required fields exist in Storyblok
      this.validateStoryblokContent(story.content);

      // Transform Storyblok content to component config
      const config = this.transformStoryToConfig(story.content);

      // Validate transformed config
      this.validateTransformedConfig(config);

      // Store in state
      appState.set('header.config', config);
      appState.set('header.story', story);
      appState.set('header.lastUpdated', Date.now());

      console.log('✅ Header config loaded and validated from Storyblok');
      return config;
    } catch (error) {
      console.error('❌ Failed to load header from Storyblok:', error.message);

      // In strict mode, DO NOT use fallback - let it fail
      // This ensures we fix Storyblok configuration first
      throw new Error(
        `Header configuration failed: ${error.message}. Please check your Storyblok '${this.storySlug}' story.`
      );
    }
  }

  /**
   * Validate that Storyblok content has all required fields
   */
  validateStoryblokContent(content) {
    console.log('🔍 Validating Storyblok content...');

    const errors = [];

    // Check required text fields
    this.requiredFields.forEach((field) => {
      const value = content[field];
      if (!value || (typeof value === 'string' && value.trim() === '')) {
        errors.push(`'${field}' is required but missing or empty`);
      }
    });

    // Validate navigation_items specifically
    if (content.navigation_items) {
      if (!Array.isArray(content.navigation_items)) {
        errors.push("'navigation_items' must be an array");
      } else if (content.navigation_items.length === 0) {
        errors.push("'navigation_items' array cannot be empty");
      } else {
        // Validate each navigation item
        content.navigation_items.forEach((item, index) => {
          if (!item.component || item.component !== 'nav_item') {
            errors.push(
              `navigation_items[${index}] must have component: 'nav_item'`
            );
          }
          if (!item.label || item.label.trim() === '') {
            errors.push(`navigation_items[${index}] missing required 'label'`);
          }
          if (!item.url || item.url.trim() === '') {
            errors.push(`navigation_items[${index}] missing required 'url'`);
          }
        });
      }
    }

    // Check for logo warnings (not errors since logos are optional)
    if (!content.logo_url) {
      console.warn(
        '⚠️ No logo_url found in Storyblok - header will show siteName text'
      );
    }

    if (!content.compact_logo_url) {
      console.warn(
        '⚠️ No compact_logo_url found in Storyblok - will use main logo for collapsed state'
      );
    }

    if (errors.length > 0) {
      console.error('❌ Storyblok validation errors:', errors);
      throw new HeaderStoryblokError(
        'validation',
        `Storyblok content validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`
      );
    }

    console.log('✅ Storyblok content validation passed');
  }

  /**
   * Transform Storyblok content to header config - Algorithmic Elegance
   */
  transformStoryToConfig(content) {
    console.log('🔄 Transforming Storyblok content to header config...');

    try {
      const config = {
        // Basic info - REQUIRED from Storyblok
        siteName: content.site_name.trim(),

        // Logos - Optional from Storyblok
        logo: content.logo_url?.filename || null,
        compactLogo:
          content.compact_logo_url?.filename ||
          content.logo_url?.filename ||
          null,

        // Transform navigation items - REQUIRED from Storyblok
        navigation: {
          items: content.navigation_items
            .filter(
              (item) => item.component === 'nav_item' && item.label && item.url
            )
            .map((item) => ({
              id: this.generateNavId(item.label),
              label: item.label.trim(),
              href: item.url.trim(),
              target: item.target || '_self',
              icon: item.icon?.filename || null,
            })),
        },

        // Contact information - REQUIRED from Storyblok
        contactInfo: {
          phone: content.contact_phone.trim(),
          email: content.contact_email.trim(),
          location: content.contact_location.trim(),
        },

        // Behavior settings from Storyblok with defaults
        collapseThreshold:
          typeof content.collapse_threshold === 'number'
            ? content.collapse_threshold
            : 100,
        callButtonText: content.call_button_text?.trim() || 'Jetzt Anrufen',
        showStickyIcons: content.show_sticky_icons !== false,
        stickyIconsPosition: content.sticky_icons_position || 'right',

        // Additional settings
        className: 'muchandy-header',
        transparent: content.transparent_header === true,
        sticky: content.sticky_header !== false,

        // Metadata
        lastUpdated: Date.now(),
        source: 'storyblok',
        storyId: content._uid,
      };

      console.log('✅ Storyblok content transformed successfully');
      console.log(`   Site: ${config.siteName}`);
      console.log(`   Navigation items: ${config.navigation.items.length}`);
      console.log(`   Contact: ${config.contactInfo.phone}`);
      console.log(`   Logo: ${config.logo ? 'Yes' : 'No'}`);
      console.log(`   Compact logo: ${config.compactLogo ? 'Yes' : 'No'}`);

      return config;
    } catch (error) {
      throw new HeaderStoryblokError(
        'transformation',
        `Failed to transform Storyblok content: ${error.message}`
      );
    }
  }

  /**
   * Validate the transformed config before returning
   */
  validateTransformedConfig(config) {
    console.log('🔍 Validating transformed config...');

    const errors = [];

    // Validate required config fields
    if (!config.siteName)
      errors.push('siteName is required after transformation');
    if (!config.navigation?.items?.length)
      errors.push(
        'navigation.items must have at least one item after transformation'
      );
    if (!config.contactInfo?.phone)
      errors.push('contactInfo.phone is required after transformation');
    if (!config.contactInfo?.email)
      errors.push('contactInfo.email is required after transformation');
    if (!config.contactInfo?.location)
      errors.push('contactInfo.location is required after transformation');

    // Validate navigation items structure
    if (config.navigation?.items) {
      config.navigation.items.forEach((item, index) => {
        if (!item.id)
          errors.push(
            `navigation.items[${index}] missing id after transformation`
          );
        if (!item.label)
          errors.push(
            `navigation.items[${index}] missing label after transformation`
          );
        if (!item.href)
          errors.push(
            `navigation.items[${index}] missing href after transformation`
          );
      });
    }

    // Validate contact info format
    if (config.contactInfo?.email && !config.contactInfo.email.includes('@')) {
      errors.push('contactInfo.email must be a valid email address');
    }

    if (errors.length > 0) {
      throw new HeaderStoryblokError(
        'config_validation',
        `Transformed config validation failed:\n${errors.map((e) => `  - ${e}`).join('\n')}`
      );
    }

    console.log('✅ Transformed config validation passed');
  }

  /**
   * Generate navigation item ID from label - Maximum Conciseness
   */
  generateNavId(label) {
    return label
      .toLowerCase()
      .replace(
        /[äöü]/g,
        (char) => ({ ä: 'ae', ö: 'oe', ü: 'ue' })[char] || char
      )
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '')
      .replace(/-+/g, '-')
      .replace(/^-|-$/g, '');
  }

  /**
   * Refresh header configuration from Storyblok - Economy of Expression
   */
  async refresh() {
    console.log('🔄 Refreshing header configuration from Storyblok...');

    try {
      // Clear state cache
      appState.delete('header.config');
      appState.delete('header.story');
      appState.delete('header.lastUpdated');

      // Clear Storyblok cache for this story
      storyblok.evictStory(this.storySlug);

      // Reload configuration
      const config = await this.getHeaderConfig();

      console.log('✅ Header configuration refreshed successfully');
      return config;
    } catch (error) {
      console.error(
        '❌ Failed to refresh header configuration:',
        error.message
      );
      throw error;
    }
  }

  /**
   * Update specific header properties - with validation
   */
  updateConfig(updates) {
    console.log('📝 Updating header config:', Object.keys(updates));

    const currentConfig = appState.get('header.config');
    if (!currentConfig) {
      throw new Error('No header config to update - load configuration first');
    }

    // Merge updates
    const newConfig = {
      ...currentConfig,
      ...updates,
      lastUpdated: Date.now(),
    };

    // Re-validate the updated config
    try {
      this.validateTransformedConfig(newConfig);
      appState.set('header.config', newConfig);
      console.log('✅ Header config updated successfully');
      return newConfig;
    } catch (error) {
      console.error('❌ Config update validation failed:', error.message);
      throw error;
    }
  }

  /**
   * Get current configuration from state
   */
  getConfig() {
    return appState.get('header.config');
  }

  /**
   * Check if using fallback (in strict mode, should always be false)
   */
  isUsingFallback() {
    const config = appState.get('header.config');
    return config?.isFallback === true;
  }

  /**
   * Get service status with detailed information
   */
  getStatus() {
    const config = appState.get('header.config');
    return {
      ready: appState.get('services.header.ready') || false,
      loading: appState.get('services.header.loading') || false,
      error: appState.get('services.header.error'),
      hasConfig: !!config,
      configSource: config?.source || 'unknown',
      lastUpdated: config?.lastUpdated || null,
      isFallback: this.isUsingFallback(),
      storySlug: this.storySlug,
      requiredFields: this.requiredFields,
    };
  }

  /**
   * Test Storyblok connection and data availability
   */
  async testStoryblokConnection() {
    console.log('🧪 Testing Storyblok connection for header...');

    try {
      // Test basic story loading
      const story = await storyblok.getStory(this.storySlug);

      if (!story) {
        throw new Error(`Story '${this.storySlug}' not found`);
      }

      // Test content validation
      this.validateStoryblokContent(story.content);

      // Test transformation
      const config = this.transformStoryToConfig(story.content);
      this.validateTransformedConfig(config);

      console.log('✅ Storyblok connection test passed');
      return {
        success: true,
        story: story.name,
        lastModified: story.published_at,
        fieldsCount: Object.keys(story.content).length,
        navItemsCount: story.content.navigation_items?.length || 0,
      };
    } catch (error) {
      console.error('❌ Storyblok connection test failed:', error.message);
      return {
        success: false,
        error: error.message,
        suggestions: this.getErrorSuggestions(error),
      };
    }
  }

  /**
   * Get helpful suggestions based on error type
   */
  getErrorSuggestions(error) {
    const suggestions = [];

    if (error.message.includes('not found')) {
      suggestions.push(
        `Create a story with slug '${this.storySlug}' in Storyblok`
      );
      suggestions.push(
        'Ensure the story is published or accessible with your token'
      );
    }

    if (error.message.includes('site_name')) {
      suggestions.push(
        'Add site_name field to your global_header component in Storyblok'
      );
    }

    if (error.message.includes('navigation_items')) {
      suggestions.push(
        'Add navigation_items field with nav_item components in Storyblok'
      );
      suggestions.push('Ensure each nav_item has label and url fields');
    }

    if (error.message.includes('contact_')) {
      suggestions.push(
        'Add contact_phone, contact_email, and contact_location fields in Storyblok'
      );
    }

    if (error.message.includes('component')) {
      suggestions.push(
        'Set the component type to "global_header" in your Storyblok story'
      );
    }

    return suggestions;
  }

  /**
   * Destroy method for service coordinator
   */
  destroy() {
    console.log('🧹 Destroying header service');
    appState.delete('header');
    appState.delete('services.header');
  }
}

// Create singleton instance
export const headerService = new HeaderService();

// Development helpers
if (import.meta.env.DEV) {
  window.headerService = headerService;

  // Enhanced debug helper with Storyblok testing
  window.debugHeader = () => {
    console.group('🔍 Header Service Debug');
    console.log('Status:', headerService.getStatus());
    console.log('Config:', headerService.getConfig());
    console.log('State:', appState.get('header'));
    console.groupEnd();
  };

  // Test Storyblok integration helper
  window.testHeaderStoryblok = async () => {
    console.log('🧪 Testing header Storyblok integration...');
    return headerService.testStoryblokConnection();
  };

  // Force refresh helper
  window.refreshHeader = async () => {
    console.log('🔄 Force refreshing header from Storyblok...');
    return headerService.refresh();
  };

  // Validate current Storyblok content helper
  window.validateHeaderContent = async () => {
    try {
      const story = await storyblok.getStory(headerService.storySlug);
      headerService.validateStoryblokContent(story.content);
      console.log('✅ Header content validation passed');
      return true;
    } catch (error) {
      console.error('❌ Header content validation failed:', error.message);
      return false;
    }
  };

  console.log('🔧 Enhanced Header Service development helpers:');
  console.log('  - window.headerService - Service instance');
  console.log('  - window.debugHeader() - Show debug info');
  console.log('  - window.testHeaderStoryblok() - Test Storyblok integration');
  console.log('  - window.refreshHeader() - Force refresh from Storyblok');
  console.log(
    '  - window.validateHeaderContent() - Validate Storyblok content'
  );
}

console.log(
  '✅ Enhanced Header Service with strict Storyblok validation ready'
);
