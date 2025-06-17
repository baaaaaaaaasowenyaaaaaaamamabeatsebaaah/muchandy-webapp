// src/components/Page.js - Enhanced with lifecycle and state management
import { Page as SvarogPage } from 'svarog-ui-core';
import { MuchandyComponent } from './MuchandyComponent.js';
import { renderStoryblokComponents } from './StoryblokComponent.js';
import { storyblok } from '../services/storyblok.js';
import { seoService } from '../services/seoService.js';
import { appState } from '../utils/stateStore.js';

console.log('=== ENHANCED PAGE COMPONENT ===');

// Page component with proper lifecycle management - KISS principle
export class EnhancedPage extends MuchandyComponent {
  constructor(props = {}) {
    super(props);

    // Page-specific state
    this.state = {
      loading: true,
      error: null,
      story: null,
      seo: null,
    };

    // Svarog Page instance
    this.pageComponent = null;

    console.log('📄 Enhanced Page created:', props.slug);
  }

  // === LIFECYCLE METHODS ===

  // Before loading - wait for dependencies
  async beforeLoad() {
    console.log('📋 Page beforeLoad - waiting for services...');

    // Wait for required services
    await appState.waitFor('services.storyblok.ready');
    await appState.waitFor('services.seo.ready');

    console.log('✅ Page dependencies ready');
  }

  // Load page data - Algorithmic Elegance
  async load() {
    console.log(`📊 Loading page data for: ${this.props.slug}`);

    try {
      // Load story from Storyblok
      const story = await storyblok.getStory(this.props.slug);

      // Create page-specific SEO
      const seo = await seoService.createPageSEO({
        slug: story.slug,
        title: story.name,
        seo_title: story.content?.seo_title,
        seo_description: story.content?.seo_description,
        seo_keywords: story.content?.seo_keywords,
        seo_image: story.content?.seo_image,
        og_title: story.content?.og_title,
        og_description: story.content?.og_description,
        og_image: story.content?.og_image,
        twitter_title: story.content?.twitter_title,
        twitter_description: story.content?.twitter_description,
        twitter_image: story.content?.twitter_image,
      });

      // Update state
      this.setState({
        story,
        seo,
        loading: false,
        error: null,
      });

      // Store in app state
      appState.set(`pages.${this.props.slug}`, {
        story,
        seo,
        loadedAt: Date.now(),
      });

      console.log('✅ Page data loaded');
    } catch (error) {
      console.error('❌ Failed to load page data:', error);

      this.setState({
        loading: false,
        error: {
          title: 'Seite nicht gefunden',
          message: 'Die angeforderte Seite konnte nicht geladen werden.',
          code: error.status || 404,
        },
      });

      throw error;
    }
  }

  // Before render - prepare page configuration
  async beforeRender() {
    console.log('🎯 Page beforeRender - preparing configuration...');

    // Create Svarog Page instance if needed
    if (!this.pageComponent) {
      this.pageComponent = SvarogPage({
        id: `muchandy-page-${this.props.slug}`,
        type: 'page',
        loading: this.state.loading,
        error: this.state.error,
      });
    }
  }

  // Render the page - Economy of Expression
  render() {
    console.log('🎨 Rendering page');

    if (this.state.error) {
      // Update page with error
      this.pageComponent.setError(this.state.error);
    } else if (this.state.loading) {
      // Show loading state
      this.pageComponent.setLoading(true, {
        message: 'Inhalt wird geladen...',
        showSpinner: true,
      });
    } else if (this.state.story) {
      // Render story content
      this.renderStoryContent();
    }

    return this.pageComponent.getElement();
  }

  // After render - apply SEO and optimizations
  async afterRender() {
    console.log('✨ Page afterRender - applying SEO...');

    if (this.state.seo && !this.state.error) {
      // Apply SEO to page
      this.pageComponent.updateSEO(this.state.seo);
      this.pageComponent.renderSEO();

      // Optimize page
      this.pageComponent.optimize();
    }
  }

  // On mount - final initialization
  async onMount() {
    console.log('🚀 Page mounted to DOM');

    // Watch for story updates
    this.watchState(
      `storyblok.stories.${this.props.slug.replace(/\//g, '_')}`,
      (story) => {
        if (story && story.story) {
          console.log('📝 Story updated, refreshing page...');
          this.handleStoryUpdate(story.story);
        }
      }
    );

    // Track page view
    appState.set('app.currentPage', {
      slug: this.props.slug,
      title: this.state.story?.name,
      mountedAt: Date.now(),
    });
  }

  // === CUSTOM METHODS ===

