// src/main.js - Enhanced version with better error handling
import './styles/global.css';
import createApp from './components/App.js';

console.log('=== MAIN.JS START (Enhanced Version) ===');

async function initializeApp() {
  try {
    console.log('Creating enhanced app...');
    const app = createApp();

    console.log('Getting app element...');
    const appElement = await app.getElement();

    console.log('Appending to body...');
    document.body.appendChild(appElement);
    console.log('✅ Enhanced app successfully mounted');

    // Add this after the app is mounted to document.body
    import('./utils/muchandyheroFix.js').then(
      ({ default: MuchandyHeroFix }) => {
        console.log('🔧 Loading MuchandyHero fix...');

        // Wait for all components to render
        setTimeout(() => {
          MuchandyHeroFix.autoFix();
        }, 1500);
      }
    );

    // Log initial state
    const appState = app.getState();
    console.log('Initial app state:', appState);

    // Handle cleanup on page unload
    window.addEventListener('beforeunload', () => {
      console.log('Page unloading, cleaning up...');
      app.destroy();
    });

    // Development helpers
    if (import.meta.env.DEV) {
      window.muchandyApp = app;
      console.log('🔧 App exposed to window.muchandyApp for debugging');

      // Test navigation
      window.testNavigation = () => {
        console.log('Testing navigation...');
        app.navigate('/reparatur');
        setTimeout(() => app.navigate('/'), 3000);
      };

      // Test page functionality
      window.testPage = () => {
        const currentPage = app.getCurrentPage();
        if (currentPage) {
          console.log('Current page state:', currentPage.getState());
          console.log(
            'Accessibility report:',
            currentPage.validateAccessibility()
          );
        }
      };

      console.log('🧪 Debug helpers available:');
      console.log('  - window.muchandyApp (app instance)');
      console.log('  - window.testNavigation() (test routing)');
      console.log('  - window.testPage() (test current page)');
    }
  } catch (error) {
    console.error('=== ERROR IN ENHANCED MAIN.JS ===');
    console.error('Error details:', error);
    console.error('Stack trace:', error.stack);

    // Show enhanced error page
    const errorHTML = `
      <div style="
        min-height: 100vh;
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        padding: 2rem;
        font-family: system-ui, -apple-system, sans-serif;
        background: linear-gradient(135deg, #ff7f50, #ffa07a);
        color: white;
        text-align: center;
      ">
        <div style="
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
          border-radius: 12px;
          padding: 3rem;
          max-width: 600px;
          box-shadow: 0 8px 32px rgba(0, 0, 0, 0.1);
        ">
          <h1 style="margin: 0 0 1rem 0; font-size: 2rem; font-weight: 700;">
            Muchandy App Fehler
          </h1>
          <p style="margin: 0 0 1.5rem 0; font-size: 1.1rem; opacity: 0.9;">
            Die Anwendung konnte nicht geladen werden.
          </p>
          <details style="text-align: left; margin: 1.5rem 0;">
            <summary style="cursor: pointer; font-weight: 600; margin-bottom: 1rem;">
              Technische Details
            </summary>
            <div style="
              background: rgba(0, 0, 0, 0.2);
              padding: 1rem;
              border-radius: 8px;
              font-family: monospace;
              font-size: 0.9rem;
              overflow-x: auto;
            ">
              <strong>Fehler:</strong> ${error.message}<br><br>
              <strong>Stack Trace:</strong><br>
              <pre style="margin: 0; white-space: pre-wrap; word-break: break-word;">
${error.stack}
              </pre>
            </div>
          </details>
          <button onclick="window.location.reload()" style="
            background: white;
            color: #ff7f50;
            border: none;
            padding: 0.75rem 2rem;
            border-radius: 6px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s ease;
          " onmouseover="this.style.transform='scale(1.05)'" onmouseout="this.style.transform='scale(1)'">
            Seite neu laden
          </button>
        </div>
      </div>
    `;

    document.body.innerHTML = errorHTML;
  }
}

// Start app when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeApp);
} else {
  initializeApp();
}

// Development hot reload support
if (import.meta.hot) {
  console.log('Hot reload enabled');
  import.meta.hot.accept();
}

