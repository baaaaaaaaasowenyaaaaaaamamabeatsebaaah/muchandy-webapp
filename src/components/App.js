// src/components/App.js - Using Storyblok global services
import { createElement, CollapsibleHeader, Footer } from 'svarog-ui-core';
import { router } from '../utils/router.js';
import { headerService } from '../services/headerService.js';
import { footerService } from '../services/footerService.js';
import createPage from './Page.js';

console.log('=== APP.JS WITH STORYBLOK SERVICES ===');

const createApp = () => {
  console.log('Creating app with Storyblok global services...');

  let element = null;
  let currentPage = null;
  let pageContainer = null;
  let themeLoaded = false;
  let header = null;
  let footer = null;

  // Initialize theme - Economy of Expression
  const initTheme = async () => {
    if (themeLoaded) return;

    try {
      console.log('Loading Muchandy theme...');
      const themeModule = await import('@svarog-ui/theme-muchandy');

      if (themeModule.default?.apply) {
        themeModule.default.apply();
      } else if (themeModule.muchandyTheme?.apply) {
        themeModule.muchandyTheme.apply();
      } else {
        throw new Error('Theme module missing apply method');
      }

      themeLoaded = true;
      console.log('✅ Muchandy theme applied');
    } catch (error) {
      console.error('❌ Theme loading failed:', error);
      // Inject minimal fallback styles
      const style = document.createElement('style');
      style.textContent = ':root { --color-brand-primary: #ff7f50; }';
      document.head.appendChild(style);
    }
  };

  // Route handler - KISS principle
  const handleRoute = async (path) => {
    console.log(`=== HANDLING ROUTE: ${path} ===`);

    if (!pageContainer) {
      console.error('❌ Page container not available');
      return;
    }

    // Clean up current page
    currentPage?.destroy();

    // Create new page
    currentPage = createPage();

    try {
      const slug = path === '/' ? 'home' : path.substring(1);
      await currentPage.loadStory(slug);

      const pageElement = currentPage.getElement();
      pageContainer.innerHTML = '';
      pageContainer.appendChild(pageElement);

      console.log('✅ Page rendered successfully');
    } catch (error) {
      console.error('❌ Route handling failed:', error);

      // Create error page
      const errorPage = createPage();
      errorPage.setError({
        title: 'Seite nicht gefunden',
        message: 'Die angeforderte Seite konnte nicht geladen werden.',
        code: error.status || 404,
      });

      pageContainer.innerHTML = '';
      pageContainer.appendChild(errorPage.getElement());
      currentPage = errorPage;
    }
  };

  // Create header from Storyblok - Algorithmic Elegance
  const createHeader = async () => {
    console.log('Creating header from Storyblok...');

    try {
      const headerConfig = await headerService.getHeaderConfig();
      console.log('✅ Header config loaded:', headerConfig);

      header = CollapsibleHeader({
        siteName: headerConfig.siteName,
        logo: headerConfig.logo,
        compactLogo: headerConfig.compactLogo,
        navigation: headerConfig.navigation,
        contactInfo: headerConfig.contactInfo,
        collapseThreshold: headerConfig.collapseThreshold,
        callButtonText: headerConfig.callButtonText,
        showStickyIcons: headerConfig.showStickyIcons,
        stickyIconsPosition: headerConfig.stickyIconsPosition,
        onCallClick: () => {
          window.location.href = `tel:${headerConfig.contactInfo.phone.replace(/\s/g, '')}`;
        },
      });

      console.log('✅ Header created from Storyblok config');
      return header.getElement();
    } catch (error) {
      console.error('❌ Header creation failed:', error);

      // Fallback header - Maximum Conciseness
      header = CollapsibleHeader({
        siteName: 'MUCHANDY',
        navigation: {
          items: [
            { id: 'repair', label: 'Reparatur', href: '/reparatur' },
            { id: 'purchase', label: 'Ankauf', href: '/ankauf' },
            { id: 'contact', label: 'Kontakt', href: '/kontakt' },
          ],
        },
        contactInfo: {
          phone: '089 / 26949777',
          email: 'info@muchandy.de',
        },
        onCallClick: () => (window.location.href = 'tel:08926949777'),
      });

      return header.getElement();
    }
  };

  // Create footer from Storyblok - Economy of Expression
  const createFooter = async () => {
    console.log('Creating footer from Storyblok...');

    try {
      const footerConfig = await footerService.getFooterConfig();
      console.log('✅ Footer config loaded:', footerConfig);

      footer = Footer(footerConfig);

      console.log('✅ Footer created from Storyblok config');
      return footer.getElement();
    } catch (error) {
      console.error('❌ Footer creation failed:', error);

      // Fallback footer
      footer = Footer({
        siteName: 'MUCHANDY',
        footer: {
          copyright: `© ${new Date().getFullYear()} Muchandy. Alle Rechte vorbehalten.`,
          links: [
            { label: 'Impressum', href: '/impressum' },
            { label: 'Datenschutz', href: '/datenschutz' },
          ],
        },
      });

      return footer.getElement();
    }
  };

  // Render app with services - KISS principle
  const render = async () => {
    console.log('Rendering app with Storyblok services...');

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

    // Create header from Storyblok
    const headerElement = await createHeader();
    element.appendChild(headerElement);

    // Create main content wrapper
    const mainWrapper = createElement('main', {
      classes: ['app-main'],
      style: { flex: '1' },
    });

    // Create page container
    pageContainer = createElement('div', {
      classes: ['app-content'],
      style: { width: '100%', minHeight: '50vh' },
    });

    mainWrapper.appendChild(pageContainer);
    element.appendChild(mainWrapper);

    // Create footer from Storyblok
    const footerElement = await createFooter();
    element.appendChild(footerElement);

    return element;
  };

  // Initialize app - Maximum Conciseness
  const init = async () => {
    console.log('Initializing app with Storyblok services...');

    await render();

    // Setup routing
    router.addRoute('/', handleRoute);
    router.addRoute('*', handleRoute);
    router.start();

    return element;
  };

  return {
    async getElement() {
      if (!element) await init();
      return element;
    },

    getCurrentPage: () => currentPage,

    async navigate(path) {
      router.navigate(path);
    },

    updatePage(props) {
      currentPage?.update(props);
    },

    getState() {
      return {
        currentPath: router.getCurrentPath(),
        pageState: currentPage?.getState(),
        themeLoaded,
        servicesLoaded: {
          header: !!header,
          footer: !!footer,
        },
      };
    },

    // Refresh services data - useful for content updates
    async refreshServices() {
      console.log('🔄 Refreshing Storyblok services...');
      await Promise.all([headerService.refresh(), footerService.refresh()]);
      console.log('✅ Services refreshed');
    },

    destroy() {
      console.log('Destroying app...');
      currentPage?.destroy();
      header?.destroy();
      footer?.destroy();
      element?.remove();

      // Clear references
      currentPage = header = footer = element = pageContainer = null;
      console.log('✅ App destroyed');
    },
  };
};

export default createApp;
