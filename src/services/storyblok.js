// src/services/storyblok.js - Enhanced with state management and caching
import StoryblokClient from 'storyblok-js-client';
import { appState } from '../utils/stateStore.js';
import { RetryManager } from '../utils/retryManager.js';

console.log('=== ENHANCED STORYBLOK SERVICE LOADING ===');
class StoryblokService {
  constructor() {
    console.log('Creating enhanced Storyblok service...');

    this.token = import.meta.env.VITE_STORYBLOK_TOKEN;
    this.version = import.meta.env.VITE_STORYBLOK_VERSION || 'published';
    this.spaceId = import.meta.env.VITE_STORYBLOK_SPACE_ID;

    // Validate configuration
    if (!this.token) {
      console.error('❌ VITE_STORYBLOK_TOKEN not configured');
    }

    // Initialize client
    this.client = new StoryblokClient({
      accessToken: this.token,
      cache: {
        clear: 'auto',
        type: 'memory',
      },
    });

    // Initialize retry manager
    this.retry = new RetryManager({
      maxRetries: 3,
      baseDelay: 500,
      backoffFactor: 2,
    });

    // Cache settings
    this.cacheTime = 5 * 60 * 1000; // 5 minutes

    console.log('✅ Enhanced Storyblok client initialized');
  }

  // Initialize service and preload global stories - Algorithmic Elegance
  async load() {
    console.log('🚀 Loading Storyblok service with global stories...');

    if (!this.token) {
      const error = new Error('Storyblok token not configured');
      appState.set('services.storyblok.error', error.message);
      throw error;
    }

    try {
      // Mark service as loading
      appState.set('services.storyblok.loading', true);
      appState.set('services.storyblok.config', {
        version: this.version,
        spaceId: this.spaceId,
        hasToken: !!this.token,
      });

      // Preload critical global stories in parallel
      const globalStories = await Promise.allSettled([
        this.getStory('global-header'),
        this.getStory('global-footer'),
        this.getStory('global-seo'),
      ]);

      // Check results
      const loaded = globalStories.filter(
        (r) => r.status === 'fulfilled'
      ).length;
      const failed = globalStories.filter(
        (r) => r.status === 'rejected'
      ).length;

      console.log(`✅ Global stories: ${loaded} loaded, ${failed} failed`);

      // Mark service as ready even if some stories failed
      appState.set('services.storyblok.ready', true);
      appState.set('services.storyblok.loading', false);
      appState.set('services.storyblok.globalStoriesLoaded', loaded);

      return { loaded, failed };
    } catch (error) {
      appState.set('services.storyblok.error', error.message);
      appState.set('services.storyblok.loading', false);
      throw error;
    }
  }

  // Get story with caching and retry - KISS principle
  async getStory(slug) {
    console.log(`📖 Getting story: ${slug}`);

    // Check state cache first
    const cacheKey = `storyblok.stories.${slug.replace(/\//g, '_')}`;
    const cached = appState.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTime) {
      console.log(`📦 State cache hit for story: ${slug}`);
      return cached.story;
    }