// Debug helpers for interface issues - Economy of Expression
if (import.meta.env.DEV) {
  window.debugInterface = () => {
    console.log('🔍 DEBUGGING INTERFACE ISSUES');
    console.log('==============================');

    // Check for MuchandyHero - KISS principle
    const hero = document.querySelector(
      '.muchandy-hero, .svarog-muchandy-hero, .muchandy-hero-enhanced'
    );
    console.log('🎯 MuchandyHero found:', !!hero);
    if (hero) {
      console.log('   Element:', hero);
      console.log('   Classes:', hero.className);
      console.log(
        '   Style.pointerEvents:',
        getComputedStyle(hero).pointerEvents
      );
    }

    // Check for Tabs - Algorithmic Elegance
    const tabs = document.querySelectorAll('.svarog-tabs__tab');
    console.log('📋 Tab elements found:', tabs.length);
    tabs.forEach((tab, i) => {
      const styles = getComputedStyle(tab);
      console.log(`   Tab ${i}: "${tab.textContent?.trim()}"`, {
        clickable: styles.pointerEvents !== 'none',
        zIndex: styles.zIndex,
        position: styles.position,
        cursor: styles.cursor,
      });
    });

    // Check for Buttons - Maximum Conciseness
    const buttons = document.querySelectorAll('.svarog-button, button');
    console.log('🔘 Button elements found:', buttons.length);
    buttons.forEach((btn, i) => {
      console.log(`   Button ${i}: "${btn.textContent?.trim()}"`, {
        clickable: getComputedStyle(btn).pointerEvents !== 'none',
        cursor: getComputedStyle(btn).cursor,
        disabled: btn.disabled,
        type: btn.type || 'button',
      });
    });

    // Check for Select dropdowns
    const selects = document.querySelectorAll('.svarog-select, select');
    console.log('📋 Select elements found:', selects.length);
    selects.forEach((select, i) => {
      console.log(`   Select ${i}:`, {
        clickable: getComputedStyle(select).pointerEvents !== 'none',
        zIndex: getComputedStyle(select).zIndex,
        options: select.options?.length || 0,
        value: select.value,
      });
    });

    // Summary
    const summary = {
      hero: !!hero,
      tabsCount: tabs.length,
      buttonsCount: buttons.length,
      selectsCount: selects.length,
      allClickable: [...tabs, ...buttons, ...selects].every(
        (el) => getComputedStyle(el).pointerEvents !== 'none'
      ),
    };

    console.log('📊 Summary:', summary);
    return summary;
  };

  window.makeClickable = () => {
    console.log('🔧 FORCING ELEMENTS TO BE CLICKABLE');
    console.log('===================================');

    // Force all potentially interactive elements to be clickable - Economy of Expression
    const selectors = [
      '.svarog-button',
      '.svarog-tabs__tab',
      '.svarog-select',
      'button',
      'select',
      '[role="button"]',
      '[role="tab"]',
      '.muchandy-hero-enhanced *',
    ];

    let totalFixed = 0;

    selectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      console.log(`🎯 Found ${elements.length} elements for: ${selector}`);

      elements.forEach((el, i) => {
        // Force clickable styles
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'pointer';
        el.style.zIndex = '1';
        el.style.position = 'relative';

        // Add visual feedback - green outline for 3 seconds
        el.style.outline = '2px solid lime';
        el.style.outlineOffset = '2px';

        // Add test click listener
        const testHandler = (e) => {
          console.log(
            `✅ Click detected on ${selector}[${i}]:`,
            e.target.textContent?.trim() || e.target.tagName
          );
          e.target.style.outline = '2px solid gold';
          setTimeout(() => {
            e.target.style.outline = '';
          }, 1000);
        };

        el.addEventListener('click', testHandler, { once: true });

        // Remove green outline after 3 seconds
        setTimeout(() => {
          el.style.outline = '';
          el.style.outlineOffset = '';
        }, 3000);

        totalFixed++;
      });
    });

    console.log(
      `✅ Fixed ${totalFixed} elements (green outlines for 3 seconds)`
    );
    console.log('🧪 Click any element to see gold flash confirmation');

    return totalFixed;
  };

  window.testMuchandyHeroInteraction = () => {
    console.log('🧪 TESTING MUCHANDY HERO INTERACTION');
    console.log('====================================');

    // Find the hero
    const hero = document.querySelector(
      '.muchandy-hero, .svarog-muchandy-hero, .muchandy-hero-enhanced'
    );
    if (!hero) {
      console.error('❌ MuchandyHero not found!');
      console.log('🔍 Available elements:', {
        muchandyClasses: document.querySelectorAll('[class*="muchandy"]')
          .length,
        svarogClasses: document.querySelectorAll('[class*="svarog"]').length,
        heroClasses: document.querySelectorAll('[class*="hero"]').length,
      });
      return false;
    }

    console.log('✅ MuchandyHero found:', hero);

    // Test tabs - KISS principle
    const tabs = hero.querySelectorAll('.svarog-tabs__tab');
    console.log(`📋 Found ${tabs.length} tabs`);

    if (tabs.length > 0) {
      console.log('🧪 Testing tab clicks...');
      tabs.forEach((tab, i) => {
        const tabText = tab.textContent?.trim();
        const isClickable = getComputedStyle(tab).pointerEvents !== 'none';
        console.log(`   Tab ${i}: "${tabText}" - Clickable: ${isClickable}`);

        if (isClickable) {
          // Add click test
          tab.addEventListener(
            'click',
            () => {
              console.log(`✅ Tab "${tabText}" clicked successfully!`);
            },
            { once: true }
          );
        }
      });
    }

    // Test selects - Maximum Conciseness
    const selects = hero.querySelectorAll('select, .svarog-select');
    console.log(`📋 Found ${selects.length} select elements`);

    selects.forEach((select, i) => {
      console.log(`   Select ${i}:`, {
        options: select.options?.length || 0,
        value: select.value,
        firstOption: select.options?.[0]?.textContent,
      });
    });

    // Test buttons
    const buttons = hero.querySelectorAll('button, .svarog-button');
    console.log(`🔘 Found ${buttons.length} buttons`);

    buttons.forEach((button, i) => {
      const buttonText = button.textContent?.trim();
      console.log(
        `   Button ${i}: "${buttonText}" - Disabled: ${button.disabled}`
      );
    });

    const result = {
      heroFound: true,
      tabsCount: tabs.length,
      selectsCount: selects.length,
      buttonsCount: buttons.length,
      allTabsClickable:
        tabs.length > 0 &&
        [...tabs].every(
          (tab) => getComputedStyle(tab).pointerEvents !== 'none'
        ),
    };

    console.log('📊 Test Results:', result);
    return result;
  };

  // Enhanced MuchandyHero fix function
  window.fixMuchandyHero = () => {
    console.log('🔧 Fixing MuchandyHero interactions...');

    const hero = document.querySelector(
      '.muchandy-hero, .muchandy-hero-enhanced'
    );
    if (!hero) {
      console.error('❌ MuchandyHero not found!');
      return false;
    }

    // Fix all interactive elements
    const interactiveSelectors = [
      '.svarog-tabs__tab',
      'select',
      '.svarog-select',
      'button',
      '.svarog-button',
      '[role="tab"]',
      '[role="button"]',
    ];

    let fixedCount = 0;
    interactiveSelectors.forEach((selector) => {
      const elements = hero.querySelectorAll(selector);
      elements.forEach((el) => {
        el.style.pointerEvents = 'auto';
        el.style.cursor = 'pointer';
        el.style.position = 'relative';
        el.style.zIndex = '100';

        // Remove any event blocking
        el.onclick = el.onclick || function () {};

        fixedCount++;
      });
    });

    console.log(`✅ Fixed ${fixedCount} interactive elements`);
    return true;
  };

  // Auto-fix after page loads
  window.addEventListener('load', () => {
    setTimeout(() => {
      console.log('🔄 Auto-fixing MuchandyHero...');
      window.fixMuchandyHero();

      // Also run interface check
      const check = window.debugInterface();
      if (!check.allClickable) {
        console.warn(
          '⚠️ Some elements are not clickable. Run window.makeClickable() to fix.'
        );
      } else {
        console.log('✅ All interactive elements appear clickable');
      }
    }, 1000); // Wait 1 second for components to load
  });

  console.log('🔧 Clean debug helpers added:');
  console.log('  - window.debugInterface() - Check all interactive elements');
  console.log('  - window.makeClickable() - Force all elements clickable');
  console.log(
    '  - window.testMuchandyHeroInteraction() - Test MuchandyHero specifically'
  );
  console.log('  - window.fixMuchandyHero() - Fix MuchandyHero interactions');
  console.log('  - Auto-check runs 1 second after page load');
}

console.log('=== MAIN.JS END ===');
