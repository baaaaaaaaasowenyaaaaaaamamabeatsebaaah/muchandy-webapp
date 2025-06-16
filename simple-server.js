// simple-server.js - Fixed URL import
import { createServer } from 'http';
import { readFileSync } from 'fs';
import { fileURLToPath, URL } from 'url'; // ← Added URL import
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = 3000;

// Mock API data - Following Svarog conciseness principles
const mockData = {
  '/api/manufacturers': [
    { id: 1, name: 'Apple' },
    { id: 2, name: 'Samsung' },
    { id: 3, name: 'Huawei' },
  ],
  '/api/devices/1': [
    { id: 1, name: 'iPhone 15 Pro Max' },
    { id: 2, name: 'iPhone 15 Pro' },
  ],
  '/api/devices/2': [
    { id: 4, name: 'Galaxy S24 Ultra' },
    { id: 5, name: 'Galaxy S24+' },
  ],
  '/api/devices/3': [{ id: 6, name: 'P60 Pro' }],
  '/api/actions/1': [
    { id: 1, name: 'Display Reparatur' },
    { id: 2, name: 'Akku Tausch' },
    { id: 3, name: 'Kamera Reparatur' },
  ],
  '/api/actions/2': [
    { id: 1, name: 'Display Reparatur' },
    { id: 2, name: 'Akku Tausch' },
  ],
  '/api/actions/3': [
    { id: 1, name: 'Display Reparatur' },
    { id: 2, name: 'Akku Tausch' },
  ],
  '/api/price/1': {
    price: 299,
    currency: '€',
    formatted: '299 €',
    message: 'Display Reparatur',
    actionId: 1,
  },
  '/api/price/2': {
    price: 89,
    currency: '€',
    formatted: '89 €',
    message: 'Akku Tausch',
    actionId: 2,
  },
  '/api/price/3': {
    price: 199,
    currency: '€',
    formatted: '199 €',
    message: 'Kamera Reparatur',
    actionId: 3,
  },
};

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // CORS headers - Economy of Expression
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  console.log(`${req.method} ${url.pathname}`);

  // Handle CORS preflight - KISS principle
  if (req.method === 'OPTIONS') {
    res.writeHead(200);
    res.end();
    return;
  }

  // API routes - Algorithmic Elegance
  if (url.pathname.startsWith('/api/')) {
    const data = mockData[url.pathname];
    if (data) {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify(data));
      return;
    } else {
      res.writeHead(404, { 'Content-Type': 'application/json' });
      res.end(
        JSON.stringify({ error: 'API endpoint not found', path: url.pathname })
      );
      return;
    }
  }

  // Health check - Occam's Razor
  if (url.pathname === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(
      JSON.stringify({
        status: 'ok',
        timestamp: new Date().toISOString(),
        endpoints: Object.keys(mockData),
      })
    );
    return;
  }

  // Static files + SPA fallback
  let filePath = path.join(__dirname, 'dist', url.pathname);

  // Default to index.html for SPA routes
  if (url.pathname === '/' || !path.extname(filePath)) {
    filePath = path.join(__dirname, 'dist', 'index.html');
  }

  try {
    const content = readFileSync(filePath);
    const ext = path.extname(filePath);
    const contentType =
      {
        '.html': 'text/html',
        '.js': 'application/javascript',
        '.css': 'text/css',
        '.json': 'application/json',
        '.png': 'image/png',
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.gif': 'image/gif',
        '.svg': 'image/svg+xml',
      }[ext] || 'text/plain';

    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  } catch (error) {
    // SPA fallback - serve index.html for client-side routing
    try {
      const indexContent = readFileSync(
        path.join(__dirname, 'dist', 'index.html')
      );
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(indexContent);
    } catch (indexError) {
      res.writeHead(404, { 'Content-Type': 'text/plain' });
      res.end('404 - File not found');
    }
  }
});

server.listen(PORT, () => {
  console.log('🚀 Muchandy server running!');
  console.log(`📱 Frontend: http://localhost:${PORT}`);
  console.log(`🔧 API Test: http://localhost:${PORT}/api/manufacturers`);
  console.log(`❤️ Health: http://localhost:${PORT}/health`);
  console.log('');
  console.log('Available API endpoints:');
  Object.keys(mockData).forEach((endpoint) => {
    console.log(`  http://localhost:${PORT}${endpoint}`);
  });
});
