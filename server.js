// server.js - Fixed static file serving with Express v5
import express from 'express';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = 3000;

console.log('🚀 Express v5 with proper static file serving...');

app.use(express.json());

// WICHTIG: Static files ZUERST, bevor manual routing
app.use(
  express.static('dist', {
    maxAge: '1d',
    setHeaders: (res, path) => {
      // Proper content types for static files
      if (path.endsWith('.css')) {
        res.setHeader('Content-Type', 'text/css');
      } else if (path.endsWith('.js')) {
        res.setHeader('Content-Type', 'application/javascript');
      } else if (path.endsWith('.html')) {
        res.setHeader('Content-Type', 'text/html');
      }
    },
  })
);

console.log('✅ Static file serving configured');

// Mock data
const mockData = {
  manufacturers: [
    { id: 1, name: 'Apple' },
    { id: 2, name: 'Samsung' },
    { id: 3, name: 'Huawei' },
  ],
  devices: {
    1: [
      { id: 1, name: 'iPhone 15 Pro Max' },
      { id: 2, name: 'iPhone 15 Pro' },
    ],
    2: [
      { id: 4, name: 'Galaxy S24 Ultra' },
      { id: 5, name: 'Galaxy S24+' },
    ],
    3: [
      { id: 6, name: 'P60 Pro' },
      { id: 7, name: 'P60' },
    ],
  },
  actions: [
    { id: 1, name: 'Display Reparatur' },
    { id: 2, name: 'Akku Tausch' },
    { id: 3, name: 'Kamera Reparatur' },
  ],
  prices: { 1: 299, 2: 89, 3: 199 },
};

// Helper function to check if request is for a static file
function isStaticFile(url) {
  const staticExtensions = [
    '.css',
    '.js',
    '.png',
    '.jpg',
    '.jpeg',
    '.gif',
    '.svg',
    '.ico',
    '.woff',
    '.woff2',
    '.ttf',
    '.eot',
  ];
  return staticExtensions.some((ext) => url.endsWith(ext));
}

// Manual API routing - only intercept API routes and HTML pages
app.use((req, res, next) => {
  const url = req.url;
  const method = req.method;

  console.log(`${method} ${url}`);

  // Let static files pass through to express.static
  if (isStaticFile(url)) {
    console.log(`Static file request: ${url}`);
    return next();
  }

  // Handle API routes manually
  if (method === 'GET') {
    if (url === '/health') {
      return res.json({
        status: 'ok',
        express: '5.x',
        timestamp: new Date().toISOString(),
      });
    }

    if (url === '/api/manufacturers') {
      return res.json(mockData.manufacturers);
    }

    if (url.startsWith('/api/devices/')) {
      const id = url.split('/')[3]; // /api/devices/1 -> id = 1
      return res.json(mockData.devices[id] || []);
    }

    if (url.startsWith('/api/actions/')) {
      return res.json(mockData.actions);
    }

    if (url.startsWith('/api/price/')) {
      const actionId = url.split('/')[3];
      const price = mockData.prices[actionId];
      if (price) {
        return res.json({
          price,
          currency: '€',
          formatted: `${price} €`,
          message:
            mockData.actions.find((a) => a.id == actionId)?.name || 'Reparatur',
          actionId: parseInt(actionId),
          dateCollected: new Date().toISOString(),
        });
      } else {
        return res.json({
          price: null,
          message: 'Kein Preis verfügbar',
          actionId: parseInt(actionId),
        });
      }
    }

    // 404 for unknown API routes
    if (url.startsWith('/api/')) {
      return res
        .status(404)
        .json({ error: 'API endpoint not found', path: url });
    }

    // SPA fallback - only for HTML pages (not static files)
    console.log(`SPA fallback for: ${url}`);
    const indexPath = path.join(__dirname, 'dist', 'index.html');
    return res.sendFile(indexPath, (err) => {
      if (err) {
        console.error('Error serving index.html:', err);
        res.status(500).send('Error loading page');
      }
    });
  }

  next();
});

console.log('✅ API routing configured');

// Fallback error handler
app.use((err, req, res, _next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

app.listen(PORT, () => {
  console.log('🎉 Muchandy server with proper static files!');
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔧 API: http://localhost:${PORT}/api/manufacturers`);
  console.log(`❤️ Health: http://localhost:${PORT}/health`);
  console.log('');
  console.log('✅ Static files: CSS, JS, images should work now!');
  console.log('✅ SPA routing: Works for HTML pages');
  console.log('✅ API routes: Manual routing without path-to-regexp');

  // Test static file serving
  console.log('');
  console.log('🧪 Test your frontend:');
  console.log('1. Check if CSS loads properly');
  console.log('2. Check if Svarog UI components render');
  console.log('3. Test API calls from browser console:');
  console.log(
    '   fetch("/api/manufacturers").then(r=>r.json()).then(console.log)'
  );
});
