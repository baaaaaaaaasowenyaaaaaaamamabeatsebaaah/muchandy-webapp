// src/components/StoryblokComponent.js - Clean & Concise
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

console.log('=== STORYBLOK COMPONENT LOADING ===');

// Single API service instance - Algorithmic Elegance
const apiService = new ApiService();

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

// MuchandyHero renderer - Maximum conciseness
function renderMuchandyHero(blok) {
  console.log('Rendering MuchandyHero:', blok);

  try {
    const repairForm = PhoneRepairForm({
      service: apiService,
      onPriceChange: (price) => console.log('Repair price:', price),
      onScheduleClick: (data) => console.log('Schedule repair:', data),
    });

    const buybackForm = UsedPhonePriceForm({
      service: apiService,
      onPriceChange: (price) => console.log('Buyback price:', price),
      onSubmit: (data) => console.log('Submit buyback:', data),
    });

    return MuchandyHero({
      backgroundImageUrl: blok.background_image?.filename || '',
      title: blok.title || 'Finden Sie<br>Ihren Preis',
      subtitle: blok.subtitle || 'Jetzt Preis berechnen.',
      defaultTab: blok.default_tab || 'repair',
      repairForm,
      buybackForm,
      className: blok.className || '',
    });
  } catch (error) {
    console.error('❌ Error creating MuchandyHero:', error);
    return createFallbackHero(blok);
  }
}

// Standard hero renderer - KISS principle
function renderHero(blok) {
  console.log('Rendering hero:', blok);

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
        text: blok.title,
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
        size: 'lg',
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
  console.log('Rendering section:', blok);

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

// Button renderer
function renderButton(blok) {
  if (!blok.text) {
    throw new Error('Button component requires text prop');
  }

  const sizeMap = { small: 'sm', medium: '', large: 'lg' };

  return Button({
    text: blok.text,
    variant: blok.variant || 'primary',
    size: sizeMap[blok.size] || blok.size || '',
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

// Text renderer
function renderText(blok) {
  const textElement = createElement('div', {
    classes: ['richtext-content'],
    html: blok.text || '',
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

// Form renderer
function renderForm(blok) {
  return Form({
    title: blok.title || '',
    fields: blok.fields || [],
    submitText: blok.submit_text || 'Submit',
    onSubmit: async (data) => {
      console.log('Form submitted:', data);
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

// Fallback hero - minimal
function createFallbackHero(blok) {
  const heroElement = createElement('section', {
    classes: ['fallback-hero'],
    style: {
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem',
      background: blok.background_image?.filename
        ? `url(${blok.background_image.filename})`
        : 'linear-gradient(135deg, #ff6b35, #f7931e)',
      backgroundSize: 'cover',
      color: 'white',
      textAlign: 'center',
    },
    children: [
      createElement('h1', {
        text: blok.title || 'Muchandy Hero',
        style: { fontSize: '3rem', marginBottom: '1rem' },
      }),
      createElement('p', {
        text: blok.subtitle || 'Professionelle Handy-Services',
        style: { fontSize: '1.2rem' },
      }),
    ],
  });

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

// Main components renderer
export function renderStoryblokComponents(bloks) {
  console.log('=== RENDERING COMPONENTS ===');
  console.log('Components to render:', bloks.length);

  const container = createElement('div', {
    classes: ['storyblok-content'],
    style: { width: '100%' },
  });

  bloks.forEach((blok, index) => {
    try {
      const component = renderStoryblokComponent(blok);
      container.appendChild(component.getElement());
      console.log(`✅ Component ${index + 1} (${blok.component}) rendered`);
    } catch (error) {
      console.error(
        `❌ Error rendering component ${index + 1} (${blok.component}):`,
        error
      );

      container.appendChild(
        createElement('div', {
          classes: ['component-error'],
          style: {
            padding: '1rem',
            background: '#fee',
            border: '1px solid red',
            margin: '1rem 0',
            borderRadius: '4px',
          },
          children: [
            createElement('strong', {
              text: `Error rendering ${blok.component}: `,
            }),
            createElement('span', { text: error.message }),
            createElement('details', {
              style: { marginTop: '0.5rem' },
              children: [
                createElement('summary', { text: 'Component Data' }),
                createElement('pre', {
                  style: { fontSize: '0.8rem', overflow: 'auto' },
                  text: JSON.stringify(blok, null, 2),
                }),
              ],
            }),
          ],
        })
      );
    }
  });

  console.log('✅ All components processed');
  return container;
}

console.log('✅ StoryblokComponent ready with MuchandyHero');
