// src/components/App.js - Enhanced version with Svarog-UI Page integration
import { createElement, CollapsibleHeader, Footer } from 'svarog-ui-core';
import { router } from '../utils/router.js';
import createPage from './Page.js';

console.log('=== APP.JS LOADING (Enhanced Page Integration) ===');

const createApp = () => {
  console.log('Creating enhanced app instance...');

  let element = null;
  let currentPage = null;
  let pageContainer = null;
  let themeLoaded = false;
  let header = null;
  let footer = null;

  // Force load and apply Muchandy theme
  const initTheme = async () => {
    if (themeLoaded) return;

    try {
      console.log('Loading Muchandy theme module...');

      // Import the theme module
      const themeModule = await import('@svarog-ui/theme-muchandy');
      console.log('Theme module loaded:', themeModule);

      // Apply the theme using its apply method
      if (themeModule.default && themeModule.default.apply) {
        console.log('Applying theme via default.apply()...');
        themeModule.default.apply();
        themeLoaded = true;
        console.log('✅ Muchandy theme applied successfully');
      } else if (themeModule.muchandyTheme && themeModule.muchandyTheme.apply) {
        console.log('Applying theme via muchandyTheme.apply()...');
        themeModule.muchandyTheme.apply();
        themeLoaded = true;
        console.log('✅ Muchandy theme applied successfully');
      } else {
        console.error('Theme module structure:', {
          hasDefault: !!themeModule.default,
          defaultKeys: themeModule.default
            ? Object.keys(themeModule.default)
            : [],
          moduleKeys: Object.keys(themeModule),
        });
        throw new Error('Theme module does not have apply method');
      }

      // Verify theme variables are loaded
      setTimeout(() => {
        const buttonBg = getComputedStyle(
          document.documentElement
        ).getPropertyValue('--button-bg');
        const brandPrimary = getComputedStyle(
          document.documentElement
        ).getPropertyValue('--color-brand-primary');
        console.log('Theme verification:');
        console.log('  --button-bg:', buttonBg || 'NOT FOUND');
        console.log('  --color-brand-primary:', brandPrimary || 'NOT FOUND');
        console.log(
          '  Theme classes on html:',
          document.documentElement.className
        );
        console.log('  Theme classes on body:', document.body.className);
      }, 100);
    } catch (error) {
      console.error('❌ Failed to load theme:', error);

      // Fallback: inject theme CSS directly
      try {
        console.log('Attempting fallback CSS injection...');
        const style = document.createElement('style');
        style.id = 'muchandy-theme-fallback';
        style.textContent = `
          :root {
            --color-brand-primary: #ff7f50;
            --color-brand-primary-dark: #cc643f;
            --color-brand-primary-light: #ffa07a;
            --color-brand-secondary: #4aa2d9;
            --button-bg: transparent;
            --button-color: var(--color-brand-primary);
            --button-border: 2px solid var(--color-brand-primary);
            --button-radius: 0;
            --button-padding: 0.5rem 1.25rem;
            --button-primary-bg: var(--color-brand-primary);
            --button-primary-color: white;
            --button-secondary-bg: var(--color-brand-secondary);
            --button-secondary-color: white;
          }
        `;
        document.head.appendChild(style);
        console.log('✅ Fallback styles injected');
      } catch (fallbackError) {
        console.error('❌ Fallback injection failed:', fallbackError);
      }
    }
  };

  const handleRoute = async (path) => {
    console.log(`=== HANDLING ROUTE: ${path} ===`);

    if (!pageContainer) {
      console.error('❌ Page container not available');
      return;
    }

    // Clean up current page
    if (currentPage) {
      console.log('Destroying previous page...');
      currentPage.destroy();
    }

    // Create new enhanced page
    console.log('Creating new enhanced page...');
    currentPage = createPage();

    // Determine story slug from path
    const slug = path === '/' ? 'home' : path.substring(1);
    console.log(`Loading story with slug: ${slug}`);

    try {
      // Load story with enhanced page component
      await currentPage.loadStory(slug);
      const pageElement = currentPage.getElement();

      // Clear container and add new page
      pageContainer.innerHTML = '';
      pageContainer.appendChild(pageElement);

      // Log enhanced page state
      const pageState = currentPage.getState();
      console.log('✅ Enhanced page rendered successfully');
      console.log('Page state:', pageState);

      // Validate accessibility if in development
      if (import.meta.env.DEV) {
        const a11yReport = currentPage.validateAccessibility();
        if (!a11yReport.valid) {
          console.warn('Accessibility issues found:', a11yReport.issues);
        } else {
          console.log('✅ Page accessibility validated');
        }
      }
    } catch (error) {
      console.error('❌ Enhanced route handling error:', error);

      // Create error page using Svarog Page component
      const errorPage = createPage();
      errorPage.setError({
        title: 'Seite nicht gefunden',
        message:
          'Die angeforderte Seite konnte nicht geladen werden. Bitte überprüfen Sie die URL oder kehren Sie zur Startseite zurück.',
        code: error.status || 404,
      });

      const errorElement = errorPage.getElement();
      pageContainer.innerHTML = '';
      pageContainer.appendChild(errorElement);

      // Update currentPage reference
      currentPage = errorPage;
    }
  };

  // Get working logo URLs - no processing, just use what works - KISS principle
  const getWorkingLogoUrls = () => {
    // Your EXACT working URLs - don't modify them at all
    const workingUrls = {
      main: 'https://a.storyblok.com/f/340558/150x150/568478fef6/logo-farbe.svg?cv=1750094529899',
      compact:
        'https://a.storyblok.com/f/340558/150x150/fe8d57c0c5/logo-icon-farbe.svg?cv=1750094529797',
    };

    console.log('✅ Using verified working logo URLs:', workingUrls);
    return workingUrls;
  };

  const createHeader = () => {
    console.log('Creating header with verified working URLs...');

    // Get the exact working URLs without any processing
    const logoUrls = getWorkingLogoUrls();

    // Create header with unmodified URLs - Maximum Conciseness
    header = CollapsibleHeader({
      siteName: 'MUCHANDY',

      // Use exact working URLs - no processing, no modification
      logo: logoUrls.main,
      compactLogo: logoUrls.compact,

      navigation: {
        items: [
          { id: 'repair', label: 'Reparatur', href: '/reparatur' },
          { id: 'purchase', label: 'Ankauf', href: '/ankauf' },
          { id: 'used', label: 'Gebrauchte', href: '/gebrauchte' },
          { id: 'services', label: 'Services', href: '/services' },
          { id: 'find-us', label: 'So Finden Sie Uns', href: '/kontakt' },
        ],
      },
      contactInfo: {
        location: 'Sendlinger Str. 7',
        phone: '089 / 26949777',
        email: 'info@muchandy.de',
      },
      collapseThreshold: 100,
      callButtonText: 'Jetzt Anrufen',
      onCallClick: () => {
        window.location.href = 'tel:08926949777';
      },
      showStickyIcons: true,
      stickyIconsPosition: 'right',
    });

    console.log('✅ Header created with working SVG logos');
    return header.getElement();
  };

  const createFooter = () => {
    console.log('Creating footer...');

    footer = Footer({
      siteName: 'MUCHANDY',
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
    });

    return footer.getElement();
  };

  const render = async () => {
    console.log('Rendering enhanced app element...');

    // Initialize theme first
    await initTheme();

    // Create app container
    element = createElement('div', {
      classes: ['app'],
      style: {
        display: 'flex',
        flexDirection: 'column',
        minHeight: '100vh',
      },
    });

    // Create and add header
    const headerElement = createHeader();
    element.appendChild(headerElement);

    // Create main content wrapper
    const mainWrapper = createElement('main', {
      classes: ['app-main'],
      style: {
        flex: '1',
        paddingTop: '0', // Header is sticky, no need for padding
      },
    });

    // Create content container for enhanced pages
    pageContainer = createElement('div', {
      classes: ['app-content'],
      style: {
        width: '100%',
        minHeight: '50vh', // Ensure minimum height for loading states
      },
    });

    mainWrapper.appendChild(pageContainer);
    element.appendChild(mainWrapper);

    // Create and add footer
    const footerElement = createFooter();
    element.appendChild(footerElement);

    return element;
  };

  const init = async () => {
    console.log('Initializing enhanced app...');

    // First render the app (creates pageContainer)
    await render();

    // Then setup router with routes
    console.log('Setting up enhanced router...');
    router.addRoute('/', handleRoute);
    router.addRoute('*', handleRoute);

    // Finally start routing
    console.log('Starting enhanced router...');
    router.start();

    return element;
  };

  return {
    getElement: async () => {
      if (!element) {
        await init();
      }
      return element;
    },

    // Get current page instance (enhanced)
    getCurrentPage() {
      return currentPage;
    },

    // Navigate programmatically
    async navigate(path) {
      console.log(`App navigate to: ${path}`);
      router.navigate(path);
    },

    // Update current page
    updatePage(props) {
      if (currentPage) {
        currentPage.update(props);
      }
    },

    // Get app state
    getState() {
      return {
        currentPath: router.getCurrentPath(),
        pageState: currentPage ? currentPage.getState() : null,
        themeLoaded,
      };
    },

    // Helper to test URLs - Development aid
    testLogos: () => {
      const urls = getWorkingLogoUrls();
      Object.entries(urls).forEach(([key, url]) => {
        fetch(url, { method: 'HEAD' })
          .then((r) =>
            console.log(`${key}: ${r.ok ? '✅' : '❌'} (${r.status}) ${url}`)
          )
          .catch((e) => console.log(`${key}: ❌ Error ${url}`, e));
      });
      return urls;
    },

    // Enhanced destroy with proper cleanup
    destroy() {
      console.log('Destroying enhanced app...');

      // Destroy current page
      if (currentPage) {
        currentPage.destroy();
        currentPage = null;
      }

      // Destroy header and footer
      if (header) {
        header.destroy();
        header = null;
      }
      if (footer) {
        footer.destroy();
        footer = null;
      }

      // Remove element
      element?.remove();
      element = null;
      pageContainer = null;

      console.log('✅ Enhanced app destroyed');
    },
  };
};

export default createApp;
