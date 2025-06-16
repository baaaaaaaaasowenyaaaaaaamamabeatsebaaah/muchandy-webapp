// src/utils/dynamicLogoLoader.js - Fixed for Muchandy's Storyblok structure
import { storyblok } from '../services/storyblok.js';
import { processStoryblokSvg } from './svgHandler.js';

console.log('=== FIXED DYNAMIC LOGO LOADER ===');

/**
 * Extract logo data from any Storyblok content structure - Maximum Conciseness
 * @param {object} story - Complete Storyblok story
 * @returns {object} Extracted logo information
 */
const extractLogoData = (story) => {
  console.log('=== EXTRACTING LOGOS FROM STORY ===');
  console.log('Story structure:', story);

  if (!story || !story.content) {
    console.warn('No story content available');
    return {};
  }

  const content = story.content;
  console.log('Story content:', content);

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
    console.log('✅ Found logos in direct content fields:', directLogos);
    return directLogos;
  }

  // Strategy 2: Search in body components - Algorithmic Elegance
  if (content.body && Array.isArray(content.body)) {
    console.log('Searching in body components...');

    for (const blok of content.body) {
      console.log('Checking component:', blok.component, blok);

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
          console.log(
            '✅ Found logos in component:',
            blok.component,
            componentLogos
          );
          return componentLogos;
        }
      }

      // Check for any logo-related fields in any component
      const logoFields = Object.keys(blok).filter(
        (key) => key.includes('logo') && blok[key]?.filename
      );

      if (logoFields.length > 0) {
        console.log(
          '✅ Found logo fields in component:',
          blok.component,
          logoFields
        );
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
        console.log(`✅ Found logo at path: ${currentPath}`, value.filename);

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
    console.log('✅ Found logos recursively:', recursiveLogos);
    return recursiveLogos;
  }

  console.warn('⚠️ No logos found in story content');
  console.log('Available fields in content:', Object.keys(content));

  return {};
};

/**
 * Loads logos from Storyblok story content - with better debugging
 * @param {string} storySlug - Story to load logos from
 * @returns {Promise<object>} Logo URLs
 */
export const loadLogosFromStoryblok = async (storySlug = 'home') => {
  console.log(`=== LOADING LOGOS FROM STORYBLOK ===`);
  console.log('Story slug:', storySlug);

  try {
    const story = await storyblok.getStory(storySlug);
    console.log('✅ Story loaded successfully:', story);

    // Extract logo data with detailed logging
    const logoData = extractLogoData(story);
    console.log('Extracted raw logo data:', logoData);

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
      console.log(
        `Main logo processed: ${logoData.main} → ${processedLogos.main}`
      );
    }

    if (logoData.compact) {
      const compactResult = processStoryblokSvg(logoData.compact);
      processedLogos.compact = compactResult.url || logoData.compact;
      console.log(
        `Compact logo processed: ${logoData.compact} → ${processedLogos.compact}`
      );
    }

    console.log('✅ Final processed logos:', processedLogos);
    return processedLogos;
  } catch (error) {
    console.error(`❌ Failed to load logos from story "${storySlug}":`, error);
    throw error;
  }
};

/**
 * Fallback logos with CORRECT space ID - Economy of Expression
 * @returns {object} Fallback logo configuration
 */
const getFallbackLogos = () => {
  console.log('Using fallback logos with correct space ID...');

  // FIXED: Use correct space ID (340558, not 177369)
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

  console.log('=== CREATING LOGO CONFIG ===');
  console.log('Options:', options);

  try {
    // Try to load from Storyblok
    console.log('Attempting to load logos from Storyblok...');
    const logos = await loadLogosFromStoryblok(storySlug);

    // Validate we got at least one logo
    if (!logos.main && !logos.compact) {
      throw new Error('No logos found in Storyblok content');
    }

    console.log('✅ Successfully loaded logos from Storyblok:', logos);
    return logos;
  } catch (error) {
    console.error('❌ Storyblok logo loading failed:', error);

    if (fallbackToHardcoded) {
      console.log('Using hardcoded fallback logos...');
      return getFallbackLogos();
    }

    throw error;
  }
};

/**
 * Debug function to inspect story content structure
 * @param {string} storySlug - Story to inspect
 */
export const debugStoryStructure = async (storySlug = 'home') => {
  console.log('=== DEBUGGING STORY STRUCTURE ===');

  try {
    const story = await storyblok.getStory(storySlug);
    console.log('Story loaded:', story);

    // Show content structure
    console.log('Content keys:', Object.keys(story.content || {}));

    // Show body structure if available
    if (story.content?.body) {
      console.log('Body components:');
      story.content.body.forEach((blok, index) => {
        console.log(`  ${index}: ${blok.component}`, Object.keys(blok));
      });
    }

    // Search for any fields containing 'logo'
    const findLogoFields = (obj, path = '') => {
      const logoFields = [];

      if (obj && typeof obj === 'object') {
        for (const [key, value] of Object.entries(obj)) {
          const currentPath = path ? `${path}.${key}` : key;

          if (key.includes('logo')) {
            logoFields.push({ path: currentPath, value });
          }

          if (typeof value === 'object' && value !== null) {
            logoFields.push(...findLogoFields(value, currentPath));
          }
        }
      }

      return logoFields;
    };

    const logoFields = findLogoFields(story.content);
    console.log('All logo-related fields found:', logoFields);

    return { story, logoFields };
  } catch (error) {
    console.error('Story debugging failed:', error);
    throw error;
  }
};

console.log('✅ Fixed Dynamic Logo Loader Ready');

export default {
  loadLogosFromStoryblok,
  createLogoConfig,
  debugStoryStructure,
  getFallbackLogos,
};
