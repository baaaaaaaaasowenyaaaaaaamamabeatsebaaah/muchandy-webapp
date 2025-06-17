// src/utils/errorBoundary.js - Error boundary implementation
import { createElement } from 'svarog-ui-core';
import { appState } from './stateStore.js';

console.log('=== ERROR BOUNDARY UTILITIES ===');

// Error types for categorization - KISS principle
export const ErrorType = {
  SERVICE: 'service',
  NETWORK: 'network',
  COMPONENT: 'component',
  VALIDATION: 'validation',
  UNKNOWN: 'unknown',
};

// Error severity levels
export const ErrorSeverity = {
  LOW: 'low', // Can continue without fixing
  MEDIUM: 'medium', // Should fix but can work around
  HIGH: 'high', // Must fix to continue
  CRITICAL: 'critical', // App cannot function
};

// Error boundary wrapper for components - Algorithmic Elegance
export class ErrorBoundary {
  constructor(options = {}) {
    this.name = options.name || 'Unknown';
    this.fallback = options.fallback;
    this.onError = options.onError;
    this.canRecover = options.canRecover !== false;
    this.maxRetries = options.maxRetries || 3;
    this.retryCount = 0;

    console.log(`🛡️ Error boundary created for: ${this.name}`);
  }

  // Wrap a component with error handling - Economy of Expression
  wrap(component) {
    const boundary = this;

    // Create wrapped component
    const wrappedComponent = {
      ...component,

      async getElement() {
        try {
          boundary.retryCount = 0;
          return await component.getElement();
        } catch (error) {
          return boundary.handleError(error, component);
        }
      },

      async update(props) {
        try {
          return await component.update?.(props);
        } catch (error) {
          return boundary.handleError(error, component);
        }
      },

      destroy() {
        try {
          return component.destroy?.();
        } catch (error) {
          console.error(
            `Error destroying component in boundary ${boundary.name}:`,
            error
          );
        }
      },
    };

    return wrappedComponent;
  }

  // Handle component errors - Maximum Conciseness
  async handleError(error, component) {
    console.error(`❌ Error in boundary "${this.name}":`, error);

    // Record error
    this.recordError(error);

    // Call custom error handler
    if (this.onError) {
      try {
        const handled = await this.onError(error, component);
        if (handled) return handled;
      } catch (handlerError) {
        console.error('Error in custom error handler:', handlerError);
      }
    }

    // Try recovery
    if (this.canRecover && this.retryCount < this.maxRetries) {
      this.retryCount++;
      console.log(
        `🔁 Attempting recovery (${this.retryCount}/${this.maxRetries})...`
      );

      // Wait before retry
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 * this.retryCount)
      );

      try {
        return await component.getElement();
      } catch (retryError) {
        console.error('Recovery failed:', retryError);
      }
    }

    // Return fallback or error UI
    return this.fallback ? this.fallback(error) : this.createErrorUI(error);
  }

  // Record error in state
  recordError(error) {
    const errorRecord = {
      boundary: this.name,
      message: error.message,
      stack: error.stack,
      timestamp: Date.now(),
      retryCount: this.retryCount,
    };

    appState.set('errors.boundaries', [
      ...(appState.get('errors.boundaries') || []),
      errorRecord,
    ]);
  }

  // Create default error UI - KISS principle
  createErrorUI(error) {
    return createElement('div', {
      className: 'error-boundary-fallback',
      style: {
        padding: '2rem',
        margin: '1rem',
        background: '#fee',
        border: '1px solid #fcc',
        borderRadius: '8px',
        textAlign: 'center',
      },
      innerHTML: `
        <h3 style="color: #c00; margin: 0 0 1rem 0;">
          ⚠️ Fehler in ${this.name}
        </h3>
        <p style="margin: 0 0 1rem 0; color: #666;">
          ${error.message || 'Ein unerwarteter Fehler ist aufgetreten'}
        </p>
        ${
          this.canRecover
            ? `
          <button onclick="window.location.reload()" style="
            padding: 0.5rem 1rem;
            background: #dc3545;
            color: white;
            border: none;
            border-radius: 4px;
            cursor: pointer;
          ">
            Seite neu laden
          </button>
        `
            : ''
        }
      `,
    });
  }
}

// Global error manager - Algorithmic Elegance
export class ErrorManager {
  constructor() {
    this.handlers = new Map();
    this.errors = [];
    this.setupGlobalHandlers();

    console.log('🛡️ Error Manager initialized');
  }

