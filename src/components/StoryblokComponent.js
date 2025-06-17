// src/components/StoryblokComponent.js - Fixed with proper data loading
import {
  Button,
  Card,
  BlogCard,
  ContactInfo,
  Form,
  createElement,
  PhoneRepairForm,
  UsedPhonePriceForm,
  MuchandyHero as SvarogMuchandyHero,
} from 'svarog-ui-core';

import { MuchandyComponent } from './MuchandyComponent.js';
import { appState } from '../utils/stateStore.js';
import { serviceCoordinator } from '../utils/serviceCoordinator.js';
import { router } from '../utils/router.js';

console.log('=== FIXED STORYBLOK COMPONENT WITH PROPER DATA LOADING ===');

// Enhanced MuchandyHero with lifecycle management - KISS principle
class EnhancedMuchandyHero extends MuchandyComponent {
  constructor(props = {}) {
    super(props);

    // Hero-specific state
    this.state = {
      manufacturers: [],
      apiReady: false,
      dataLoaded: false,
    };

    // Component references
    this.apiService = null;
    this.repairForm = null;
    this.buybackForm = null;
    this.heroComponent = null;

    console.log('🚀 Enhanced MuchandyHero created');
  }

  // === LIFECYCLE METHODS ===

  // Wait for API service to be ready
  async beforeLoad() {
    console.log('📋 MuchandyHero beforeLoad - waiting for API service...');

    // Wait for API service
    await appState.waitFor('services.api.ready');

    // Get API service instance
    this.apiService = serviceCoordinator.get('api');
    if (!this.apiService) {
      throw new Error('API service not available');
    }

    console.log('✅ API service ready');
  }

  // Load all required data BEFORE rendering - Algorithmic Elegance
  async load() {
    console.log('📊 MuchandyHero load - fetching data...');

    try {
      // Load manufacturers (already cached by API service)
      const manufacturers = await this.apiService.fetchManufacturers();

      // Pre-load actions too
      const actions = await this.apiService.fetchActions();

      // Update state
      this.setState({
        manufacturers,
        apiReady: true,
        dataLoaded: true,
      });

      console.log(
        `✅ Data loaded: ${manufacturers.length} manufacturers, ${actions.length} actions`
      );
    } catch (error) {
      console.error('❌ Failed to load data:', error);

      // Use fallback data
      this.setState({
        manufacturers: this.apiService.getFallbackManufacturers(),
        apiReady: true,
        dataLoaded: true,
      });
    }
  }

  // Prepare forms with loaded data
  async beforeRender() {
    console.log('🎯 MuchandyHero beforeRender - creating forms with data...');

    // Create repair form with loaded data
    this.repairForm = this.createRepairForm();

    // Create buyback form with loaded data
    this.buybackForm = this.createBuybackForm();

    console.log('✅ Forms created with pre-loaded data');
  }

  // Render the hero - Economy of Expression
  render() {
    console.log('🎨 Rendering MuchandyHero');

    // Create Svarog MuchandyHero with prepared forms
    this.heroComponent = SvarogMuchandyHero({
      backgroundImageUrl: this.props.background_image?.filename || '',
      title: this.props.title || 'Finden Sie<br>Ihren Preis',
      subtitle: this.props.subtitle || 'Jetzt Preis berechnen.',
      defaultValue: this.props.default_tab || 'repair',
      repairForm: this.repairForm,
      buybackForm: this.buybackForm,
      className: 'muchandy-hero-enhanced',
    });

    const element = this.heroComponent.getElement();

    // Add data attributes for debugging
    element.setAttribute('data-api-ready', this.state.apiReady);
    element.setAttribute('data-manufacturers', this.state.manufacturers.length);

    return element;
  }

  // Initialize forms after render
  async afterRender() {
    console.log('✨ MuchandyHero afterRender - initializing form data...');

    // Initialize manufacturer dropdowns with data
    await this.initializeFormData();
  }

