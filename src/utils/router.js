console.log('=== ROUTER.JS LOADING ===');

class Router {
  constructor() {
    console.log('Creating router instance...');
    this.routes = new Map();
    this.currentPath = '';

    console.log('Adding event listeners...');
    window.addEventListener('popstate', () => {
      console.log('Popstate event fired');
      this.handleRoute();
    });
    window.addEventListener('DOMContentLoaded', () => {
      console.log('DOMContentLoaded event fired');
      this.handleRoute();
    });

    console.log('✅ Router initialized');
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
    }
  }

  getCurrentPath() {
    return this.currentPath;
  }
}

export const router = new Router();
console.log('✅ Router exported');
