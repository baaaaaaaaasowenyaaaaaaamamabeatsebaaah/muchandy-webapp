// src/utils/svgHandler.js - Simplified for URL processing only
console.log('=== SVG HANDLER LOADING ===');

/**
 * Detects if URL is an SVG - Algorithmic Elegance
 * @param {string} url - Image URL
 * @returns {object} Detection result with type and processed URL
 */
export const detectSvgContent = (url) => {
  if (!url || typeof url !== 'string') {
    return { type: 'none', url: null };
  }

  // Check for SVG file extension or format parameter - Economy of Expression
  if (url.includes('.svg') || url.includes('format=svg')) {
    return { type: 'svg', url };
  }

  // Default to image
  return { type: 'image', url };
};

/**
 * Processes Storyblok URLs for optimal SVG delivery - KISS principle
 * @param {string} storyblokUrl - Original Storyblok URL
 * @returns {object} Processed URL information
 */
export const processStoryblokSvg = (storyblokUrl) => {
  if (!storyblokUrl) {
    console.warn('No URL provided to processStoryblokSvg');
    return { type: 'none', url: null };
  }

  console.log('Processing Storyblok URL:', storyblokUrl);

  // Detect if this is an SVG
  const detection = detectSvgContent(storyblokUrl);

  if (detection.type === 'svg') {
    // Clean up SVG URLs - remove image optimization filters that don't work on SVG
    let cleanUrl = storyblokUrl;

    // Remove dimension filters (e.g., /176x60/)
    cleanUrl = cleanUrl.replace(/\/\d+x\d+\//, '/');

    // Remove quality filters (e.g., filters:quality(90))
    cleanUrl = cleanUrl.replace(/\/filters:[^/]+\//, '/');

    // Convert img2.storyblok.com to a.storyblokstatic.com for direct file access
    if (cleanUrl.includes('img2.storyblok.com')) {
      cleanUrl = cleanUrl.replace(
        'img2.storyblok.com/',
        'a.storyblokstatic.com/'
      );
      // Remove any remaining filter artifacts
      cleanUrl = cleanUrl.replace(/\/+/g, '/').replace('https:/', 'https://');
    }

    console.log('✅ SVG URL cleaned:', {
      original: storyblokUrl,
      cleaned: cleanUrl,
    });
    return { type: 'svg', url: cleanUrl };
  }

  // For non-SVG images, return as-is
  console.log('✅ Non-SVG URL passed through:', storyblokUrl);
  return { type: 'image', url: storyblokUrl };
};

/**
 * Converts PNG/JPG Storyblok URLs to SVG if available - Algorithmic Elegance
 * @param {string} imageUrl - Original image URL
 * @returns {Promise<string>} SVG URL if available, otherwise original URL
 */
export const tryConvertToSvg = async (imageUrl) => {
  if (!imageUrl || !imageUrl.includes('storyblok')) {
    return imageUrl;
  }

  try {
    // Try to convert by changing extension to .svg
    const svgUrl = imageUrl.replace(/\.(png|jpg|jpeg|gif)(\?|$)/, '.svg$2');

    // Test if SVG version exists - simple HEAD request
    const response = await fetch(svgUrl, { method: 'HEAD' });

    if (response.ok) {
      console.log('✅ SVG version found:', svgUrl);
      return processStoryblokSvg(svgUrl).url;
    }
  } catch (error) {
    console.log('ℹ️ No SVG version available for:', imageUrl);
  }

  return imageUrl; // Return original if SVG not available
};

/**
 * Smart logo URL processor - tries SVG first, falls back to original
 * @param {string} logoUrl - Logo URL
 * @returns {Promise<string>} Best available logo URL
 */
export const getOptimalLogoUrl = async (logoUrl) => {
  if (!logoUrl) return null;

  console.log('Getting optimal logo URL for:', logoUrl);

  // If already SVG, just clean it up
  const processed = processStoryblokSvg(logoUrl);
  if (processed.type === 'svg') {
    return processed.url;
  }

  // Try to find SVG version
  const svgUrl = await tryConvertToSvg(logoUrl);
  return svgUrl;
};

/**
 * Batch process multiple logo URLs - Maximum Conciseness
 * @param {object} logoUrls - Object with logo URLs
 * @returns {Promise<object>} Processed logo URLs
 */
export const processLogoUrls = async (logoUrls) => {
  const processed = {};

  for (const [key, url] of Object.entries(logoUrls)) {
    if (url) {
      processed[key] = await getOptimalLogoUrl(url);
      console.log(`✅ ${key} logo processed:`, processed[key]);
    }
  }

  return processed;
};

// Simple synchronous version for immediate use - KISS approach
export const processLogoUrlsSync = (logoUrls) => {
  const processed = {};

  for (const [key, url] of Object.entries(logoUrls)) {
    if (url) {
      processed[key] = processStoryblokSvg(url).url || url;
    }
  }

  return processed;
};

console.log('✅ SVG Handler ready (URL processing only)');

export default {
  detectSvgContent,
  processStoryblokSvg,
  tryConvertToSvg,
  getOptimalLogoUrl,
  processLogoUrls,
  processLogoUrlsSync,
};