  // Watch for data updates after mount
  async onMount() {
    console.log('🚀 MuchandyHero mounted');

    // Watch for manufacturer updates
    this.watchState('api.manufacturers', (manufacturers) => {
      if (manufacturers && manufacturers.length > 0) {
        console.log('📝 Manufacturers updated:', manufacturers.length);
        this.updateManufacturerDropdowns(manufacturers);
      }
    });
  }

  // === FORM CREATION ===

  // Create repair form with proper data handling - Maximum Conciseness
  createRepairForm() {
    return PhoneRepairForm({
      service: this.apiService,
      initialManufacturers: this.state.manufacturers,
      onChange: (priceData) => {
        console.log('💰 Repair price updated:', priceData);
        this.emit('repairPriceChange', priceData);
      },
      onSubmit: (formData) => {
        console.log('📅 Schedule repair clicked:', formData);
        if (formData.price) {
          this.handleRepairSubmit(formData);
        }
      },
    });
  }

  // Create buyback form with proper data handling
  createBuybackForm() {
    return UsedPhonePriceForm({
      service: this.apiService,
      initialManufacturers: this.state.manufacturers,
      onChange: (priceData) => {
        console.log('💰 Buyback price updated:', priceData);
        this.emit('buybackPriceChange', priceData);
      },
      onSubmit: (formData) => {
        console.log('📝 Buyback form submitted:', formData);
        if (formData.price) {
          this.handleBuybackSubmit(formData);
        }
      },
    });
  }

  // === DATA INITIALIZATION ===

  // Initialize form dropdowns with pre-loaded data - KISS principle
  async initializeFormData() {
    if (!this.element) return;

    console.log('🔄 Initializing form dropdowns with data...');

    const forms = this.element.querySelectorAll('form');

    for (const form of forms) {
      const manufacturerSelect = form.querySelector(
        'select[name="manufacturer"]'
      );
      if (!manufacturerSelect) continue;

      // Skip if already populated
      if (manufacturerSelect.options.length > 1) {
        console.log('✅ Manufacturer dropdown already populated');
        continue;
      }

      // Populate with pre-loaded data
      this.populateManufacturerDropdown(
        manufacturerSelect,
        this.state.manufacturers
      );

      // Set up cascade loading
      this.setupCascadeLoading(form, manufacturerSelect);
    }

    console.log('✅ Form data initialization complete');
  }

  // Populate manufacturer dropdown - Algorithmic Elegance
  populateManufacturerDropdown(select, manufacturers) {
    // Clear existing options
    select.innerHTML =
      '<option value="" disabled selected>Hersteller auswählen</option>';

    // Add manufacturers
    manufacturers.forEach((mfg) => {
      const option = document.createElement('option');
      option.value = mfg.id;
      option.textContent = mfg.name;
      select.appendChild(option);
    });

    console.log(`✅ Populated ${manufacturers.length} manufacturers`);
  }

  // Setup cascade loading for devices/actions
  setupCascadeLoading(form, manufacturerSelect) {
    manufacturerSelect.addEventListener('change', async (e) => {
      const manufacturerId = e.target.value;
      if (!manufacturerId) return;

      console.log(`🔧 Manufacturer selected: ${manufacturerId}`);

      const deviceSelect = form.querySelector('select[name="device"]');
      if (!deviceSelect) return;

      // Show loading state
      deviceSelect.innerHTML =
        '<option value="" disabled selected>Lade Modelle...</option>';
      deviceSelect.disabled = true;

      try {
        // Fetch devices
        const devices = await this.apiService.fetchDevices(manufacturerId);
        console.log(`📱 Loaded ${devices.length} devices`);

        // Populate devices
        deviceSelect.innerHTML =
          '<option value="" disabled selected>Modell auswählen</option>';
        devices.forEach((device) => {
          const option = document.createElement('option');
          option.value = device.id;
          option.textContent = device.name;
          deviceSelect.appendChild(option);
        });

        deviceSelect.disabled = false;

        // Trigger change event - FIXED: Use window.Event
        deviceSelect.dispatchEvent(
          new window.Event('change', { bubbles: true })
        );
      } catch (error) {
        console.error('❌ Failed to load devices:', error);
        deviceSelect.innerHTML =
          '<option value="" disabled selected>Fehler beim Laden</option>';
      }
    });
  }

