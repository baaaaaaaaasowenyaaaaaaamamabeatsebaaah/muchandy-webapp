import {
  Button,
  Card,
  BlogCard,
  ContactInfo,
  Form,
  createElement,
} from 'svarog-ui-core';

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
    classes: 'svarog-hero',
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
    const title = createElement('h1', {
      classes: 'svarog-hero__title',
      text: blok.title,
      style: {
        fontSize: 'clamp(2rem, 5vw, 4rem)',
        fontWeight: '700',
        margin: '0 0 1rem 0',
        lineHeight: '1.2',
      },
    });
    children.push(title);
  }

  if (blok.subtitle) {
    const subtitle = createElement('p', {
      classes: 'svarog-hero__subtitle',
      text: blok.subtitle,
      style: {
        fontSize: 'clamp(1rem, 3vw, 1.5rem)',
        margin: '0 0 2rem 0',
        opacity: '0.9',
        lineHeight: '1.4',
      },
    });
    children.push(subtitle);
  }

  if (blok.cta_text && blok.cta_link?.url) {
    console.log('Creating CTA button with props:', {
      text: blok.cta_text,
      href: blok.cta_link.url,
      variant: 'secondary',
      size: 'lg', // Using correct Svarog size
    });

    try {
      const ctaButton = Button({
        text: blok.cta_text, // Required prop
        href: blok.cta_link.url,
        variant: 'secondary',
        size: 'lg', // Valid Svarog size (not 'large')
        className: 'hero-cta-button',
      });
      children.push(ctaButton.getElement());
      console.log('✅ CTA button created successfully');
    } catch (error) {
      console.error('❌ Error creating CTA button:', error);
      // Add fallback button
      const fallbackButton = createElement('a', {
        attributes: {
          href: blok.cta_link.url,
          class: 'btn btn--secondary btn--lg',
        },
        text: blok.cta_text,
        style: {
          display: 'inline-block',
          padding: '1rem 2rem',
          background: 'var(--color-secondary, #37474F)',
          color: 'white',
          textDecoration: 'none',
          borderRadius: '0.5rem',
          marginTop: '1rem',
        },
      });
      children.push(fallbackButton);
    }
  }

  // Append all children
  children.forEach((child) => heroElement.appendChild(child));

  return {
    getElement: () => heroElement,
    update: () => {},
    destroy: () => heroElement.remove(),
  };
}

