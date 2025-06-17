// src/components/StoryblokContactSection.js
/**
 * @file Storyblok wrapper for ContactSection with service integration
 * @description Handles async initialization and Storyblok data mapping
 */

import { ContactSection } from 'svarog-ui-core';
import { createElement } from '../utils/componentFactory.js';
import { appState } from '../utils/stateStore.js';

console.log('=== STORYBLOK CONTACT SECTION WRAPPER ===');

/**
 * Creates a ContactSection component with Storyblok integration
 * @param {Object} props - Component props from Storyblok
 * @returns {Object} Component API
 */
export function StoryblokContactSection(props = {}) {
  const {
    // Section props from Storyblok
    title = 'Kontakt',
    description = 'Wir freuen uns auf Ihre Nachricht',
    variant,
    background_color,

    // Map configuration from Storyblok
    show_map = true,
    map_position = 'left',
    location_name = 'Unser Standort',
    latitude,
    longitude,
    google_maps_url,

    // Contact info from Storyblok (flat structure)
    company_name,
    street,
    zipcode,
    city,
    phone,
    email,
    opening_hours,

    // Form configuration from Storyblok
    form_title = 'Nachricht senden',
    submit_button_text = 'Absenden',
    show_name_field = true,
    show_email_field = true,
    show_phone_field = false,
    show_subject_field = true,
    show_message_field = true,
    show_privacy_checkbox = true,
    show_newsletter_checkbox = true,
    privacy_policy_url = '/datenschutz',
    privacy_text = 'Ich stimme der Datenschutzerklärung zu',
    newsletter_text = 'Ich möchte den Newsletter erhalten',

    // Layout options
    mobile_layout = 'stack',

    // Custom components
    loadingComponent = createLoadingState,
    errorComponent = createErrorState,

    // Callbacks
    onSubmit,
    onChange,
  } = props;

  // Component state
  let container = null;
  let contactSection = null;
  let isInitialized = false;
  let isDestroyed = false;

  // Create container element
  const createContainer = () => {
    if (!container) {
      container = createElement('div', {
        className: 'storyblok-contact-section-wrapper',
        style: { width: '100%' },
      });
    }
    return container;
  };

  // Default loading state
  function createLoadingState() {
    return createElement('div', {
      className: 'contact-section-loading',
      style: {
        padding: '4rem 2rem',
        textAlign: 'center',
        background: '#f8f9fa',
      },
      innerHTML: `
        <div style="
          width: 50px;
          height: 50px;
          border: 3px solid #ddd;
          border-top-color: #007bff;
          border-radius: 50%;
          margin: 0 auto 20px;
          animation: spin 1s linear infinite;
        "></div>
        <p style="color: #666;">Lade Kontaktbereich...</p>
        <style>
          @keyframes spin { to { transform: rotate(360deg); } }
        </style>
      `,
    });
  }

  // Default error state
  function createErrorState(error) {
    return createElement('div', {
      className: 'contact-section-error',
      style: {
        padding: '2rem',
        background: '#fee',
        border: '1px solid #fcc',
        borderRadius: '4px',
        margin: '1rem 0',
      },
      innerHTML: `
        <h3 style="color: #c00;">Fehler beim Laden</h3>
        <p>${error.message || 'Kontaktbereich konnte nicht geladen werden'}</p>
      `,
    });
  }

  // Initialize component
  const initialize = async () => {
    console.log('🚀 Initializing StoryblokContactSection...');

    if (isDestroyed) return;

    // Show loading state
    const containerEl = createContainer();
    containerEl.innerHTML = '';
    containerEl.appendChild(loadingComponent());

    try {
      // Get Google Maps API key from config
      let apiKey = null;
      if (show_map) {
        // Try to get from environment or config
        apiKey =
          import.meta.env?.VITE_GOOGLE_MAPS_API_KEY ||
          window.mapsConfig?.apiKey ||
          null;
      }

      // Transform Storyblok data to ContactSection props
      const contactSectionProps = {
        // Section props
        title,
        description,
        variant,
        backgroundColor: background_color,

        // Map props
        apiKey,
        latitude: latitude || 48.1351, // Munich default
        longitude: longitude || 11.582,
        locationName: location_name,
        googleMapsUrl: google_maps_url,

        // Contact info - map from Storyblok flat structure
        contactInfo: {
          companyName: company_name || 'Muchandy',
          street: street || 'Sendlinger Str. 7',
          zipcode: zipcode || '80331',
          city: city || 'München',
          phone: phone || '089 / 26949777',
          email: email || 'info@muchandy.de',
          hours: opening_hours || 'Mo-Fr: 10:00-19:00, Sa: 10:00-18:00',
        },

        // Form configuration
        formTitle: form_title,
        submitButtonText: submit_button_text,
        showNameField: show_name_field,
        showEmailField: show_email_field,
        showPhoneField: show_phone_field,
        showSubjectField: show_subject_field,
        showMessageField: show_message_field,
        showPrivacyCheckbox: show_privacy_checkbox,
        showNewsletterCheckbox: show_newsletter_checkbox,
        privacyPolicyUrl: privacy_policy_url,
        privacyText: privacy_text,
        newsletterText: newsletter_text,

        // Layout
        mapPosition: map_position,
        mobileLayout: mobile_layout,

        // Handlers
        onSubmit: handleFormSubmit,
        onChange: onChange,
      };

      // Create ContactSection
      console.log(
        '🔧 Creating ContactSection with props:',
        contactSectionProps
      );
      contactSection = ContactSection(contactSectionProps);

      // Update container
      containerEl.innerHTML = '';
      containerEl.appendChild(contactSection.getElement());

      isInitialized = true;
      console.log('✅ StoryblokContactSection initialized');
    } catch (error) {
      console.error('❌ StoryblokContactSection initialization failed:', error);
      const errorEl = errorComponent(error);
      containerEl.innerHTML = '';
      containerEl.appendChild(errorEl);
    }
  };

  // Handle form submission with API integration
  async function handleFormSubmit(event, data, isValid, formFields) {
    console.log('📤 Contact form submission:', { data, isValid });

    if (!isValid) {
      console.log('❌ Form validation failed');
      return;
    }

    // Check privacy consent
    if (show_privacy_checkbox && !data.privacy) {
      alert('Bitte stimmen Sie der Datenschutzerklärung zu.');
      return;
    }

    try {
      // If custom handler provided, use it
      if (onSubmit) {
        await onSubmit(event, data, isValid, formFields);
        return;
      }

      // Default: Submit to Muchandy API
      const apiService = appState.get('services.api.instance');
      if (apiService) {
        const response = await apiService.post('/api/contact', {
          name: data.name,
          email: data.email,
          phone: data.phone,
          subject: data.subject,
          message: data.message,
          newsletter: data.newsletter || false,
          gdprConsent: data.privacy || false,
          source: 'website-contact-form',
        });

        if (response.success) {
          alert(
            'Vielen Dank für Ihre Nachricht! Wir melden uns schnellstmöglich bei Ihnen.'
          );
          contactSection.resetForm();
        } else {
          throw new Error(response.message || 'Fehler beim Senden');
        }
      } else {
        // Fallback: Log the submission
        console.log('✅ Contact form data:', data);
        alert('Vielen Dank für Ihre Nachricht!');
        contactSection.resetForm();
      }
    } catch (error) {
      console.error('❌ Form submission error:', error);
      alert(
        'Fehler beim Senden der Nachricht. Bitte versuchen Sie es später erneut.'
      );
    }
  }

  // Start initialization immediately
  const initPromise = initialize();

  // Component API
  return {
    getElement() {
      return createContainer();
    },

    update(newProps) {
      if (!contactSection || isDestroyed) return;

      // Map Storyblok props to ContactSection props
      const updates = {};

      if (newProps.title !== undefined) updates.title = newProps.title;
      if (newProps.description !== undefined)
        updates.description = newProps.description;
      if (newProps.map_position !== undefined)
        updates.mapPosition = newProps.map_position;

      // Update contact info if any field changed
      const contactInfoUpdates = {};
      if (newProps.company_name !== undefined)
        contactInfoUpdates.companyName = newProps.company_name;
      if (newProps.street !== undefined)
        contactInfoUpdates.street = newProps.street;
      if (newProps.zipcode !== undefined)
        contactInfoUpdates.zipcode = newProps.zipcode;
      if (newProps.city !== undefined) contactInfoUpdates.city = newProps.city;
      if (newProps.phone !== undefined)
        contactInfoUpdates.phone = newProps.phone;
      if (newProps.email !== undefined)
        contactInfoUpdates.email = newProps.email;
      if (newProps.opening_hours !== undefined)
        contactInfoUpdates.hours = newProps.opening_hours;

      if (Object.keys(contactInfoUpdates).length > 0) {
        contactSection.updateContactInfo(contactInfoUpdates);
      }

      if (Object.keys(updates).length > 0) {
        contactSection.update(updates);
      }
    },

    destroy() {
      console.log('🗑️ Destroying StoryblokContactSection...');
      isDestroyed = true;

      if (contactSection) {
        contactSection.destroy();
        contactSection = null;
      }

      if (container) {
        container.remove();
        container = null;
      }

      isInitialized = false;
    },

    async waitForInitialization() {
      return initPromise;
    },

    isInitialized() {
      return isInitialized;
    },

    // Proxy methods to ContactSection
    getFormData: () => contactSection?.getFormData(),
    validateForm: () => contactSection?.validateForm(),
    resetForm: () => contactSection?.resetForm(),
  };
}

// Export as default
export default StoryblokContactSection;

console.log('✅ StoryblokContactSection wrapper ready');