    // Fetch with retry
    try {
      const story = await this.retry.retry(async () => {
        console.log(`🌐 Fetching story from Storyblok: ${slug}`);

        if (!this.token) {
          throw new Error('Storyblok token not configured');
        }

        const response = await this.client.get(`cdn/stories/${slug}`, {
          version: this.version,
          cv: Date.now(), // Cache version for draft mode
        });

        if (!response.data.story) {
          throw new Error(`Story not found: ${slug}`);
        }

        return response.data.story;
      });

      // Cache in state
      appState.set(cacheKey, {
        story,
        timestamp: Date.now(),
        slug,
      });

      // Also store just the content for easy access
      appState.set(
        `storyblok.content.${slug.replace(/\//g, '_')}`,
        story.content
      );

      console.log(`✅ Story loaded and cached: ${slug}`);
      return story;
    } catch (error) {
      console.error(`❌ Failed to load story "${slug}":`, error);

      // Check for stale cache
      if (cached) {
        console.warn('⚠️ Returning stale cache due to error');
        return cached.story;
      }

      // Try fallback data
      const fallback = this.getFallbackStory(slug);
      if (fallback) {
        console.warn(`⚠️ Using fallback data for: ${slug}`);
        appState.set(cacheKey, {
          story: fallback,
          timestamp: Date.now(),
          slug,
          isFallback: true,
        });
        return fallback;
      }

      // Store error in state
      appState.set(`storyblok.errors.${slug.replace(/\//g, '_')}`, {
        message: error.message,
        timestamp: Date.now(),
      });

      throw error;
    }
  }

  // Get multiple stories - Economy of Expression
  async getStories(slugs) {
    console.log(`📚 Getting ${slugs.length} stories`);

    const results = await Promise.allSettled(
      slugs.map((slug) => this.getStory(slug))
    );

    const stories = {};
    const errors = {};

    results.forEach((result, index) => {
      const slug = slugs[index];
      if (result.status === 'fulfilled') {
        stories[slug] = result.value;
      } else {
        errors[slug] = result.reason;
      }
    });

    console.log(
      `✅ Loaded ${Object.keys(stories).length} stories, ${Object.keys(errors).length} errors`
    );

    return { stories, errors };
  }

  // Get datasource entries - Maximum Conciseness
  async getDatasourceEntries(datasource) {
    console.log(`📊 Getting datasource: ${datasource}`);

    const cacheKey = `storyblok.datasources.${datasource}`;
    const cached = appState.get(cacheKey);

    if (cached && Date.now() - cached.timestamp < this.cacheTime * 2) {
      // Longer cache for datasources
      console.log(`📦 State cache hit for datasource: ${datasource}`);
      return cached.entries;
    }

    try {
      const entries = await this.retry.retry(async () => {
        const response = await this.client.get(`cdn/datasource_entries`, {
          datasource,
          per_page: 100,
        });

        return response.data.datasource_entries;
      });

      // Cache in state
      appState.set(cacheKey, {
        entries,
        timestamp: Date.now(),
      });

      console.log(
        `✅ Datasource loaded: ${datasource} (${entries.length} entries)`
      );
      return entries;
    } catch (error) {
      console.error(`❌ Failed to load datasource "${datasource}":`, error);

      if (cached) {
        console.warn('⚠️ Returning stale datasource cache');
        return cached.entries;
      }

      throw error;
    }
  }

  // Fallback data for critical stories - KISS approach
  getFallbackStory(slug) {
    const fallbacks = {
      'global-header': {
        name: 'Global Header',
        slug: 'global-header',
        content: {
          _uid: 'fallback-header',
          component: 'global_header',
          site_name: 'MUCHANDY',
          logo_url: {
            filename:
              'https://a.storyblok.com/f/340558/150x150/568478fef6/logo-farbe.svg',
          },
          navigation_items: [
            { component: 'nav_item', label: 'Reparatur', url: '/reparatur' },
            { component: 'nav_item', label: 'Ankauf', url: '/ankauf' },
            { component: 'nav_item', label: 'Kontakt', url: '/kontakt' },
          ],
          contact_phone: '089 / 26949777',
          contact_email: 'info@muchandy.de',
        },
      },
      'global-footer': {
        name: 'Global Footer',
        slug: 'global-footer',
        content: {
          _uid: 'fallback-footer',
          component: 'global_footer',
          business_name: 'MUCHANDY',
          copyright_text: `© ${new Date().getFullYear()} Muchandy. Alle Rechte vorbehalten.`,
          contact: {
            phone: '089 / 26949777',
            email: 'info@muchandy.de',
          },
          address: {
            street: 'Sendlinger Str. 7',
            city: 'München',
            zip: '80331',
          },
        },
      },
      'global-seo': {
        name: 'Global SEO',
        slug: 'global-seo',
        content: {
          _uid: 'fallback-seo',
          component: 'global_seo',
          site_title_suffix: ' | Muchandy',
          default_description: 'Premium Mobile Solutions in München',
          default_keywords: 'muchandy, handy reparatur, smartphone, münchen',
        },
      },
    };

    return fallbacks[slug] || null;
  }

  // Clear specific story from cache
  evictStory(slug) {
    console.log(`🗑️ Evicting story from cache: ${slug}`);
    const cacheKey = `storyblok.stories.${slug.replace(/\//g, '_')}`;
    appState.delete(cacheKey);
    appState.delete(`storyblok.content.${slug.replace(/\//g, '_')}`);
  }

  // Clear all Storyblok caches - Economy of Expression
  clearCache() {
    console.log('🗑️ Clearing Storyblok cache...');
    appState.delete('storyblok.stories');
    appState.delete('storyblok.content');
    appState.delete('storyblok.datasources');
    appState.delete('storyblok.errors');
  }

  // Refresh a story (bypass cache) - Maximum Conciseness
  async refreshStory(slug) {
    console.log(`🔄 Refreshing story: ${slug}`);
    this.evictStory(slug);
    return this.getStory(slug);
  }

  // Get service status
  getStatus() {
    return {
      ready: appState.get('services.storyblok.ready') || false,
      loading: appState.get('services.storyblok.loading') || false,
      error: appState.get('services.storyblok.error'),
      config: appState.get('services.storyblok.config') || {},
      globalStoriesLoaded:
        appState.get('services.storyblok.globalStoriesLoaded') || 0,
      cachedStories: Object.keys(appState.get('storyblok.stories') || {})
        .length,
    };
  }

  // Test connection to Storyblok
  async testConnection() {
    console.log('🧪 Testing Storyblok connection...');

    try {
      // Try to fetch a simple endpoint
      const response = await this.client.get('cdn/spaces/me');

      appState.set('storyblok.health', {
        status: 'connected',
        space: response.data.space,
        timestamp: Date.now(),
      });

      console.log('✅ Storyblok connection successful');
      return { success: true, space: response.data.space };
    } catch (error) {
      appState.set('storyblok.health', {
        status: 'disconnected',
        error: error.message,
        timestamp: Date.now(),
      });

      console.error('❌ Storyblok connection failed:', error);
      return { success: false, error: error.message };
    }
  }

  // Destroy method for service coordinator
  destroy() {
    console.log('🧹 Destroying Storyblok service');
    this.clearCache();
  }
}

// Create singleton instance
export const storyblok = new StoryblokService();

// Development helpers
if (import.meta.env.DEV) {
  window.storyblok = storyblok;

  // Test helper to see state integration
  window.testStoryblokState = async () => {
    console.log('🧪 Testing Storyblok state integration...');

    // Test connection
    await storyblok.testConnection();

    // Load a story
    await storyblok.getStory('home');

    // Check state
    console.log('Storyblok state:', appState.get('storyblok'));
    console.log('Service state:', appState.get('services.storyblok'));
  };

  console.log('🔧 Enhanced Storyblok service available:');
  console.log('  - window.storyblok - Service instance');
  console.log('  - window.testStoryblokState() - Test state integration');
}

console.log('✅ Enhanced Storyblok service ready');
