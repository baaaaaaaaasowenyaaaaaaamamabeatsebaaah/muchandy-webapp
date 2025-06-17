// src/config/maps.config.js
/**
 * Google Maps configuration
 * For local development, create maps.config.local.js with your API key
 */

export const mapsConfig = {
  apiKey:
    import.meta.env?.VITE_GOOGLE_MAPS_API_KEY ||
    process.env.GOOGLE_MAPS_API_KEY ||
    '',

  // Default location (Muchandy Munich)
  defaultLocation: {
    lat: 48.1351,
    lng: 11.582,
    zoom: 15,
  },

  // Map styling options
  styles: [
    {
      featureType: 'poi.business',
      stylers: [{ visibility: 'off' }],
    },
  ],

  // Marker options
  markerOptions: {
    animation: 'DROP',
  },
};
