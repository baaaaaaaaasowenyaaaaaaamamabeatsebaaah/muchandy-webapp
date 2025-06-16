// src/components/Page.js - Fixed version with manual content rendering
import { Page } from 'svarog-ui-core';
import { renderStoryblokComponents } from './StoryblokComponent.js';
import { storyblok } from '../services/storyblok.js';

console.log('=== FIXED PAGE.JS LOADING ===');

const createPage = () => {
  console.log('Creating fixed page instance...');

  let currentStory = null;
  let pageComponent = null;

  // Transform Storyblok story to Svarog Page configuration - KISS principle
  const transformStoryToPageConfig = (story) => {
    console.log('Transforming story to page config:', story);

    // Pre-render the Storyblok components
    let renderedContent = null;
    if (story.content?.body && story.content.body.length > 0) {
      console.log('Rendering Storyblok components:', story.content.body);
      try {
        renderedContent = renderStoryblokComponents(story.content.body);
        console.log('✅ Components rendered successfully:', renderedContent);
      } catch (error) {
        console.error('❌ Error rendering components:', error);
      }
    }

    const config = {
      id: story.slug,
      type: 'page',

      // Enhanced SEO from Storyblok content
      seo: {
        title:
          story.content?.seo_title ||
          story.name ||
          'Muchandy - Premium Mobile Solutions',
        description:
          story.content?.seo_description ||
          'Professionelle Handy-Reparaturen und Premium-Geräte bei Muchandy in München',
        keywords: story.content?.seo_keywords || [
          'muchandy',
          'handy reparatur',
          'smartphone',
          'münchen',
        ],
        canonicalUrl: `https://muchandy.de/${story.slug === 'home' ? '' : story.slug}`,
        lang: 'de',

        // Favicon configuration for Muchandy
        favicon: {
          basePath: '/favicon',
          format: 'png',
        },

        // PWA configuration for Muchandy
        pwa: {
          appName: 'Muchandy',
          themeColor: '#ff7f50', // Muchandy brand orange
          backgroundColor: '#ffffff',
          manifestUrl: '/site.webmanifest',
        },

        // Open Graph for social sharing
        openGraph: {
          title: story.content?.seo_title || story.name,
          description:
            story.content?.seo_description ||
            'Premium Mobile Solutions bei Muchandy',
          image:
            story.content?.seo_image?.filename ||
            'https://muchandy.de/og-image.jpg',
          type: 'website',
          url: `https://muchandy.de/${story.slug === 'home' ? '' : story.slug}`,
          siteName: 'Muchandy',
        },

        // Twitter Card
        twitterCard: {
          card: 'summary_large_image',
          title: story.content?.seo_title || story.name,
          description:
            story.content?.seo_description ||
            'Premium Mobile Solutions bei Muchandy',
          image:
            story.content?.seo_image?.filename ||
            'https://muchandy.de/og-image.jpg',
        },
      },

      // Pass the pre-rendered content directly as HTML
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

    // Add local business schema for Muchandy (SMB focus) - if home or contact page
    if (story.slug === 'home' || story.slug === 'kontakt') {
      config.seo.localBusiness = {
        name: 'Muchandy',
        businessType: 'Electronics Store',
        description:
          'Premium Handy-Reparaturen und Smartphone-Verkauf in München',
        address: {
          street: 'Sendlinger Str. 7',
          city: 'München',
          state: 'Bayern',
          zip: '80331',
          country: 'DE',
        },
        phone: '+49 89 26949777',
        email: 'info@muchandy.de',
        url: 'https://muchandy.de',
        geo: {
          latitude: 48.1351,
          longitude: 11.582,
        },
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
      };

      // Add FAQ data for rich snippets
      config.seo.faqs = [
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
        {
          question: 'Kaufen Sie auch defekte Handys an?',
          answer:
            'Ja, wir kaufen defekte und gebrauchte Handys zu fairen Preisen an. Nutzen Sie unseren Online-Preisrechner für eine sofortige Bewertung.',
        },
      ];
    }

    console.log(
      '✅ Story transformed to enhanced page config with rendered content:',
      config
    );
    return config;
  };

  // Load story and create/update page - Algorithmic Elegance
  const loadStory = async (slug) => {
    console.log(`=== LOADING STORY WITH FIXED SVAROG PAGE: ${slug} ===`);

    try {
      // Set loading state
      if (pageComponent) {
        console.log('Setting loading state on existing page...');
        pageComponent.setLoading(true, {
          message: 'Inhalt wird geladen...',
          showSpinner: true,
        });
      } else {
        // Create page with initial loading state
        console.log('Creating new page with loading state...');
        pageComponent = Page({
          id: `muchandy-page-${slug}`,
          loading: true,
          loadingOptions: {
            message: 'Inhalt wird geladen...',
            showSpinner: true,
          },
        });
      }

      // Load from Storyblok
      console.log('Fetching story from Storyblok...');
      const story = await storyblok.getStory(slug);
      console.log('✅ Story loaded:', story);

      currentStory = story;

      // Transform and load into page
      console.log('Transforming story to page config...');
      const pageConfig = transformStoryToPageConfig(story);

      // Load content into the enhanced page component
      console.log('Loading content into page component...');
      pageComponent.loadFromCMS(pageConfig);

      // Setup enhanced SEO with all the Muchandy business data
      console.log('Setting up enhanced SEO...');
      pageComponent.updateSEO(pageConfig.seo);
      pageComponent.renderSEO();

      // Optimize page performance
      pageComponent.optimize();

      console.log('✅ Fixed page updated with story content and SEO');
      return story;
    } catch (error) {
      console.error(`❌ Failed to load story "${slug}":`, error);

      // Set error state with German text
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
    // Get the DOM element from Svarog Page component
    getElement() {
      if (!pageComponent) {
        console.warn('Fixed page component not initialized');
        return document.createElement('div');
      }
      return pageComponent.getElement();
    },

    // Load story and update page
    async loadStory(slug) {
      const story = await loadStory(slug);
      return story;
    },

    // Get current story
    getCurrentStory() {
      return currentStory;
    },

    // Get page state from enhanced component
    getState() {
      return pageComponent ? pageComponent.getState() : {};
    },

    // Update page
    update(props) {
      if (pageComponent) {
        pageComponent.update(props);
      }
    },

    // Destroy page and cleanup
    destroy() {
      console.log('Destroying fixed page...');
      if (pageComponent) {
        pageComponent.destroy();
        pageComponent = null;
      }
      currentStory = null;
    },

    // Enhanced methods from Svarog Page component
    setLoading(loading, options) {
      if (pageComponent) {
        pageComponent.setLoading(loading, options);
      }
      return this;
    },

    setError(error) {
      if (pageComponent) {
        pageComponent.setError(error);
      }
      return this;
    },

    setContent(content) {
      if (pageComponent) {
        pageComponent.setContent(content);
      }
      return this;
    },

    updateSEO(seoData) {
      if (pageComponent) {
        pageComponent.updateSEO(seoData);
      }
      return this;
    },

    // Performance optimization
    optimize() {
      if (pageComponent) {
        pageComponent.optimize();
      }
      return this;
    },

    // Accessibility validation
    validateAccessibility() {
      return pageComponent
        ? pageComponent.validateAccessibility()
        : { valid: false, issues: ['Page not initialized'] };
    },

    // Additional methods for Muchandy-specific functionality
    setupMuchandyBusiness() {
      if (pageComponent && currentStory) {
        const businessConfig = {
          business: {
            name: 'Muchandy',
            businessType: 'Electronics Store',
            phone: '+49 89 26949777',
            email: 'info@muchandy.de',
          },
        };
        pageComponent.setupSMB?.(businessConfig);
      }
      return this;
    },

    // Debug method for development
    debug() {
      console.log('=== MUCHANDY PAGE DEBUG ===');
      console.log('Current story:', currentStory);
      console.log('Page component state:', pageComponent?.getState());
      console.log('Accessibility:', this.validateAccessibility());
      console.log(
        'Page element content:',
        pageComponent?.getElement()?.innerHTML
      );
      return {
        story: currentStory,
        pageState: pageComponent?.getState(),
        accessibility: this.validateAccessibility(),
        element: pageComponent?.getElement(),
      };
    },
  };
};

console.log('✅ Fixed Muchandy Page factory created using Svarog-UI');
export default createPage;
