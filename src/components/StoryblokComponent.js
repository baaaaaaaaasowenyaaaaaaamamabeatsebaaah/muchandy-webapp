import {
  Button,
  Card,
  BlogCard,
  ContactInfo,
  Form,
  createElement,
} from 'svarog-ui-core';

import { router } from '../utils/router.js';

console.log('=== STORYBLOK COMPONENT.JS LOADING ===');

const componentMap = {
  hero: renderHero,
  section: renderSection,
  card: renderCard,
  blog_card: renderBlogCard,
  button: renderButton,
  text: renderText,
  contact_info: renderContactInfo,
  form: renderForm,
};

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

      // Fallback link
      children.push(
        createElement('a', {
          attributes: {
            href: blok.cta_link.url,
            target: blok.cta_link.target || '_self',
            class: 'btn btn--secondary btn--lg',
          },
          text: blok.cta_text,
          style: {
            display: 'inline-block',
            padding: '1rem 2rem',
            background: 'var(--button-secondary-bg, #37474F)',
            color: 'var(--button-secondary-color, white)',
            textDecoration: 'none',
            borderRadius: 'var(--button-radius, 0.5rem)',
            marginTop: '1rem',
          },
        })
      );
    }
  }

  children.forEach((child) => heroElement.appendChild(child));

  // Return component-like API
  return {
    getElement: () => heroElement,
    update: () => {},
    destroy: () => heroElement.remove(),
  };
}

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

  // Render nested components
  if (blok.content && blok.content.length > 0) {
    const contentContainer = createElement('div', {
      classes: ['section-content'],
      style: {
        display: 'grid',
        gap: 'var(--space-6, 1.5rem)',
        gridTemplateColumns:
          blok.columns || 'repeat(auto-fit, minmax(300px, 1fr))',
      },
    });

    blok.content.forEach((nestedBlok, index) => {
      try {
        const nestedComponent = renderStoryblokComponent(nestedBlok);
        if (nestedComponent) {
          contentContainer.appendChild(nestedComponent.getElement());
        }
      } catch (error) {
        console.error(`Error rendering nested component ${index}:`, error);

        contentContainer.appendChild(
          createElement('div', {
            classes: ['component-error'],
            style: {
              padding: '1rem',
              background: '#fee',
              border: '1px solid red',
              borderRadius: '4px',
            },
            html: `<strong>Error:</strong> ${error.message}`,
          })
        );
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
  if (!blok.title) {
    console.warn('Card missing required title, using default');
    blok.title = 'Untitled';
  }

  return Card({
    title: blok.title,
    description: blok.description || '',
    imageUrl: blok.image?.filename,
    alt: blok.image?.alt || blok.title,
    href: blok.link?.url,
    variant: blok.variant || 'default',
    onClick: blok.link?.url ? undefined : blok.onClick,
  });
}

function renderBlogCard(blok) {
  if (!blok.title) {
    console.warn('BlogCard missing required title, using default');
    blok.title = 'Untitled Blog Post';
  }

  return BlogCard({
    title: blok.title,
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
  // Validate required props
  if (!blok.text) {
    throw new Error('Button component requires text prop');
  }

  // Map Storyblok sizes to Svarog sizes
  const sizeMap = {
    small: 'sm',
    medium: '',
    large: 'lg',
  };

  return Button({
    text: blok.text,
    variant: blok.variant || 'primary',
    size: sizeMap[blok.size] || blok.size || '',
    disabled: blok.disabled || false,
    className: blok.className,
    onClick: (e) => {
      // Handle link navigation
      if (blok.link?.url) {
        if (blok.link.url.startsWith('http')) {
          window.open(blok.link.url, blok.link.target || '_self');
        } else {
          e.preventDefault();
          router.navigate(blok.link.url);
        }
      }
      // Call custom onClick if provided
      if (blok.onClick) {
        blok.onClick(e);
      }
    },
  });
}

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
      console.log('Form submitted:', data);

      // Handle form submission
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

console.log('✅ StoryblokComponent ready with Svarog UI');
