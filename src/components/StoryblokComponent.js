// src/components/StoryblokComponent.js - ABSOLUTE FINAL FIX: Use library's ACTUAL current props
import {
  Button,
  Card,
  BlogCard,
  ContactInfo,
  Form,
  createElement,
  PhoneRepairForm,
  UsedPhonePriceForm,
  MuchandyHero,
} from 'svarog-ui-core';

import ApiService from '../services/apiService.js';
import { router } from '../utils/router.js';

console.log('=== ABSOLUTE FINAL FIX - Use ACTUAL Library Props ===');

// Single API service instance
let apiServiceInstance = null;
const getApiService = () => {
  if (!apiServiceInstance) {
    apiServiceInstance = new ApiService();
    apiServiceInstance.testConnection().then((result) => {
      if (result.success) {
        console.log('✅ API connection verified');
      } else {
        console.warn('⚠️ API connection issues:', result.error);
      }
    });
  }
  return apiServiceInstance;
};

// Component map
const componentMap = {
  hero: renderHero,
  muchandy_hero: renderMuchandyHero,
  section: renderSection,
  card: renderCard,
  blog_card: renderBlogCard,
  button: renderButton,
  text: renderText,
  contact_info: renderContactInfo,
  form: renderForm,
};

// ABSOLUTE FINAL FIX: Use the EXACT props the current library expects
function renderMuchandyHero(blok) {
  console.log('🚀 Rendering MuchandyHero with API service:', blok);

  try {
    const apiService = getApiService();

    // Create repair form with minimal, correct props
    const repairForm = PhoneRepairForm({
      service: apiService,
      onChange: (priceData) => {
        console.log('💰 Repair price updated:', priceData);
      },
      onSubmit: (formData) => {
        console.log('📅 Schedule repair clicked:', formData);
        if (formData.price) {
          alert(
            `Reparatur für ${formData.device}: ${formData.action} - ${formData.formatted || formData.price + ' €'}`
          );
        }
      },
    });

    // Create buyback form with minimal, correct props
    const buybackForm = UsedPhonePriceForm({
      service: apiService,
      onChange: (priceData) => {
        console.log('💰 Buyback price updated:', priceData);
      },
      onSubmit: (formData) => {
        console.log('📝 Buyback form submitted:', formData);
        if (formData.price) {
          alert(
            `Ankauf für ${formData.device}: ${formData.formatted || formData.price + ' €'}`
          );
        }
      },
    });

    // Create MuchandyHero with correct props
    const muchandyHero = MuchandyHero({
      backgroundImageUrl: blok.background_image?.filename || '',
      title: blok.title || 'Finden Sie<br>Ihren Preis',
      subtitle: blok.subtitle || 'Jetzt Preis berechnen.',
      defaultValue: blok.default_tab || 'repair', // Correct prop name
      repairForm,
      buybackForm,
      className: 'muchandy-hero-enhanced',
    });

    // Force clickability after a small delay to ensure DOM is ready
    setTimeout(() => {
      const heroElement = muchandyHero.getElement();
      if (heroElement) {
        // Fix any z-index/pointer-events issues
        const tabs = heroElement.querySelectorAll(
          '.svarog-tabs__tab, [class*="tab"]'
        );
        tabs.forEach((tab) => {
          tab.style.pointerEvents = 'auto';
          tab.style.cursor = 'pointer';
          tab.style.position = 'relative';
          tab.style.zIndex = '10';
        });

        // Fix selects
        const selects = heroElement.querySelectorAll('select, .svarog-select');
        selects.forEach((select) => {
          select.style.pointerEvents = 'auto';
          select.style.cursor = 'pointer';
          select.style.position = 'relative';
          select.style.zIndex = '10';
        });

        // Fix buttons
        const buttons = heroElement.querySelectorAll('button, .svarog-button');
        buttons.forEach((button) => {
          button.style.pointerEvents = 'auto';
          button.style.cursor = 'pointer';
          button.style.position = 'relative';
          button.style.zIndex = '10';
        });
      }
    }, 100);

    console.log('✅ MuchandyHero created successfully');
    return muchandyHero;
  } catch (error) {
    console.error('❌ Error creating MuchandyHero:', error);
    return createFallbackHero(blok);
  }
}