  // Register error handler for specific error types
  registerHandler(type, handler) {
    if (!this.handlers.has(type)) {
      this.handlers.set(type, []);
    }
    this.handlers.get(type).push(handler);
  }

  // Handle error with appropriate handler
  async handleError(error, context = {}) {
    console.error('🚨 Error Manager handling error:', error);

    // Determine error type
    const errorType = this.classifyError(error);
    const severity = this.assessSeverity(error, errorType);

    // Create error record
    const errorRecord = {
      id: `error-${Date.now()}-${Math.random().toString(36).slice(2)}`,
      type: errorType,
      severity,
      message: error.message,
      stack: error.stack,
      context,
      timestamp: Date.now(),
      handled: false,
    };

    // Store error
    this.errors.push(errorRecord);
    appState.set('errors.recent', this.errors.slice(-10));

    // Try type-specific handlers
    const handlers = this.handlers.get(errorType) || [];
    for (const handler of handlers) {
      try {
        const result = await handler(error, errorRecord);
        if (result) {
          errorRecord.handled = true;
          return result;
        }
      } catch (handlerError) {
        console.error('Error in error handler:', handlerError);
      }
    }

    // Default handling based on severity
    return this.defaultHandling(errorRecord);
  }

  // Classify error type - Economy of Expression
  classifyError(error) {
    if (error.name === 'NetworkError' || error.message.includes('fetch')) {
      return ErrorType.NETWORK;
    }
    if (
      error.message.includes('service') ||
      error.message.includes('Service')
    ) {
      return ErrorType.SERVICE;
    }
    if (
      error.message.includes('component') ||
      error.message.includes('Component')
    ) {
      return ErrorType.COMPONENT;
    }
    if (error.name === 'ValidationError') {
      return ErrorType.VALIDATION;
    }
    return ErrorType.UNKNOWN;
  }

  // Assess error severity
  assessSeverity(error, type) {
    // Network errors are usually medium severity
    if (type === ErrorType.NETWORK) {
      return ErrorSeverity.MEDIUM;
    }

    // Service errors can be critical
    if (type === ErrorType.SERVICE) {
      return error.message.includes('critical')
        ? ErrorSeverity.CRITICAL
        : ErrorSeverity.HIGH;
    }

    // Component errors are usually low severity
    if (type === ErrorType.COMPONENT) {
      return ErrorSeverity.LOW;
    }

    // Default to medium
    return ErrorSeverity.MEDIUM;
  }

  // Default error handling based on severity
  defaultHandling(errorRecord) {
    switch (errorRecord.severity) {
      case ErrorSeverity.CRITICAL:
        console.error('💀 CRITICAL ERROR - App cannot continue');
        this.showCriticalError(errorRecord);
        break;

      case ErrorSeverity.HIGH:
        console.error('🔥 HIGH SEVERITY ERROR - Immediate action needed');
        this.showHighSeverityError(errorRecord);
        break;

      case ErrorSeverity.MEDIUM:
        console.warn('⚠️ MEDIUM SEVERITY ERROR - Should be addressed');
        this.showNotification(errorRecord);
        break;

      case ErrorSeverity.LOW:
        console.log('ℹ️ LOW SEVERITY ERROR - Logged for monitoring');
        break;
    }
  }

  // Show critical error - blocks app
  showCriticalError(errorRecord) {
    document.body.innerHTML = `
      <div style="
        min-height: 100vh;
        display: flex;
        align-items: center;
        justify-content: center;
        background: #dc3545;
        color: white;
        padding: 2rem;
        text-align: center;
      ">
        <div style="max-width: 600px;">
          <h1>🚨 Kritischer Fehler</h1>
          <p>Die Anwendung kann nicht fortfahren.</p>
          <p style="font-family: monospace; background: rgba(0,0,0,0.2); padding: 1rem; border-radius: 4px;">
            ${errorRecord.message}
          </p>
          <button onclick="window.location.reload()" style="
            margin-top: 1rem;
            padding: 0.75rem 2rem;
            background: white;
            color: #dc3545;
            border: none;
            border-radius: 4px;
            font-weight: bold;
            cursor: pointer;
          ">
            Anwendung neu starten
          </button>
        </div>
      </div>
    `;
  }

