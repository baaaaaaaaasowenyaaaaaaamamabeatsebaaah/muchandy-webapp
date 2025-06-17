// src/utils/dynamicLogoLoader.js - Clean version with minimal logging
import { storyblok } from '../services/storyblok.js';
import { processStoryblokSvg } from './svgHandler.js';

/**
 * Extract logo data from any Storyblok content structure - Maximum Conciseness
 * @param {object} story - Complete Storyblok story
 * @returns {object} Extracted logo information
 */
const extractLogoData = (story) => {
  if (!story || !story.content) {
    return {};
  }

  const content = story.content;

  // Strategy 1: Direct content fields - KISS principle
  const directLogos = {
    main:
      content.logo?.filename ||
      content.main_logo?.filename ||
      content.logo_url?.filename,
    compact:
      content.compact_logo?.filename ||
      content.icon_logo?.filename ||
      content.compact_logo_url?.filename,
  };

  if (directLogos.main || directLogos.compact) {
    return directLogos;
  }

  // Strategy 2: Search in body components - Algorithmic Elegance
  if (content.body && Array.isArray(content.body)) {
    for (const blok of content.body) {
      // Check for header or hero components with logos
      if (
        ['header', 'hero', 'muchandy_hero', 'site_header'].includes(
          blok.component
        )
      ) {
        const componentLogos = {
          main:
            blok.logo?.filename ||
            blok.main_logo?.filename ||
            blok.site_logo?.filename,
          compact:
            blok.compact_logo?.filename ||
            blok.icon_logo?.filename ||
            blok.icon?.filename,
        };

        if (componentLogos.main || componentLogos.compact) {
          return componentLogos;
        }
      }

      // Check for any logo-related fields in any component
      const logoFields = Object.keys(blok).filter(
        (key) => key.includes('logo') && blok[key]?.filename
      );

      if (logoFields.length > 0) {
        const foundLogos = {};
        logoFields.forEach((field) => {
          if (field.includes('compact') || field.includes('icon')) {
            foundLogos.compact = blok[field].filename;
          } else {
            foundLogos.main = blok[field].filename;
          }
        });
        return foundLogos;
      }
    }
  }

  // Strategy 3: Search anywhere in content recursively - Last resort
  const findLogosRecursively = (obj, path = '') => {
    if (!obj || typeof obj !== 'object') return {};

    const found = {};

    for (const [key, value] of Object.entries(obj)) {
      const currentPath = path ? `${path}.${key}` : key;

      // Check if this is an asset with filename
      if (value?.filename && key.includes('logo')) {
        if (key.includes('compact') || key.includes('icon')) {
          found.compact = value.filename;
        } else {
          found.main = value.filename;
        }
      }

      // Recurse into objects and arrays
      if (typeof value === 'object' && value !== null) {
        const recursiveFound = findLogosRecursively(value, currentPath);
        Object.assign(found, recursiveFound);
      }
    }

    return found;
  };

  const recursiveLogos = findLogosRecursively(content);
  if (recursiveLogos.main || recursiveLogos.compact) {
    return recursiveLogos;
  }

  return {};
};

/**
 * Loads logos from Storyblok story content - with better debugging
 * @param {string} storySlug - Story to load logos from
 * @returns {Promise<object>} Logo URLs
 */
export const loadLogosFromStoryblok = async (storySlug = 'home') => {
  try {
    const story = await storyblok.getStory(storySlug);

    // Extract logo data with detailed logging
    const logoData = extractLogoData(story);

    if (!logoData.main && !logoData.compact) {
      throw new Error(
        `No logos found in story "${storySlug}". Check story content structure.`
      );
    }

    // Process URLs for optimal delivery
    const processedLogos = {};

    if (logoData.main) {
      const mainResult = processStoryblokSvg(logoData.main);
      processedLogos.main = mainResult.url || logoData.main;
    }

    if (logoData.compact) {
      const compactResult = processStoryblokSvg(logoData.compact);
      processedLogos.compact = compactResult.url || logoData.compact;
    }

    return processedLogos;
  } catch (error) {
    console.error(`Failed to load logos from story "${storySlug}":`, error);
    throw error;
  }
};

/**
 * Fallback logos with CORRECT space ID - Economy of Expression
 * @returns {object} Fallback logo configuration
 */
const getFallbackLogos = () => {
  return {
    main: 'https://a.storyblok.com/f/340558/150x150/568478fef6/logo-farbe.svg',
    compact:
      'https://a.storyblok.com/f/340558/150x150/fe8d57c0c5/logo-icon-farbe.svg',
  };
};

/**
 * Create logo configuration with proper error handling - KISS principle
 * @param {object} options - Configuration options
 * @returns {Promise<object>} Logo configuration
 */
export const createLogoConfig = async (options = {}) => {
  const { storySlug = 'home', fallbackToHardcoded = true } = options;

  try {
    // Try to load from Storyblok
    const logos = await loadLogosFromStoryblok(storySlug);

    // Validate we got at least one logo
    if (!logos.main && !logos.compact) {
      throw new Error('No logos found in Storyblok content');
    }

    return logos;
  } catch (error) {
    console.error('Storyblok logo loading failed:', error);

    if (fallbackToHardcoded) {
      return getFallbackLogos();
    }

    throw error;
  }
};

export default {
  loadLogosFromStoryblok,
  createLogoConfig,
  getFallbackLogos,
};