// Standard hero (unchanged - it works)
function renderHero(blok) {
  console.log('🎯 Rendering standard hero:', blok);

  const heroElement = createElement('section', {
    className: 'svarog-hero',
    style: {
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 'var(--space-8, 2rem) var(--space-4, 1rem)',
      textAlign: 'center',
      background: blok.background_image?.filename
        ? `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.4)), url(${blok.background_image.filename})`
        : 'var(--color-primary, #FF6B35)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: 'white',
    },
  });

  const children = [];

  if (blok.title) {
    children.push(
      createElement('h1', {
        className: 'svarog-hero__title',
        innerHTML: blok.title,
        style: {
          fontSize: 'clamp(2rem, 5vw, 4rem)',
          fontWeight: '700',
          margin: '0 0 1rem 0',
          lineHeight: '1.2',
        },
      })
    );
  }

  if (blok.subtitle) {
    children.push(
      createElement('p', {
        className: 'svarog-hero__subtitle',
        textContent: blok.subtitle,
        style: {
          fontSize: 'clamp(1rem, 3vw, 1.5rem)',
          margin: '0 0 2rem 0',
          opacity: '0.9',
          lineHeight: '1.4',
        },
      })
    );
  }

  if (blok.cta_text && blok.cta_link?.url) {
    try {
      const ctaButton = Button({
        children: blok.cta_text,
        variant: 'secondary',
        size: 'large',
        className: 'hero-cta-button',
        onClick: (e) => {
          if (blok.cta_link.url.startsWith('http')) {
            window.open(blok.cta_link.url, blok.cta_link.target || '_self');
          } else {
            e.preventDefault();
            router.navigate(blok.cta_link.url);
          }
        },
      });
      children.push(ctaButton.getElement());
    } catch (error) {
      console.error('❌ Error creating CTA button:', error);
    }
  }

  children.forEach((child) => heroElement.appendChild(child));

  return {
    getElement: () => heroElement,
    update: () => {},
    destroy: () => heroElement.remove(),
  };
}

// All other renderers unchanged (they work)
function renderSection(blok) {
  const sectionElement = createElement('section', {
    className: 'svarog-section',
    style: {
      padding: 'var(--space-8, 2rem) var(--space-4, 1rem)',
      maxWidth: '1200px',
      margin: '0 auto',
    },
  });

  if (blok.title) {
    sectionElement.appendChild(
      createElement('h2', {
        textContent: blok.title,
        style: {
          fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
          fontWeight: '700',
          margin: '0 0 1rem 0',
          color: 'var(--color-primary, #FF6B35)',
        },
      })
    );
  }

  if (blok.subtitle) {
    sectionElement.appendChild(
      createElement('p', {
        textContent: blok.subtitle,
        style: {
          fontSize: '1.125rem',
          margin: '0 0 2rem 0',
          opacity: '0.8',
        },
      })
    );
  }

  if (blok.content && blok.content.length > 0) {
    const contentContainer = createElement('div', {
      className: 'section-content',
      style: {
        display: 'grid',
        gap: 'var(--space-6, 1.5rem)',
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      },
    });

    blok.content.forEach((nestedBlok) => {
      try {
        const nestedComponent = renderStoryblokComponent(nestedBlok);
        if (nestedComponent) {
          contentContainer.appendChild(nestedComponent.getElement());
        }
      } catch (error) {
        console.error(`Error rendering nested component:`, error);
      }
    });

    sectionElement.appendChild(contentContainer);
  }

  return {
    getElement: () => sectionElement,
    update: () => {},
    destroy: () => sectionElement.remove(),
  };
}

function renderCard(blok) {
  return Card({
    title: blok.title || 'Untitled',
    description: blok.description || '',
    imageUrl: blok.image?.filename,
    alt: blok.image?.alt || blok.title,
    href: blok.link?.url,
    variant: blok.variant || 'default',
  });
}

function renderBlogCard(blok) {
  return BlogCard({
    title: blok.title || 'Untitled Blog Post',
    description: blok.description || '',
    imageUrl: blok.image?.filename,
    alt: blok.image?.alt || blok.title,
    href: blok.link?.url || '#',
    date: blok.date,
    author: blok.author,
    readTime: blok.read_time,
  });
}

