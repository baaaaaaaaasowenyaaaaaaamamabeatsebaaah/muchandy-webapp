// server.js - Express 5.x compatible with careful route syntax
import express from 'express';

const app = express();
const PORT = 3001;

console.log('🚀 Starting Express 5.x compatible server...');

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Mock data
const mockData = {
  manufacturers: [
    { id: 1, name: 'Apple' },
    { id: 2, name: 'Samsung' },
    { id: 3, name: 'Huawei' },
    { id: 4, name: 'Google' },
    { id: 5, name: 'OnePlus' },
  ],
  devices: {
    1: [
      { id: 1, name: 'iPhone 15 Pro Max', manufacturerId: 1 },
      { id: 2, name: 'iPhone 15 Pro', manufacturerId: 1 },
      { id: 3, name: 'iPhone 15', manufacturerId: 1 },
    ],
    2: [
      { id: 4, name: 'Galaxy S24 Ultra', manufacturerId: 2 },
      { id: 5, name: 'Galaxy S24+', manufacturerId: 2 },
    ],
    3: [
      { id: 7, name: 'P60 Pro', manufacturerId: 3 },
      { id: 8, name: 'P60', manufacturerId: 3 },
    ],
    4: [{ id: 9, name: 'Pixel 8 Pro', manufacturerId: 4 }],
    5: [{ id: 15, name: 'OnePlus 12', manufacturerId: 5 }],
  },
  actions: [
    { id: 1, name: 'Display Reparatur', basePrice: 299 },
    { id: 2, name: 'Akku Tausch', basePrice: 89 },
    { id: 3, name: 'Kamera Reparatur', basePrice: 199 },
    { id: 4, name: 'Ladebuchse Reparatur', basePrice: 129 },
  ],
};

// Price calculation
function calculatePrice(deviceId, actionId) {
  const action = mockData.actions.find((a) => a.id == actionId);
  if (!action) return null;

  const multipliers = { 1: 1.2, 2: 1.15, 3: 1.1, 4: 1.3, 5: 1.2 };
  const multiplier = multipliers[deviceId] || 1.0;
  const finalPrice = Math.round(action.basePrice * multiplier);

  return {
    price: finalPrice,
    currency: '€',
    formatted: `${finalPrice} €`,
    message: action.name,
    actionId: parseInt(actionId),
    deviceId: parseInt(deviceId),
    basePrice: action.basePrice,
    multiplier: multiplier,
    dateCollected: new Date().toISOString(),
    estimatedTime: action.id === 1 ? '30-60 Min' : '20-30 Min',
  };
}

// =================================
// EXPRESS 5.x SAFE ROUTES
// =================================

// Health check - simple route
app.get('/health', (req, res) => {
  console.log('💚 Health check');
  res.json({
    status: 'ok',
    service: 'muchandy-api',
    port: PORT,
    express: '5.x',
    timestamp: new Date().toISOString(),
  });
});

// Manufacturers - simple route
app.get('/api/manufacturers', (req, res) => {
  console.log('🏭 GET manufacturers');
  res.json(mockData.manufacturers);
});

// Actions - simple route
app.get('/api/actions', (req, res) => {
  console.log('🔧 GET actions');
  res.json(mockData.actions);
});

// Devices - using query parameter to avoid route parameter issues
app.get('/api/devices', (req, res) => {
  const manufacturerId = req.query.manufacturerId || req.query.id;
  console.log(`📱 GET devices for manufacturer ${manufacturerId}`);

  if (!manufacturerId) {
    return res.status(400).json({
      error: 'Missing manufacturerId parameter',
      usage: '/api/devices?manufacturerId=1',
    });
  }

  const devices = mockData.devices[manufacturerId] || [];
  console.log(`   Found ${devices.length} devices`);
  res.json(devices);
});

// Price - using query parameters to avoid route parameter issues
app.get('/api/price', (req, res) => {
  const actionId = req.query.actionId;
  const deviceId = req.query.deviceId;

  console.log(`💰 GET price for action ${actionId}, device ${deviceId}`);

  if (!actionId) {
    return res.status(400).json({
      error: 'Missing actionId parameter',
      usage: '/api/price?actionId=1&deviceId=1',
    });
  }

  if (deviceId) {
    const priceData = calculatePrice(deviceId, actionId);
    if (priceData) {
      console.log(`   Price: ${priceData.formatted}`);
      res.json(priceData);
    } else {
      res.status(404).json({ error: 'Price calculation failed' });
    }
  } else {
    const action = mockData.actions.find((a) => a.id == actionId);
    if (action) {
      res.json({
        price: action.basePrice,
        currency: '€',
        formatted: `${action.basePrice} €`,
        message: action.name,
        actionId: parseInt(actionId),
        dateCollected: new Date().toISOString(),
      });
    } else {
      res.status(404).json({ error: 'Action not found' });
    }
  }
});

// Debug endpoint
app.get('/api/debug', (req, res) => {
  console.log('🔍 Debug info');
  res.json({
    server: 'muchandy-api',
    express: '5.x',
    port: PORT,
    pathToRegexp: '8.2.0',
    compatibility: 'query-parameters',
    manufacturers: mockData.manufacturers.length,
    devices: Object.values(mockData.devices).flat().length,
    actions: mockData.actions.length,
    samplePrice: calculatePrice(1, 1),
    endpoints: [
      'GET /health',
      'GET /api/manufacturers',
      'GET /api/devices?manufacturerId={id}',
      'GET /api/actions',
      'GET /api/price?actionId={id}&deviceId={id}',
      'GET /api/debug',
    ],
    testCommands: [
      'curl http://localhost:3001/health',
      'curl http://localhost:3001/api/manufacturers',
      'curl "http://localhost:3001/api/devices?manufacturerId=1"',
      'curl "http://localhost:3001/api/price?actionId=1&deviceId=1"',
    ],
  });
});

// 404 handler - simple route
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.url,
    method: req.method,
    availableEndpoints: [
      '/health',
      '/api/manufacturers',
      '/api/devices?manufacturerId={id}',
      '/api/actions',
      '/api/price?actionId={id}&deviceId={id}',
      '/api/debug',
    ],
  });
});

// Start server
app.listen(PORT, () => {
  console.log('🎉 Express 5.x Server Started Successfully!');
  console.log(`🔧 Server: http://localhost:${PORT}`);
  console.log(`❤️ Health: http://localhost:${PORT}/health`);
  console.log(`🔍 Debug: http://localhost:${PORT}/api/debug`);
  console.log('');
  console.log('✅ Express 5.x + path-to-regexp 8.x compatible');
  console.log('✅ Using query parameters instead of route parameters');
  console.log('');
  console.log('🧪 Test commands:');
  console.log(`   curl http://localhost:${PORT}/health`);
  console.log(`   curl http://localhost:${PORT}/api/manufacturers`);
  console.log(
    `   curl "http://localhost:${PORT}/api/devices?manufacturerId=1"`
  );
  console.log(
    `   curl "http://localhost:${PORT}/api/price?actionId=1&deviceId=1"`
  );
});
