// src/components/StoryblokComponent.js - Enhanced with proper API integration
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

console.log('=== ENHANCED STORYBLOK COMPONENT LOADING ===');

// Single API service instance with enhanced debugging
const apiService = new ApiService();

// Test API connectivity on startup
apiService.testConnection().then((result) => {
  if (result.success) {
    console.log('✅ API connection verified');
  } else {
    console.warn('⚠️ API connection issues:', result.error);
  }
});

// Component map - Economy of Expression
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

// Enhanced MuchandyHero renderer with better error handling
function renderMuchandyHero(blok) {
  console.log('🚀 Rendering Enhanced MuchandyHero with API integration:', blok);

  try {
    // Create enhanced repair form with better callbacks
    const repairForm = PhoneRepairForm({
      service: apiService,
      loadingText: 'Preise werden geladen...',
      errorText: 'Fehler beim Laden der Preise',
      onPriceChange: (priceData) => {
        console.log('💰 Repair price updated:', priceData);
        // You can add custom price display logic here
        if (priceData && priceData.price) {
          console.log(
            `Repair quote: ${priceData.formatted} for ${priceData.message}`
          );
        }
      },
      onScheduleClick: (formData) => {
        console.log('📅 Schedule repair clicked:', formData);
        // Handle scheduling logic here
        alert(
          `Reparatur geplant für ${formData.device || 'Gerät'}: ${formData.action || 'Service'}`
        );
      },
      onError: (error) => {
        console.error('❌ Repair form error:', error);
      },
    });

    // Create enhanced buyback form with better callbacks
    const buybackForm = UsedPhonePriceForm({
      service: apiService,
      loadingText: 'Ankaufspreis wird berechnet...',
      errorText: 'Fehler bei der Preisberechnung',
      onPriceChange: (priceData) => {
        console.log('💰 Buyback price updated:', priceData);
        if (priceData && priceData.price) {
          console.log(
            `Buyback quote: ${priceData.formatted} for ${priceData.message}`
          );
        }
      },
      onSubmit: (formData) => {
        console.log('📝 Buyback form submitted:', formData);
        // Handle buyback submission
        alert(
          `Ankauf angefragt für ${formData.device || 'Gerät'}: ${formData.formatted || 'Preis wird ermittelt'}`
        );
      },
      onError: (error) => {
        console.error('❌ Buyback form error:', error);
      },
    });

    // Create MuchandyHero with enhanced configuration
    const muchandyHero = MuchandyHero({
      backgroundImageUrl: blok.background_image?.filename || '',
      title: blok.title || 'Finden Sie<br>Ihren Preis',
      subtitle: blok.subtitle || 'Jetzt Preis berechnen.',
      defaultTab: blok.default_tab || 'repair',
      showTabLabels: blok.show_tab_labels !== false,
      tabLabels: {
        repair: blok.repair_tab_label || 'Reparatur',
        buyback: blok.buyback_tab_label || 'Ankauf',
      },
      repairForm,
      buybackForm,
      className: blok.className || 'muchandy-hero-enhanced',
      // Enhanced callbacks
      onTabChange: (tabName) => {
        console.log(`📋 Tab changed to: ${tabName}`);
        // Track tab analytics here if needed
      },
      onFormReady: (formType) => {
        console.log(`✅ ${formType} form ready`);
      },
    });

    console.log('✅ Enhanced MuchandyHero created successfully');
    return muchandyHero;
  } catch (error) {
    console.error('❌ Error creating Enhanced MuchandyHero:', error);
    return createFallbackHero(blok);
  }
}