function renderButton(blok) {
  if (!blok.text) {
    throw new Error('Button component requires text prop');
  }

  const variantMap = {
    default: 'primary',
    primary: 'primary',
    secondary: 'secondary',
    tertiary: 'tertiary',
    link: 'link',
    icon: 'icon',
  };

  const sizeMap = {
    small: 'small',
    medium: 'medium',
    large: 'large',
    sm: 'small',
    md: 'medium',
    lg: 'large',
  };

  return Button({
    children: blok.text,
    variant: variantMap[blok.variant] || 'primary',
    size: sizeMap[blok.size] || 'medium',
    disabled: blok.disabled || false,
    className: blok.className,
    onClick: (e) => {
      if (blok.link?.url) {
        if (blok.link.url.startsWith('http')) {
          window.open(blok.link.url, blok.link.target || '_self');
        } else {
          e.preventDefault();
          router.navigate(blok.link.url);
        }
      }
      if (blok.onClick) {
        blok.onClick(e);
      }
    },
  });
}

function renderText(blok) {
  const textElement = createElement('div', {
    className: 'richtext-content',
    innerHTML: blok.text || '',
    style: {
      lineHeight: '1.6',
      margin: '1rem 0',
    },
  });

  return {
    getElement: () => textElement,
    update: () => {},
    destroy: () => textElement.remove(),
  };
}

function renderContactInfo(blok) {
  return ContactInfo({
    phone: blok.phone || '',
    email: blok.email || '',
    address: blok.address || '',
    showMap: blok.show_map || false,
  });
}

function renderForm(blok) {
  return Form({
    title: blok.title || '',
    fields: blok.fields || [],
    submitText: blok.submit_text || 'Submit',
    onSubmit: async (data) => {
      console.log('📝 Form submitted:', data);
      if (blok.endpoint) {
        try {
          const response = await fetch(blok.endpoint, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data),
          });

          if (!response.ok) {
            throw new Error('Form submission failed');
          }

          alert(blok.success_message || 'Form submitted successfully!');
        } catch (error) {
          console.error('Form submission error:', error);
          alert(
            blok.error_message || 'Form submission failed. Please try again.'
          );
        }
      }
    },
  });
}

function createFallbackHero(blok) {
  console.log('🆘 Creating fallback hero for:', blok);

  const heroElement = createElement('section', {
    className: 'fallback-hero muchandy-hero-fallback',
    style: {
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: blok.background_image?.filename
        ? `linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url(${blok.background_image.filename})`
        : 'linear-gradient(135deg, #ff6b35, #f7931e)',
      backgroundSize: 'cover',
      backgroundPosition: 'center',
      color: 'white',
      textAlign: 'center',
    },
  });

  const title = createElement('h1', {
    innerHTML: blok.title || 'Muchandy<br>Handy-Service',
    style: {
      fontSize: 'clamp(2rem, 5vw, 4rem)',
      fontWeight: '700',
      marginBottom: '1rem',
      lineHeight: '1.2',
    },
  });

  const subtitle = createElement('p', {
    textContent:
      blok.subtitle ||
      'Professionelle Handy-Reparaturen und faire Ankaufspreise',
    style: {
      fontSize: 'clamp(1rem, 3vw, 1.5rem)',
      marginBottom: '2rem',
      opacity: '0.9',
    },
  });

  const ctaButton = Button({
    children: 'Jetzt Preis berechnen',
    variant: 'secondary',
    size: 'large',
    onClick: () => {
      console.log('Fallback hero CTA clicked');
    },
  });

  heroElement.appendChild(title);
  heroElement.appendChild(subtitle);
  heroElement.appendChild(ctaButton.getElement());

  return {
    getElement: () => heroElement,
    update: () => {},
    destroy: () => heroElement.remove(),
  };
}

// Main component renderer (unchanged)
export function renderStoryblokComponent(blok) {
  console.log('=== RENDERING COMPONENT ===');
  console.log('Component type:', blok.component);
  console.log('Component data:', blok);

  const renderer = componentMap[blok.component];

  if (!renderer) {
    console.error(`❌ No renderer found for component: ${blok.component}`);
    console.log('Available renderers:', Object.keys(componentMap));
    throw new Error(`No renderer found for component: ${blok.component}`);
  }

  try {
    const result = renderer(blok);
    console.log('✅ Component rendered successfully');
    return result;
  } catch (error) {
    console.error(`❌ Error rendering component ${blok.component}:`, error);
    throw error;
  }
}

