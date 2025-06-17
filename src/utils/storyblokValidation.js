// src/utils/storyblokValidation.js - New validation utilities
/**
 * Storyblok Content Validation Utilities
 * Ensures components receive proper data from Storyblok
 */

export class StoryblokValidationError extends Error {
  constructor(component, field, message) {
    super(`[${component}] Storyblok field '${field}': ${message}`);
    this.component = component;
    this.field = field;
  }
}

/**
 * Validate required Storyblok fields for any component
 */
export function validateStoryblokFields(
  componentName,
  content,
  requiredFields
) {
  const errors = [];

  requiredFields.forEach((field) => {
    const value = getNestedValue(content, field);

    if (value === undefined || value === null || value === '') {
      errors.push(
        new StoryblokValidationError(
          componentName,
          field,
          'is required but missing from Storyblok content'
        )
      );
    }
  });

  if (errors.length > 0) {
    console.error(
      `❌ Storyblok validation failed for ${componentName}:`,
      errors
    );
    throw new Error(
      `Storyblok validation failed: ${errors.map((e) => e.message).join(', ')}`
    );
  }

  console.log(`✅ Storyblok validation passed for ${componentName}`);
}

/**
 * Get nested value from object using dot notation
 */
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => {
    if (current && typeof current === 'object') {
      return current[key];
    }
    return undefined;
  }, obj);
}

/**
 * Validate Storyblok component structure
 */
export function validateStoryblokComponent(content, expectedComponent) {
  if (!content) {
    throw new StoryblokValidationError(
      expectedComponent,
      'content',
      'Story content is null or undefined'
    );
  }

  if (content.component !== expectedComponent) {
    throw new StoryblokValidationError(
      expectedComponent,
      'component',
      `Expected component '${expectedComponent}', got '${content.component}'`
    );
  }
}

/**
 * Component-specific validation schemas
 */
export const STORYBLOK_SCHEMAS = {
  global_header: [
    'site_name',
    'contact_phone',
    'contact_email',
    'contact_location',
    'navigation_items',
  ],
  global_footer: [
    'business_name',
    'contact.phone',
    'contact.email',
    'address.street',
    'address.city',
  ],
  global_seo: ['default_title', 'default_description', 'canonical_base_url'],
  hero: ['title'],
  muchandy_hero: ['title', 'subtitle'],
};