// Standard hero renderer - KISS principle
function renderHero(blok) {
  console.log('🎯 Rendering standard hero:', blok);

  const heroElement = createElement('section', {
    classes: ['svarog-hero'],
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
        classes: ['svarog-hero__title'],
        innerHTML: blok.title, // Allow HTML in title for line breaks
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
        classes: ['svarog-hero__subtitle'],
        text: blok.subtitle,
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
        text: blok.cta_text,
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

// Section renderer - Occam's Razor
function renderSection(blok) {
  console.log('📄 Rendering section:', blok);

  const sectionElement = createElement('section', {
    classes: ['svarog-section'],
    style: {
      padding: 'var(--space-8, 2rem) var(--space-4, 1rem)',
      maxWidth: '1200px',
      margin: '0 auto',
    },
  });

  if (blok.title) {
    sectionElement.appendChild(
      createElement('h2', {
        text: blok.title,
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
        text: blok.subtitle,
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
      classes: ['section-content'],
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

// Card renderer - Economy of Expression
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

// BlogCard renderer
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

// Button renderer with enhanced variants
function renderButton(blok) {
  if (!blok.text) {
    throw new Error('Button component requires text prop');
  }

  // Map Storyblok size values to Svarog UI size values
  const sizeMap = {
    small: 'small',
    medium: 'medium',
    large: 'large',
    sm: 'small',
    md: 'medium',
    lg: 'large',
  };

  return Button({
    text: blok.text,
    variant: blok.variant || 'primary',
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

// Text renderer with rich text support
function renderText(blok) {
  const textElement = createElement('div', {
    classes: ['richtext-content'],
    innerHTML: blok.text || '', // Support rich text HTML
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

// ContactInfo renderer
function renderContactInfo(blok) {
  return ContactInfo({
    phone: blok.phone || '',
    email: blok.email || '',
    address: blok.address || '',
    showMap: blok.show_map || false,
  });
}

// Form renderer with enhanced error handling
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

// Enhanced fallback hero with better styling
function createFallbackHero(blok) {
  console.log('🆘 Creating fallback hero for:', blok);

  const heroElement = createElement('section', {
    classes: ['fallback-hero', 'muchandy-hero-fallback'],
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

  // Title
  const title = createElement('h1', {
    innerHTML: blok.title || 'Muchandy<br>Handy-Service',
    style: {
      fontSize: 'clamp(2rem, 5vw, 4rem)',
      fontWeight: '700',
      marginBottom: '1rem',
      lineHeight: '1.2',
    },
  });

  // Subtitle
  const subtitle = createElement('p', {
    text:
      blok.subtitle ||
      'Professionelle Handy-Reparaturen und faire Ankaufspreise',
    style: {
      fontSize: 'clamp(1rem, 3vw, 1.5rem)',
      marginBottom: '2rem',
      opacity: '0.9',
    },
  });

  // Call to action
  const ctaButton = Button({
    text: 'Jetzt Preis berechnen',
    variant: 'secondary',
    size: 'large',
    onClick: () => {
      console.log('Fallback hero CTA clicked');
      // You could navigate to a specific page or scroll to forms
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

// Main component renderer - KISS principle
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

// Main components renderer with enhanced error handling
export function renderStoryblokComponents(bloks) {
  console.log('=== RENDERING COMPONENTS ===');
  console.log('Components to render:', bloks.length);

  const container = createElement('div', {
    classes: ['storyblok-content'],
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

      // Create enhanced error display
      const errorElement = createElement('div', {
        classes: ['component-error'],
        style: {
          padding: '1.5rem',
          background: 'linear-gradient(135deg, #fee, #fdd)',
          border: '2px solid #dc3545',
          borderRadius: '8px',
          margin: '1rem 0',
          boxShadow: '0 2px 8px rgba(220, 53, 69, 0.1)',
        },
        children: [
          createElement('div', {
            style: {
              display: 'flex',
              alignItems: 'center',
              marginBottom: '0.5rem',
            },
            children: [
              createElement('span', {
                text: '⚠️',
                style: { fontSize: '1.5rem', marginRight: '0.5rem' },
              }),
              createElement('strong', {
                text: `Error in ${blok.component} component`,
                style: { color: '#dc3545', fontSize: '1.1rem' },
              }),
            ],
          }),
          createElement('p', {
            text: error.message,
            style: { margin: '0.5rem 0', color: '#666' },
          }),
          createElement('details', {
            style: { marginTop: '1rem' },
            children: [
              createElement('summary', {
                text: 'Show Technical Details',
                style: { cursor: 'pointer', fontWeight: '600' },
              }),
              createElement('pre', {
                style: {
                  fontSize: '0.8rem',
                  overflow: 'auto',
                  background: '#f8f9fa',
                  padding: '1rem',
                  borderRadius: '4px',
                  marginTop: '0.5rem',
                },
                text: JSON.stringify(blok, null, 2),
              }),
            ],
          }),
        ],
      });

      container.appendChild(errorElement);
    }
  });

  console.log(
    `✅ Component rendering complete: ${successCount} success, ${errorCount} errors`
  );

  // Add summary if there were errors
  if (errorCount > 0) {
    console.warn(
      `⚠️ ${errorCount} components failed to render. Check console for details.`
    );
  }

  return container;
}

// Development helpers
if (import.meta.env.DEV) {
  window.testMuchandyHero = () => {
    console.log('🧪 Testing MuchandyHero component...');
    try {
      const testBlok = {
        component: 'muchandy_hero',
        title: 'Test Hero',
        subtitle: 'Testing API integration',
        default_tab: 'repair',
      };
      const hero = renderMuchandyHero(testBlok);
      console.log('✅ Test hero created:', hero);
      return hero;
    } catch (error) {
      console.error('❌ Test hero failed:', error);
      return null;
    }
  };

  window.testApiService = () => {
    console.log('🧪 Testing API service...');
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

  console.log('🔧 Development helpers available:');
  console.log('  - window.testMuchandyHero()');
  console.log('  - window.testApiService()');
}

console.log(
  '✅ Enhanced StoryblokComponent ready with MuchandyHero and API integration'
);