// Main components renderer (unchanged)
export function renderStoryblokComponents(bloks) {
  console.log('=== RENDERING COMPONENTS ===');
  console.log('Components to render:', bloks.length);

  const container = createElement('div', {
    className: 'storyblok-content',
    style: { width: '100%' },
  });

  let successCount = 0;
  let errorCount = 0;

  bloks.forEach((blok, index) => {
    try {
      const component = renderStoryblokComponent(blok);
      container.appendChild(component.getElement());
      successCount++;
      console.log(
        `✅ Component ${index + 1} (${blok.component}) rendered successfully`
      );
    } catch (error) {
      errorCount++;
      console.error(
        `❌ Error rendering component ${index + 1} (${blok.component}):`,
        error
      );

      const errorElement = createElement('div', {
        className: 'component-error',
        style: {
          padding: '1rem',
          background: '#fee',
          border: '1px solid #dc3545',
          borderRadius: '4px',
          margin: '1rem 0',
          color: '#dc3545',
        },
        innerHTML: `<strong>⚠️ Error in ${blok.component} component:</strong><br>${error.message}`,
      });

      container.appendChild(errorElement);
    }
  });

  console.log(
    `✅ Component rendering complete: ${successCount} success, ${errorCount} errors`
  );
  return container;
}

// Development helpers with enhanced debugging
if (import.meta.env.DEV) {
  window.testMuchandyHero = () => {
    console.log('🧪 Testing ABSOLUTE FINAL FIX MuchandyHero...');
    try {
      const testBlok = {
        component: 'muchandy_hero',
        title: 'Test Hero',
        subtitle: 'Testing with ACTUAL library props',
        default_tab: 'repair',
      };
      const hero = renderMuchandyHero(testBlok);
      console.log('✅ Test hero created:', hero);

      // Check for tabs immediately
      const element = hero.getElement();
      const tabs = element.querySelectorAll(
        '.svarog-tabs__tab, [class*="tab"]'
      );
      console.log(`🔍 Test: Found ${tabs.length} tab elements immediately`);

      return hero;
    } catch (error) {
      console.error('❌ Test hero failed:', error);
      return null;
    }
  };

  window.testApiService = () => {
    console.log('🧪 Testing API service...');
    const apiService = getApiService();
    apiService.testConnection();
    apiService
      .fetchManufacturers()
      .then((data) => {
        console.log('✅ Manufacturers test:', data);
      })
      .catch((error) => {
        console.error('❌ Manufacturers test failed:', error);
      });
  };

  // Enhanced debugging
  window.debugTabsSpecifically = () => {
    console.log('🔍 DEBUGGING TABS SPECIFICALLY');
    console.log('================================');

    // Look for all possible tab-related elements
    const allTabSelectors = [
      '.svarog-tabs__tab',
      '.svarog-tab',
      '[class*="tab"]',
      '[role="tab"]',
      '.tab',
      '.tabs',
    ];

    allTabSelectors.forEach((selector) => {
      const elements = document.querySelectorAll(selector);
      console.log(`${selector}: ${elements.length} elements`);
      elements.forEach((el, i) => {
        console.log(`  ${i}: ${el.className} - "${el.textContent?.trim()}"`);
      });
    });

    // Look inside MuchandyHero specifically
    const hero = document.querySelector('.muchandy-hero');
    if (hero) {
      console.log('🎯 Inside MuchandyHero:');
      allTabSelectors.forEach((selector) => {
        const elements = hero.querySelectorAll(selector);
        console.log(`  ${selector}: ${elements.length} elements`);
      });

      // Check all children
      console.log('All children in MuchandyHero:');
      Array.from(hero.children).forEach((child, i) => {
        console.log(`  Child ${i}: ${child.tagName}.${child.className}`);
      });
    }
  };

  console.log('🔧 ABSOLUTE FINAL FIX Development helpers:');
  console.log('  - window.testMuchandyHero()');
  console.log('  - window.testApiService()');
  console.log('  - window.debugTabsSpecifically()');
}

console.log(
  '✅ ABSOLUTE FINAL FIX StoryblokComponent ready - SHOULD WORK NOW!'
);
