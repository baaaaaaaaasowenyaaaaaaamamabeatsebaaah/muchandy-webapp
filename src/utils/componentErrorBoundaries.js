// src/utils/componentErrorBoundaries.js - Component-specific error boundaries
import { ErrorBoundary } from './errorBoundary.js';
import { createElement } from 'svarog-ui-core';

console.log('=== COMPONENT ERROR BOUNDARIES ===');

// Page error boundary - Economy of Expression
export const pageErrorBoundary = new ErrorBoundary({
  name: 'Page',
  canRecover: true,
  maxRetries: 2,

  fallback: (error) => {
    return createElement('div', {
      className: 'page-error',
      style: {
        minHeight: '50vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        textAlign: 'center',
      },
      innerHTML: `
        <h1 style="color: #dc3545; margin: 0 0 1rem 0;">
          Seite konnte nicht geladen werden
        </h1>
        <p style="color: #666; margin: 0 0 2rem 0;">
          ${error.message || 'Ein Fehler ist beim Laden der Seite aufgetreten.'}
        </p>
        <button onclick="window.location.reload()" style="
          padding: 0.75rem 2rem;
          background: #007bff;
          color: white;
          border: none;
          border-radius: 4px;
          cursor: pointer;
          font-size: 1rem;
        ">
          Seite neu laden
        </button>
      `,
    });
  },

  onError: async (error, _component) => {
    console.error('Page error:', error);

    // If it's a 404, show not found page
    if (error.status === 404) {
      return createElement('div', {
        className: 'page-not-found',
        style: {
          minHeight: '50vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
        },
        innerHTML: `
          <h1 style="font-size: 4rem; margin: 0;">404</h1>
          <p style="font-size: 1.5rem; margin: 1rem 0;">
            Seite nicht gefunden
          </p>
          <a href="/" style="
            color: #007bff;
            text-decoration: none;
            font-size: 1.1rem;
          ">
            Zurück zur Startseite
          </a>
        `,
      });
    }

    return null;
  },
});

// MuchandyHero error boundary - KISS principle
export const heroErrorBoundary = new ErrorBoundary({
  name: 'MuchandyHero',
  canRecover: true,
  maxRetries: 1,

  fallback: (_error) => {
    return createElement('div', {
      className: 'hero-error',
      style: {
        minHeight: '400px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(135deg, #ff7f50, #ffa07a)',
        color: 'white',
        textAlign: 'center',
        padding: '2rem',
      },
      innerHTML: `
        <div>
          <h1 style="margin: 0 0 1rem 0;">
            Preisrechner momentan nicht verfügbar
          </h1>
          <p style="margin: 0 0 2rem 0; opacity: 0.9;">
            Bitte versuchen Sie es später erneut oder kontaktieren Sie uns direkt.
          </p>
          <a href="tel:08926949777" style="
            display: inline-block;
            padding: 0.75rem 2rem;
            background: white;
            color: #ff7f50;
            text-decoration: none;
            border-radius: 4px;
            font-weight: bold;
          ">
            Jetzt anrufen: 089 / 26949777
          </a>
        </div>
      `,
    });
  },
});

// Service error boundary
export const serviceErrorBoundary = new ErrorBoundary({
  name: 'Service',
  canRecover: true,
  maxRetries: 3,

  onError: async (error, service) => {
    console.error('Service error:', error);

    // Try to use fallback data
    if (service.getFallbackData) {
      console.log('Using fallback data for service');
      return service.getFallbackData();
    }

    return null;
  },
});

// Wrap component with error boundary - Algorithmic Elegance
export function withErrorBoundary(component, boundary) {
  return boundary.wrap(component);
}

console.log('✅ Component error boundaries ready');