  // Show high severity error - modal
  showHighSeverityError(errorRecord) {
    const modal = createElement('div', {
      className: 'error-modal',
      style: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        background: 'rgba(0,0,0,0.8)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 10000,
      },
      innerHTML: `
        <div style="
          background: white;
          padding: 2rem;
          border-radius: 8px;
          max-width: 500px;
          text-align: center;
        ">
          <h2 style="color: #dc3545; margin: 0 0 1rem 0;">
            ⚠️ Fehler aufgetreten
          </h2>
          <p style="margin: 0 0 1rem 0;">
            ${errorRecord.message}
          </p>
          <div style="display: flex; gap: 1rem; justify-content: center;">
            <button onclick="this.closest('.error-modal').remove()" style="
              padding: 0.5rem 1rem;
              background: #6c757d;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            ">
              Schließen
            </button>
            <button onclick="window.location.reload()" style="
              padding: 0.5rem 1rem;
              background: #dc3545;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            ">
              Neu laden
            </button>
          </div>
        </div>
      `,
    });

    document.body.appendChild(modal);
  }

  // Show notification for medium errors - Maximum Conciseness
  showNotification(errorRecord) {
    const notification = createElement('div', {
      className: 'error-notification',
      style: {
        position: 'fixed',
        bottom: '20px',
        right: '20px',
        background: '#ffc107',
        color: '#000',
        padding: '1rem',
        borderRadius: '4px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        maxWidth: '300px',
        zIndex: 9999,
      },
      innerHTML: `
        <strong>⚠️ Warnung</strong>
        <p style="margin: 0.5rem 0 0 0; font-size: 0.9rem;">
          ${errorRecord.message}
        </p>
      `,
    });

    document.body.appendChild(notification);

    // Auto-remove after 5 seconds
    setTimeout(() => notification.remove(), 5000);
  }

  // Setup global error handlers
  setupGlobalHandlers() {
    // Already setup in main.js, but we can add more specific handling here
    console.log('✅ Global error handlers configured');
  }

  // Get error statistics
  getStats() {
    const stats = {
      total: this.errors.length,
      byType: {},
      bySeverity: {},
      handled: this.errors.filter((e) => e.handled).length,
      unhandled: this.errors.filter((e) => !e.handled).length,
    };

    // Count by type and severity
    this.errors.forEach((error) => {
      stats.byType[error.type] = (stats.byType[error.type] || 0) + 1;
      stats.bySeverity[error.severity] =
        (stats.bySeverity[error.severity] || 0) + 1;
    });

    return stats;
  }

  // Clear old errors
  clearOldErrors(maxAge = 3600000) {
    // 1 hour default
    const cutoff = Date.now() - maxAge;
    this.errors = this.errors.filter((e) => e.timestamp > cutoff);
    appState.set('errors.recent', this.errors.slice(-10));
  }
}

// Create singleton instance
export const errorManager = new ErrorManager();

// Register default handlers - KISS principle
errorManager.registerHandler(ErrorType.NETWORK, async (error, record) => {
  console.log('🌐 Handling network error...');

  // Check if it's a connection issue
  if (!navigator.onLine) {
    errorManager.showNotification({
      ...record,
      message: 'Keine Internetverbindung. Bitte prüfen Sie Ihre Verbindung.',
    });
    return true;
  }

  // Could implement retry logic here
  return false;
});

errorManager.registerHandler(ErrorType.SERVICE, async (error, record) => {
  console.log('🔧 Handling service error...');

  // Try to restart the service
  const serviceName = error.serviceName || record.context.service;
  if (serviceName) {
    try {
      await serviceCoordinator.reload(serviceName);
      console.log(`✅ Service ${serviceName} reloaded successfully`);
      return true;
    } catch (reloadError) {
      console.error('Failed to reload service:', reloadError);
    }
  }

  return false;
});

// Development helpers
if (import.meta.env.DEV) {
  window.errorManager = errorManager;
  window.ErrorBoundary = ErrorBoundary;

  window.testError = (type = 'network') => {
    const errors = {
      network: new Error('Network request failed'),
      service: new Error('Service initialization failed'),
      component: new Error('Component render failed'),
      critical: new Error('Critical system failure'),
    };

    const error = errors[type] || new Error('Test error');
    error.name = type.charAt(0).toUpperCase() + type.slice(1) + 'Error';

    return errorManager.handleError(error, { test: true });
  };

  window.errorStats = () => {
    console.table(errorManager.getStats());
    console.log('Recent errors:', appState.get('errors.recent'));
  };

  console.log('🔧 Error boundary development helpers:');
  console.log('  - window.errorManager - Error manager instance');
  console.log('  - window.testError(type) - Test error handling');
  console.log('  - window.errorStats() - Show error statistics');
}

console.log('✅ Error boundary utilities ready');
