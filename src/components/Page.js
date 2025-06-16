// src/components/Page.js - Enhanced with global SEO service
import { Page } from 'svarog-ui-core';
import { renderStoryblokComponents } from './StoryblokComponent.js';
import { storyblok } from '../services/storyblok.js';
import { seoService } from '../services/seoService.js';

console.log('=== PAGE.JS WITH SEO SERVICE ===');

const createPage = () => {
  console.log('Creating page with global SEO service...');

  let currentStory = null;
  let pageComponent = null;

  // Transform story to page config with global SEO - KISS principle
  const transformStoryToPageConfig = async (story) => {
    console.log('Transforming story with global SEO:', story);

    // Pre-render Storyblok components
    let renderedContent = null;
    if (story.content?.body?.length > 0) {
      try {
        renderedContent = renderStoryblokComponents(story.content.body);
        console.log('✅ Components rendered successfully');
      } catch (error) {
        console.error('❌ Component rendering failed:', error);
      }
    }

    // Create enhanced SEO using global service - Algorithmic Elegance
    const enhancedSEO = await seoService.createPageSEO({
      slug: story.slug,
      title: story.name,
      seo_title: story.content?.seo_title,
      seo_description: story.content?.seo_description,
      seo_keywords: story.content?.seo_keywords,
      seo_image: story.content?.seo_image,
    });

    const config = {
      id: story.slug,
      type: 'page',

      // Enhanced SEO from global service
      seo: enhancedSEO,

      // Pass rendered content as HTML
      content: renderedContent
        ? {
            html: renderedContent.outerHTML || renderedContent.innerHTML || '',
          }
        : {
            html: '<div class="content-loading">Inhalt wird geladen...</div>',
          },

      // Error handling
      onRetry: () => {
        console.log('Retrying page load...');
        loadStory(story.slug);
      },
    };

    console.log('✅ Story transformed with enhanced SEO:', config);
    return config;
  };

  // Load story and create page with global SEO - Economy of Expression
  const loadStory = async (slug) => {
    console.log(`=== LOADING STORY WITH GLOBAL SEO: ${slug} ===`);

    try {
      // Set loading state
      if (pageComponent) {
        pageComponent.setLoading(true, {
          message: 'Inhalt wird geladen...',
          showSpinner: true,
        });
      } else {
        pageComponent = Page({
          id: `muchandy-page-${slug}`,
          loading: true,
          loadingOptions: {
            message: 'Inhalt wird geladen...',
            showSpinner: true,
          },
        });
      }

      // Load story and transform with global SEO
      console.log('Fetching story from Storyblok...');
      const story = await storyblok.getStory(slug);
      console.log('✅ Story loaded:', story);

      currentStory = story;

      // Transform with enhanced SEO
      console.log('Transforming with global SEO...');
      const pageConfig = await transformStoryToPageConfig(story);

      // Load content into page component
      console.log('Loading content into page...');
      pageComponent.loadFromCMS(pageConfig);

      // Apply enhanced SEO
      console.log('Applying enhanced SEO...');
      pageComponent.updateSEO(pageConfig.seo);
      pageComponent.renderSEO();

      // Optimize page
      pageComponent.optimize();

      console.log('✅ Page loaded with global SEO configuration');
      return story;
    } catch (error) {
      console.error(`❌ Failed to load story "${slug}":`, error);

      // Set error state
      if (pageComponent) {
        pageComponent.setError({
          title: 'Seite nicht gefunden',
          message:
            'Die angeforderte Seite konnte nicht geladen werden. Bitte versuchen Sie es später erneut.',
          code: error.status || 404,
        });
      }

      throw error;
    }
  };

  return {
    // Get DOM element from page component
    getElement() {
      if (!pageComponent) {
        console.warn('Page component not initialized');
        return document.createElement('div');
      }
      return pageComponent.getElement();
    },

    // Load story with global SEO
    async loadStory(slug) {
      return await loadStory(slug);
    },

    // Get current story
    getCurrentStory() {
      return currentStory;
    },

    // Get page state with SEO info
    getState() {
      const baseState = pageComponent ? pageComponent.getState() : {};
      return {
        ...baseState,
        story: currentStory
          ? {
              slug: currentStory.slug,
              name: currentStory.name,
              hasContent: !!currentStory.content?.body?.length,
            }
          : null,
        seoEnhanced: true, // Indicates global SEO is being used
      };
    },

    // Enhanced page methods - Maximum Conciseness
    update: (props) => pageComponent?.update(props),
    setLoading: (loading, options) =>
      pageComponent?.setLoading(loading, options),
    setError: (error) => pageComponent?.setError(error),
    setContent: (content) => pageComponent?.setContent(content),
    updateSEO: (seoData) => pageComponent?.updateSEO(seoData),
    optimize: () => pageComponent?.optimize(),

    // Accessibility validation
    validateAccessibility() {
      return pageComponent
        ? pageComponent.validateAccessibility()
        : { valid: false, issues: ['Page not initialized'] };
    },

    // Refresh page with latest global SEO
    async refresh() {
      if (currentStory) {
        console.log('🔄 Refreshing page with latest global SEO...');
        await seoService.refresh();
        await loadStory(currentStory.slug);
        console.log('✅ Page refreshed with latest SEO');
      }
    },

    // Enhanced destroy with proper cleanup
    destroy() {
      console.log('Destroying page with global SEO...');

      if (pageComponent) {
        pageComponent.destroy();
        pageComponent = null;
      }

      currentStory = null;
      console.log('✅ Page destroyed');
    },

    // Debug method for development
    debug() {
      console.log('=== MUCHANDY PAGE DEBUG (Enhanced SEO) ===');
      console.log('Current story:', currentStory);
      console.log('Page component state:', pageComponent?.getState());
      console.log('Accessibility:', this.validateAccessibility());
      console.log('SEO service cache:', seoService.cache);

      return {
        story: currentStory,
        pageState: pageComponent?.getState(),
        accessibility: this.validateAccessibility(),
        seoCache: seoService.cache,
        element: pageComponent?.getElement(),
      };
    },
  };
};

console.log('✅ Enhanced Page with Global SEO Service ready');
export default createPage;