  // Update manufacturer dropdowns when data changes
  updateManufacturerDropdowns(manufacturers) {
    if (!this.element) return;

    const selects = this.element.querySelectorAll(
      'select[name="manufacturer"]'
    );
    selects.forEach((select) => {
      const currentValue = select.value;
      this.populateManufacturerDropdown(select, manufacturers);

      // Restore value if still valid
      if (currentValue && manufacturers.find((m) => m.id === currentValue)) {
        select.value = currentValue;
      }
    });
  }

  // === EVENT HANDLERS ===

  handleRepairSubmit(formData) {
    alert(
      `Reparatur für ${formData.device}: ${formData.action} - ${formData.formatted || formData.price + ' €'}`
    );
    // Navigate to booking page or open modal
  }

  handleBuybackSubmit(formData) {
    alert(
      `Ankauf für ${formData.device}: ${formData.formatted || formData.price + ' €'}`
    );
    // Navigate to buyback form or open modal
  }

  // === CLEANUP ===

  async beforeDestroy() {
    console.log('⚠️ MuchandyHero cleanup...');

    if (this.heroComponent?.destroy) {
      this.heroComponent.destroy();
    }
  }
}

// Component factory functions - kept for backward compatibility
function renderMuchandyHero(blok) {
  console.log('🚀 Rendering Enhanced MuchandyHero:', blok);

  const hero = new EnhancedMuchandyHero(blok);

  // Return component API
  return {
    async getElement() {
      return hero.getElement();
    },
    update: (props) => hero.update(props),
    destroy: () => hero.destroy(),
  };
}

// All other component renderers remain unchanged - Economy of Expression
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

// Main component renderer
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
    className: 'storyblok-content',
    style: { width: '100%' },
  });

  let successCount = 0;
  let errorCount = 0;

  bloks.forEach((blok, index) => {
    try {
      const component = renderStoryblokComponent(blok);

      // Handle async components
      if (component.getElement && typeof component.getElement === 'function') {
        const element = component.getElement();

        if (element instanceof Promise) {
          // Create placeholder
          const placeholder = createElement('div', {
            className: 'component-loading',
            style:
              'min-height: 200px; display: flex; align-items: center; justify-content: center;',
            innerHTML: '<span>Loading component...</span>',
          });

          container.appendChild(placeholder);

          // Replace with actual component when ready
          element
            .then((actualElement) => {
              if (placeholder.parentNode) {
                placeholder.parentNode.replaceChild(actualElement, placeholder);
              }
            })
            .catch((error) => {
              console.error(`Failed to load async component:`, error);
              placeholder.innerHTML = `<span style="color: red;">Component failed to load</span>`;
            });
        } else {
          container.appendChild(element);
        }
      } else {
        container.appendChild(component.getElement());
      }

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

// Development helpers
if (import.meta.env.DEV) {
  window.EnhancedMuchandyHero = EnhancedMuchandyHero;

  window.testMuchandyHero = async () => {
    console.log('🧪 Testing Enhanced MuchandyHero...');

    const testBlok = {
      component: 'muchandy_hero',
      title: 'Test Hero',
      subtitle: 'Testing with proper data loading',
      default_tab: 'repair',
    };

    const hero = renderMuchandyHero(testBlok);
    const element = await hero.getElement();

    console.log('✅ Test hero created');
    return { hero, element };
  };

  console.log('🔧 StoryblokComponent development helpers:');
  console.log('  - window.EnhancedMuchandyHero - Hero class');
  console.log('  - window.testMuchandyHero() - Test hero creation');
}

console.log('✅ StoryblokComponent fixed with proper data loading!');
