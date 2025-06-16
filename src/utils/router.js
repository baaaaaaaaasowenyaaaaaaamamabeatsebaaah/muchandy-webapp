// src/utils/router.js - Fixed router without race conditions
console.log('=== ROUTER.JS LOADING ===');

class Router {
  constructor() {
    console.log('Creating router instance...');
    this.routes = new Map();
    this.currentPath = '';
    this.initialized = false;

    // Only listen for popstate (back/forward buttons)
    // Let the app control initial routing
    window.addEventListener('popstate', () => {
      console.log('Popstate event fired');
      if (this.initialized) {
        this.handleRoute();
      }
    });

    console.log('✅ Router initialized (waiting for app to start routing)');
  }

  addRoute(path, handler) {
    console.log(`Adding route: ${path}`);
    this.routes.set(path, handler);
  }

  navigate(path) {
    console.log(`Navigating to: ${path}`);
    window.history.pushState({}, '', path);
    this.handleRoute();
  }

  // New method: start routing (called by app when ready)
  start() {
    console.log('Router starting...');
    this.initialized = true;
    this.handleRoute(); // Handle current route
  }

  handleRoute() {
    const path = window.location.pathname;
    console.log(`=== ROUTER HANDLING: ${path} ===`);
    this.currentPath = path;

    console.log('Available routes:', Array.from(this.routes.keys()));

    // Find matching route
    const handler = this.routes.get(path) || this.routes.get('*');

    if (handler) {
      console.log(`✅ Found handler for ${path}`);
      try {
        handler(path);
      } catch (error) {
        console.error(`❌ Error in route handler for ${path}:`, error);
      }
    } else {
      console.error(`❌ No route handler found for ${path}`);
      console.log('Router state:', {
        initialized: this.initialized,
        routeCount: this.routes.size,
        currentPath: this.currentPath,
      });
    }
  }

  getCurrentPath() {
    return this.currentPath;
  }
}

export const router = new Router();
console.log('✅ Router exported');