function renderSection(blok) {
  console.log('Rendering section:', blok);

  const sectionElement = createElement('section', {
    classes: 'svarog-section',
    style: {
      padding: 'var(--space-8, 2rem) var(--space-4, 1rem)',
      maxWidth: '1200px',
      margin: '0 auto',
    },
  });

  const children = [];

  if (blok.title) {
    const title = createElement('h2', {
      text: blok.title,
      style: {
        fontSize: 'clamp(1.5rem, 4vw, 2.5rem)',
        fontWeight: '700',
        margin: '0 0 1rem 0',
        color: 'var(--color-primary, #FF6B35)',
      },
    });
    children.push(title);
  }

  if (blok.subtitle) {
    const subtitle = createElement('p', {
      text: blok.subtitle,
      style: {
        fontSize: '1.125rem',
        margin: '0 0 2rem 0',
        opacity: '0.8',
      },
    });
    children.push(subtitle);
  }

  // Append header elements
  children.forEach((child) => sectionElement.appendChild(child));

  // Render nested components
  if (blok.content && blok.content.length > 0) {
    console.log('Rendering nested content:', blok.content.length, 'items');

    const contentContainer = createElement('div', {
      classes: 'section-content',
      style: {
        display: 'grid',
        gap: 'var(--space-6, 1.5rem)',
      },
    });

    blok.content.forEach((nestedBlok, index) => {
      console.log(`Rendering nested component ${index}:`, nestedBlok);
      try {
        const nestedComponent = renderStoryblokComponent(nestedBlok);
        if (nestedComponent) {
          contentContainer.appendChild(nestedComponent.getElement());
        }
      } catch (error) {
        console.error(`Error rendering nested component ${index}:`, error);

        // Add error indicator
        const errorElement = createElement('div', {
          classes: 'component-error',
          style: {
            padding: '1rem',
            background: '#fee',
            border: '1px solid red',
            borderRadius: '4px',
          },
          html: `<strong>Error:</strong> ${error.message}`,
        });
        contentContainer.appendChild(errorElement);
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
  console.log('Rendering card with props:', {
    title: blok.title,
    description: blok.description,
    imageUrl: blok.image?.filename,
    alt: blok.image?.alt,
    href: blok.link?.url,
    variant: blok.variant || 'default',
  });

  try {
    return Card({
      title: blok.title || 'Untitled Card', // Ensure title exists
      description: blok.description || '',
      imageUrl: blok.image?.filename,
      alt: blok.image?.alt,
      href: blok.link?.url,
      variant: blok.variant || 'default',
    });
  } catch (error) {
    console.error('Error creating Card:', error);
    throw error;
  }
}

function renderBlogCard(blok) {
  console.log('Rendering blog card with props:', {
    title: blok.title,
    description: blok.description,
    imageUrl: blok.image?.filename,
    alt: blok.image?.alt,
    href: blok.link?.url,
  });

  try {
    return BlogCard({
      title: blok.title || 'Untitled Blog Post',
      description: blok.description || '',
      imageUrl: blok.image?.filename,
      alt: blok.image?.alt,
      href: blok.link?.url,
    });
  } catch (error) {
    console.error('Error creating BlogCard:', error);
    throw error;
  }
}

function renderButton(blok) {
  console.log('Rendering button with props:', {
    text: blok.text,
    href: blok.link?.url,
    target: blok.link?.target,
    variant: blok.variant || 'primary',
    size: blok.size,
  });

  // Map size values to valid Svarog sizes
  let svarogSize = '';
  if (blok.size) {
    switch (blok.size) {
      case 'small':
        svarogSize = 'sm';
        break;
      case 'large':
        svarogSize = 'lg';
        break;
      default:
        svarogSize = blok.size; // Use as-is if already correct
    }
  }

  if (!blok.text) {
    throw new Error('Button component requires text prop');
  }

  try {
    return Button({
      text: blok.text, // Required prop
      href: blok.link?.url,
      variant: blok.variant || 'primary',
      size: svarogSize,
      onClick: blok.onClick,
      className: blok.className,
    });
  } catch (error) {
    console.error('Error creating Button:', error);
    throw error;
  }
}

function renderText(blok) {
  console.log('Rendering text:', blok);

  const textElement = createElement('div', {
    classes: 'richtext-content',
    html: blok.text,
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
  console.log('Rendering contact info with props:', {
    phone: blok.phone,
    email: blok.email,
    address: blok.address,
  });

  try {
    return ContactInfo({
      phone: blok.phone,
      email: blok.email,
      address: blok.address,
    });
  } catch (error) {
    console.error('Error creating ContactInfo:', error);
    throw error;
  }
}

function renderForm(blok) {
  console.log('Rendering form with props:', blok);

  try {
    return Form({
      title: blok.title,
      onSubmit: (data) => {
        console.log('Form submitted:', data);
        // Handle form submission here
      },
    });
  } catch (error) {
    console.error('Error creating Form:', error);
    throw error;
  }
}

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

export function renderStoryblokComponents(bloks) {
  console.log('=== RENDERING COMPONENTS ===');
  console.log('Components to render:', bloks.length);
  console.log(
    'Component types:',
    bloks.map((b) => b.component)
  );

  const container = createElement('div', {
    classes: 'storyblok-content',
    style: {
      width: '100%',
    },
  });

  bloks.forEach((blok, index) => {
    console.log(
      `\n--- Rendering component ${index + 1}/${bloks.length}: ${blok.component} ---`
    );
    try {
      const component = renderStoryblokComponent(blok);
      container.appendChild(component.getElement());
      console.log(
        `✅ Component ${index + 1} (${blok.component}) rendered successfully`
      );
    } catch (error) {
      console.error(
        `❌ Error rendering component ${index + 1} (${blok.component}):`,
        error
      );

      // Add error placeholder using correct createElement
      const errorElement = createElement('div', {
        classes: 'component-error',
        style: {
          padding: '1rem',
          background: '#fee',
          border: '1px solid red',
          margin: '1rem 0',
          borderRadius: '4px',
        },
        html: `
          <strong>Error rendering ${blok.component}:</strong><br>
          ${error.message}<br>
          <details style="margin-top: 0.5rem;">
            <summary>Component Data</summary>
            <pre style="font-size: 0.8rem; overflow: auto;">${JSON.stringify(blok, null, 2)}</pre>
          </details>
        `,
      });
      container.appendChild(errorElement);
    }
  });

  console.log('✅ All components processed');
  return container;
}

console.log('✅ StoryblokComponent ready with correct Svarog UI API');