  // Render story content into page - Maximum Conciseness
  renderStoryContent() {
    const story = this.state.story;
    if (!story?.content?.body) return;

    console.log('📖 Rendering story content...');

    try {
      // Render Storyblok components
      const renderedContent = renderStoryblokComponents(story.content.body);

      // Transform to page config
      const pageConfig = {
        id: story.slug,
        type: 'page',
        seo: this.state.seo,
        content: {
          html: renderedContent.outerHTML || renderedContent.innerHTML || '',
        },
      };

      // Load into page component
      this.pageComponent.loadFromCMS(pageConfig);
      this.pageComponent.setLoading(false);

      console.log('✅ Story content rendered');
    } catch (error) {
      console.error('❌ Failed to render story content:', error);

      this.pageComponent.setError({
        title: 'Darstellungsfehler',
        message: 'Der Seiteninhalt konnte nicht korrekt dargestellt werden.',
        code: 500,
      });
    }
  }

  // Handle story updates - KISS principle
  async handleStoryUpdate(newStory) {
    // Update state
    this.setState({ story: newStory });

    // Update SEO
    const newSeo = await seoService.createPageSEO({
      slug: newStory.slug,
      title: newStory.name,
      ...newStory.content,
    });

    this.setState({ seo: newSeo });

    // Re-render
    await this.rerender();
  }

  // Load a different story
  async loadStory(slug) {
    console.log(`🔄 Loading new story: ${slug}`);

    // Update props
    this.props.slug = slug;

    // Reset state
    this.setState({
      loading: true,
      error: null,
      story: null,
      seo: null,
    });

    // Reload data
    try {
      await this.load();
      await this.rerender();
    } catch (error) {
      // Error already handled in load()
    }
  }

  // Get current page state - Economy of Expression
  getPageState() {
    return {
      slug: this.props.slug,
      story: this.state.story
        ? {
            slug: this.state.story.slug,
            name: this.state.story.name,
            hasContent: !!this.state.story.content?.body?.length,
          }
        : null,
      loading: this.state.loading,
      error: this.state.error,
      seoEnhanced: !!this.state.seo,
      pageComponent: this.pageComponent?.getState(),
    };
  }

  // Validate accessibility
  validateAccessibility() {
    if (!this.pageComponent) {
      return {
        valid: false,
        issues: ['Page component not initialized'],
      };
    }

    return this.pageComponent.validateAccessibility();
  }

  // Refresh page with latest data
  async refresh() {
    console.log('🔄 Refreshing page...');

    // Clear story from cache
    storyblok.evictStory(this.props.slug);

    // Clear page from state
    appState.delete(`pages.${this.props.slug}`);

    // Reload
    await this.loadStory(this.props.slug);
  }

  // === PROXY METHODS FOR SVAROG PAGE ===

  setLoading(loading, options) {
    this.pageComponent?.setLoading(loading, options);
  }

  setError(error) {
    this.pageComponent?.setError(error);
  }

  setContent(content) {
    this.pageComponent?.setContent(content);
  }

  updateSEO(seoData) {
    this.pageComponent?.updateSEO(seoData);
  }

  optimize() {
    this.pageComponent?.optimize();
  }

  // === CLEANUP ===

  async beforeDestroy() {
    console.log('⚠️ Page beforeDestroy - cleaning up...');

    // Clear from app state
    appState.delete(`pages.${this.props.slug}`);
    appState.delete('app.currentPage');
  }

  async destroy() {
    // Destroy Svarog page component
    if (this.pageComponent) {
      this.pageComponent.destroy();
      this.pageComponent = null;
    }

    // Call parent destroy
    await super.destroy();
  }
}

// Factory function for backward compatibility - Algorithmic Elegance
const createPage = (props = {}) => {
  const page = new EnhancedPage(props);

  // Return proxy object with original API
  return {
    async getElement() {
      return page.getElement();
    },

    async loadStory(slug) {
      if (!page.initialized) {
        page.props.slug = slug;
        await page.init();
      } else {
        await page.loadStory(slug);
      }
    },

    getCurrentStory: () => page.state.story,
    getState: () => page.getPageState(),
    update: (props) => page.update(props),
    setLoading: (loading, options) => page.setLoading(loading, options),
    setError: (error) => page.setError(error),
    setContent: (content) => page.setContent(content),
    updateSEO: (seoData) => page.updateSEO(seoData),
    optimize: () => page.optimize(),
    validateAccessibility: () => page.validateAccessibility(),
    refresh: () => page.refresh(),
    destroy: () => page.destroy(),
    debug: () => page.debug(),
  };
};

// Development helpers
if (import.meta.env.DEV) {
  window.EnhancedPage = EnhancedPage;
  window.createPage = createPage;

  console.log('🔧 Enhanced Page development helpers:');
  console.log('  - window.EnhancedPage - Page class');
  console.log('  - window.createPage - Factory function');
}

console.log('✅ Enhanced Page with lifecycle management ready');

export default createPage;
