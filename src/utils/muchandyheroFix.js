// src/utils/muchandyHeroFix.js - Advanced debugging and fixing for MuchandyHero
console.log('🔧 MuchandyHero Advanced Fix Loading...');

// Enhanced debugging and fixing utility - Maximum Conciseness
const MuchandyHeroFix = {
  attempts: 0,
  maxAttempts: 10,

  // Find MuchandyHero with all possible selectors - KISS principle
  findHero() {
    const selectors = [
      '.muchandy-hero',
      '.svarog-muchandy-hero',
      '.muchandy-hero-enhanced',
      '[class*="muchandy"][class*="hero"]',
      '.svarog-hero--muchandy',
      'section[class*="hero"]',
    ];

    for (const selector of selectors) {
      const el = document.querySelector(selector);
      if (el) {
        console.log(`✅ Found hero with selector: ${selector}`);
        return el;
      }
    }

    console.warn('❌ MuchandyHero not found with any selector');
    return null;
  },

  // Deep analysis of what's blocking interactions - Algorithmic Elegance
  analyzeBlockers() {
    console.log('🔍 Analyzing interaction blockers...');

    const hero = this.findHero();
    if (!hero) return { found: false };

    const analysis = {
      found: true,
      hero: {
        element: hero,
        className: hero.className,
        computedStyles: window.getComputedStyle(hero),
        position: hero.getBoundingClientRect(),
      },
      blockers: [],
      interactiveElements: [],
    };

    // Check all interactive elements
    const selectors = [
      '.svarog-tabs__tab',
      '[role="tab"]',
      'button',
      'select',
      '.svarog-select',
      '.svarog-button',
      'input',
    ];

    selectors.forEach((selector) => {
      const elements = hero.querySelectorAll(selector);
      elements.forEach((el) => {
        const rect = el.getBoundingClientRect();
        const centerX = rect.left + rect.width / 2;
        const centerY = rect.top + rect.height / 2;
        const topElement = document.elementFromPoint(centerX, centerY);

        const info = {
          element: el,
          selector,
          text: el.textContent?.trim() || el.value || 'No text',
          clickable: topElement === el || el.contains(topElement),
          blockedBy:
            topElement !== el && !el.contains(topElement) ? topElement : null,
          styles: {
            pointerEvents: window.getComputedStyle(el).pointerEvents,
            zIndex: window.getComputedStyle(el).zIndex,
            position: window.getComputedStyle(el).position,
            cursor: window.getComputedStyle(el).cursor,
          },
        };

        analysis.interactiveElements.push(info);

        if (info.blockedBy) {
          analysis.blockers.push({
            blocked: el,
            blocker: info.blockedBy,
            blockerInfo: {
              tagName: info.blockedBy.tagName,
              className: info.blockedBy.className,
              id: info.blockedBy.id,
            },
          });
        }
      });
    });

    // Log detailed analysis
    console.log('📊 Analysis Results:', analysis);
    console.log(
      `Found ${analysis.interactiveElements.length} interactive elements`
    );
    console.log(`${analysis.blockers.length} elements are blocked`);

    return analysis;
  },

  // Nuclear option - force everything to work - Economy of Expression
  forceFixAll() {
    console.log('💥 Applying nuclear fix to MuchandyHero...');

    const hero = this.findHero();
    if (!hero) return false;

    // 1. Fix hero container
    Object.assign(hero.style, {
      position: 'relative',
      zIndex: '1',
      pointerEvents: 'auto',
    });

    // 2. Inject global CSS fixes
    const fixId = 'muchandy-hero-nuclear-fix';
    if (!document.getElementById(fixId)) {
      const style = document.createElement('style');
      style.id = fixId;
      style.textContent = `
        /* Nuclear fix for MuchandyHero */
        .muchandy-hero *,
        .muchandy-hero-enhanced *,
        [class*="muchandy"][class*="hero"] * {
          pointer-events: auto !important;
        }
        
        /* Disable pointer-events on decorative elements */
        .muchandy-hero::before,
        .muchandy-hero::after,
        .muchandy-hero *::before,
        .muchandy-hero *::after {
          pointer-events: none !important;
        }
        
        /* Force interactive elements to be on top */
        .muchandy-hero button,
        .muchandy-hero select,
        .muchandy-hero input,
        .muchandy-hero [role="tab"],
        .muchandy-hero .svarog-tabs__tab,
        .muchandy-hero .svarog-button,
        .muchandy-hero .svarog-select {
          position: relative !important;
          z-index: 100 !important;
          pointer-events: auto !important;
          cursor: pointer !important;
        }
        
        /* Fix tabs specifically */
        .muchandy-hero .svarog-tabs {
          position: relative !important;
          z-index: 50 !important;
        }
        
        .muchandy-hero .svarog-tabs__list {
          position: relative !important;
          z-index: 60 !important;
        }
        
        .muchandy-hero .svarog-tabs__tab {
          position: relative !important;
          z-index: 70 !important;
          pointer-events: auto !important;
          cursor: pointer !important;
          user-select: none !important;
        }
        
        /* Fix forms */
        .muchandy-hero form,
        .muchandy-hero .svarog-form {
          position: relative !important;
          z-index: 40 !important;
        }
        
        /* Fix select dropdowns */
        .muchandy-hero select {
          -webkit-appearance: menulist !important;
          appearance: menulist !important;
          background-image: none !important;
        }
      `;
      document.head.appendChild(style);
      console.log('✅ Injected nuclear CSS fixes');
    }

    // 3. Fix each interactive element directly
    let fixedCount = 0;
    const elements = hero.querySelectorAll(
      'button, select, input, [role="tab"], .svarog-tabs__tab'
    );

    elements.forEach((el) => {
      // Remove any transform that creates stacking context
      if (window.getComputedStyle(el).transform !== 'none') {
        el.style.transform = 'none';
      }

      // Force pointer events
      el.style.pointerEvents = 'auto';
      el.style.cursor = 'pointer';

      // Add debug click handler
      if (!el.hasAttribute('data-debug-fixed')) {
        el.setAttribute('data-debug-fixed', 'true');
        el.addEventListener(
          'click',
          (_e) => {
            console.log(
              `✅ Click detected on ${el.tagName}: "${el.textContent?.trim() || el.value}"`
            );
            el.style.outline = '3px solid #10b981';
            setTimeout(() => (el.style.outline = ''), 1000);
          },
          true
        ); // Use capture phase

        fixedCount++;
      }
    });

    console.log(`✅ Fixed ${fixedCount} interactive elements`);

    // 4. Remove any overlays
    this.removeOverlays();

    // 5. Fix Svarog component internals if needed
    this.fixSvarogInternals(hero);

    return true;
  },

  // Remove potential overlays - KISS approach
  removeOverlays() {
    console.log('🎯 Checking for overlays...');

    const hero = this.findHero();
    if (!hero) return;

    // Common overlay patterns
    const overlaySelectors = [
      '.overlay',
      '.modal-backdrop',
      '[class*="overlay"]',
      '[class*="backdrop"]',
      '.loading-overlay',
    ];

    overlaySelectors.forEach((selector) => {
      const overlays = document.querySelectorAll(selector);
      overlays.forEach((overlay) => {
        const rect = overlay.getBoundingClientRect();
        const heroRect = hero.getBoundingClientRect();

        // Check if overlay intersects with hero
        if (
          rect.left < heroRect.right &&
          rect.right > heroRect.left &&
          rect.top < heroRect.bottom &&
          rect.bottom > heroRect.top
        ) {
          console.log(`⚠️ Found intersecting overlay: ${selector}`);
          overlay.style.pointerEvents = 'none';
        }
      });
    });
  },

  // Fix Svarog-specific issues - Maximum Conciseness
  fixSvarogInternals(hero) {
    console.log('🔧 Fixing Svarog component internals...');

    // Fix tab component
    const tabs = hero.querySelector('.svarog-tabs');
    if (tabs) {
      // Look for the component instance
      const possibleProps = [
        '__svarogInstance',
        '_instance',
        'svarogComponent',
      ];

      for (const prop of possibleProps) {
        if (tabs[prop]) {
          console.log(`✅ Found Svarog component instance at ${prop}`);
          break;
        }
      }

      // Try to find tab buttons and panels
      const tabButtons = tabs.querySelectorAll(
        '[role="tab"], .svarog-tabs__tab'
      );
      const tabPanels = tabs.querySelectorAll(
        '[role="tabpanel"], .svarog-tabs__panel'
      );

      console.log(
        `Found ${tabButtons.length} tabs and ${tabPanels.length} panels`
      );

      // Manually wire up tabs if needed
      tabButtons.forEach((tab, index) => {
        tab.onclick = (e) => {
          e.preventDefault();
          e.stopPropagation();

          console.log(`Tab ${index} clicked!`);

          // Update aria attributes
          tabButtons.forEach((t, i) => {
            t.setAttribute('aria-selected', i === index ? 'true' : 'false');
            t.classList.toggle('svarog-tabs__tab--active', i === index);
          });

          // Show/hide panels
          tabPanels.forEach((panel, i) => {
            panel.style.display = i === index ? 'block' : 'none';
            panel.hidden = i !== index;
          });
        };
      });

      console.log('✅ Manually wired tab functionality');
    }
  },

  // Test the fixes - Algorithmic Elegance
  async testFixes() {
    console.log('🧪 Testing fixes...');

    const analysis = this.analyzeBlockers();
    if (!analysis.found) {
      console.error('❌ Cannot test - hero not found');
      return;
    }

    // Test each interactive element
    for (const info of analysis.interactiveElements) {
      const el = info.element;

      // Simulate click
      // eslint-disable-next-line no-undef
      const event = new MouseEvent('click', {
        bubbles: true,
        cancelable: true,
        view: window,
      });

      el.dispatchEvent(event);
      console.log(`🖱️ Simulated click on ${info.selector}: "${info.text}"`);

      // Small delay between clicks
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    console.log('✅ Test complete');
  },

  // Auto-fix with retry logic - Economy of Expression
  async autoFix() {
    console.log('🚀 Starting MuchandyHero auto-fix...');

    // Wait for page to be ready
    if (document.readyState === 'loading') {
      await new Promise((resolve) => {
        document.addEventListener('DOMContentLoaded', resolve);
      });
    }

    // Retry logic
    const tryFix = async () => {
      this.attempts++;
      console.log(`Attempt ${this.attempts}/${this.maxAttempts}`);

      const hero = this.findHero();
      if (!hero) {
        if (this.attempts < this.maxAttempts) {
          console.log('Hero not found, retrying in 500ms...');
          setTimeout(() => tryFix(), 500);
        } else {
          console.error('❌ Failed to find MuchandyHero after max attempts');
        }
        return;
      }

      // Apply fixes
      const analysis = this.analyzeBlockers();

      if (analysis.blockers.length > 0) {
        console.log('🔧 Blockers detected, applying nuclear fix...');
        this.forceFixAll();

        // Re-analyze after fix
        setTimeout(() => {
          const postFixAnalysis = this.analyzeBlockers();
          if (postFixAnalysis.blockers.length === 0) {
            console.log('✅ All blockers removed!');
          } else {
            console.warn(
              `⚠️ ${postFixAnalysis.blockers.length} blockers remain`
            );
          }

          // Run tests
          this.testFixes();
        }, 500);
      } else {
        console.log('✅ No blockers detected');
        this.testFixes();
      }
    };

    // Start fixing
    tryFix();
  },

  // Manual inspection helper
  inspect() {
    const analysis = this.analyzeBlockers();

    if (!analysis.found) {
      console.error('❌ MuchandyHero not found');
      return;
    }

    console.group('🔍 MuchandyHero Inspection');
    console.log('Hero element:', analysis.hero.element);
    console.log('Interactive elements:', analysis.interactiveElements.length);

    console.group('🚫 Blocked Elements');
    analysis.blockers.forEach(({ blocked, blockerInfo }) => {
      console.log(
        `${blocked.tagName} blocked by ${blockerInfo.tagName}.${blockerInfo.className}`
      );
    });
    console.groupEnd();

    console.group('✅ Clickable Elements');
    analysis.interactiveElements
      .filter((info) => info.clickable)
      .forEach((info) => {
        console.log(`${info.selector}: "${info.text}"`);
      });
    console.groupEnd();

    console.group('❌ Non-Clickable Elements');
    analysis.interactiveElements
      .filter((info) => !info.clickable)
      .forEach((info) => {
        console.log(`${info.selector}: "${info.text}"`, info.styles);
      });
    console.groupEnd();

    console.groupEnd();

    return analysis;
  },
};

// Export for use
window.MuchandyHeroFix = MuchandyHeroFix;

// Auto-run if in development
if (import.meta.env?.DEV || window.location.hostname === 'localhost') {
  console.log(
    '🔧 Development mode detected - auto-running MuchandyHero fix...'
  );
  MuchandyHeroFix.autoFix();
}

// Export for ES modules
export default MuchandyHeroFix;

console.log('✅ MuchandyHero Fix loaded. Available commands:');
console.log('  - MuchandyHeroFix.autoFix() - Auto-detect and fix issues');
console.log("  - MuchandyHeroFix.analyzeBlockers() - Analyze what's blocking");
console.log('  - MuchandyHeroFix.forceFixAll() - Apply nuclear fix');
console.log('  - MuchandyHeroFix.inspect() - Detailed inspection');
console.log('  - MuchandyHeroFix.testFixes() - Test all interactive elements');
