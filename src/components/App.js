// src/components/App.js
import { createElement, CollapsibleHeader, Footer } from 'svarog-ui-core';
import { router } from '../utils/router.js';
import createPage from './Page.js';

console.log(CollapsibleHeader);
console.log(Footer);

console.log('=== APP.JS LOADING ===');

const createApp = () => {
  console.log('Creating app instance...');

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

        // Check if theme classes were applied
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

    // Create new page
    console.log('Creating new page...');
    currentPage = createPage();

    // Determine story slug from path
    const slug = path === '/' ? 'home' : path.substring(1);
    console.log(`Loading story with slug: ${slug}`);

    try {
      await currentPage.loadStory(slug);
      const pageElement = currentPage.getElement();

      pageContainer.innerHTML = '';
      pageContainer.appendChild(pageElement);
      console.log('✅ Page rendered successfully');
    } catch (error) {
      console.error('❌ Route handling error:', error);

      const errorElement = createElement('div', {
        classes: ['error-container'],
        style: {
          padding: '2rem',
          color: '#dc3545',
          border: '1px solid #dc3545',
          margin: '1rem',
          borderRadius: '4px',
          background: '#f8d7da',
        },
        children: [
          createElement('h2', { text: 'Error Loading Content' }),
          createElement('p', {
            html: `<strong>Error:</strong> ${error.message}`,
          }),
          createElement('p', { html: `<strong>Path:</strong> ${path}` }),
          createElement('p', { html: `<strong>Slug:</strong> ${slug}` }),
          createElement('details', {
            children: [
              createElement('summary', { text: 'Stack Trace' }),
              createElement('pre', {
                text: error.stack,
                style: { fontSize: '0.8rem', overflow: 'auto' },
              }),
            ],
          }),
        ],
      });

      pageContainer.innerHTML = '';
      pageContainer.appendChild(errorElement);
    }
  };

  const createHeader = () => {
    console.log('Creating header...');

    // Create header with Muchandy branding
    header = CollapsibleHeader({
      siteName: 'MUCHANDY',
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
      logo: 'https://img2.storyblok.com//176x60/filters:quality(90)/f/177369/2000x685/cd088b1e56/logo-farbe.png',
      compactLogo:
        'https://img2.storyblok.com//60x60/filters:quality(90)/f/177369/354x354/e08df44c66/logo-icon-farbe.png',
      showStickyIcons: true,
      stickyIconsPosition: 'right',
    });

    return header.getElement();
  };

  const createFooter = () => {
    console.log('Creating footer...');

    // Create footer with Muchandy info
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
    console.log('Rendering app element...');

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

    // Create content container
    pageContainer = createElement('div', {
      classes: ['app-content'],
    });

    mainWrapper.appendChild(pageContainer);
    element.appendChild(mainWrapper);

    // Create and add footer
    const footerElement = createFooter();
    element.appendChild(footerElement);

    return element;
  };

  const init = async () => {
    console.log('Initializing app...');

    // Setup router
    router.addRoute('/', handleRoute);
    router.addRoute('*', handleRoute);

    // Render app (which includes theme loading)
    await render();

    // Handle initial route
    router.handleRoute();

    return element;
  };

  return {
    getElement: async () => {
      if (!element) {
        await init();
      }
      return element;
    },
    destroy() {
      console.log('Destroying app...');
      if (currentPage) currentPage.destroy();
      if (header) header.destroy();
      if (footer) footer.destroy();
      element?.remove();
      element = null;
      pageContainer = null;
    },
  };
};

export default createApp;
