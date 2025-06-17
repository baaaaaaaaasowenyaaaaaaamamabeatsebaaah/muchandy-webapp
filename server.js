// server.js - Express server with complete read-only database access
import express from 'express';
import { PrismaClient } from '@prisma/client';

const app = express();
const PORT = 3001;
const prisma = new PrismaClient();

console.log('🚀 Starting Express server with complete database access...');

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Database connection test
async function testConnection() {
  try {
    await prisma.$connect();
    const counts = {
      manufacturers: await prisma.manufacturer.count(),
      devices: await prisma.device.count(),
      actions: await prisma.action.count(),
      prices: await prisma.price.count(),
      uniqueManufacturers: await prisma.uniqueManufacturer.count(),
      uniqueDevices: await prisma.uniqueDevice.count(),
    };
    console.log('✅ Database connected!', counts);
    return { connected: true, counts };
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return { connected: false, error: error.message };
  }
}

// =================================
// API ROUTES - Read-Only Database Access
// =================================

// Health check with complete DB status
app.get('/health', async (req, res) => {
  console.log('💚 Health check');
  const dbStatus = await testConnection();

  res.json({
    status: dbStatus.connected ? 'healthy' : 'degraded',
    service: 'muchandy-api',
    port: PORT,
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
});

// Get all manufacturers
app.get('/api/manufacturers', async (req, res) => {
  console.log('🏭 GET manufacturers');

  try {
    const manufacturers = await prisma.manufacturer.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { devices: true },
        },
      },
    });

    console.log(`   Found ${manufacturers.length} manufacturers`);
    res.json(manufacturers);
  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to fetch manufacturers' });
  }
});

// Get all unique manufacturers
app.get('/api/unique-manufacturers', async (req, res) => {
  console.log('🏭 GET unique manufacturers');

  try {
    const uniqueManufacturers = await prisma.uniqueManufacturer.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: { devices: true },
        },
      },
    });

    console.log(`   Found ${uniqueManufacturers.length} unique manufacturers`);
    res.json(uniqueManufacturers);
  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to fetch unique manufacturers' });
  }
});

// Get devices by manufacturer
app.get('/api/devices', async (req, res) => {
  const manufacturerId = parseInt(req.query.manufacturerId || req.query.id);
  console.log(`📱 GET devices for manufacturer ${manufacturerId}`);

  if (!manufacturerId) {
    // Return all devices if no manufacturer specified
    try {
      const devices = await prisma.device.findMany({
        orderBy: { name: 'asc' },
        include: {
          manufacturer: true,
          _count: {
            select: { actions: true },
          },
        },
      });
      console.log(`   Found ${devices.length} total devices`);
      return res.json(devices);
    } catch (error) {
      console.error('❌ Database error:', error);
      return res.status(500).json({ error: 'Failed to fetch devices' });
    }
  }

  try {
    const devices = await prisma.device.findMany({
      where: { manufacturerId },
      orderBy: { name: 'asc' },
      include: {
        manufacturer: true,
        _count: {
          select: { actions: true },
        },
      },
    });

    console.log(`   Found ${devices.length} devices`);
    res.json(devices);
  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to fetch devices' });
  }
});

// Get all unique devices
app.get('/api/unique-devices', async (req, res) => {
  const uniqueManufacturerId = parseInt(req.query.uniqueManufacturerId);
  console.log(
    `📱 GET unique devices${uniqueManufacturerId ? ` for manufacturer ${uniqueManufacturerId}` : ''}`
  );

  try {
    const where = uniqueManufacturerId ? { uniqueManufacturerId } : {};
    const uniqueDevices = await prisma.uniqueDevice.findMany({
      where,
      orderBy: { artikelBezeichnung: 'asc' },
      include: {
        uniqueManufacturer: true,
      },
    });

    console.log(`   Found ${uniqueDevices.length} unique devices`);
    res.json(uniqueDevices);
  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to fetch unique devices' });
  }
});

// Get all actions (unique action names)
app.get('/api/actions', async (req, res) => {
  console.log('🔧 GET unique action names');

  try {
    const actions = await prisma.action.groupBy({
      by: ['name'],
      _count: {
        name: true,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Format with sequential IDs
    const formattedActions = actions.map((action, index) => ({
      id: index + 1,
      name: action.name,
      count: action._count.name,
    }));

    console.log(`   Found ${formattedActions.length} unique actions`);
    res.json(formattedActions);
  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to fetch actions' });
  }
});

// Get actions for specific device
app.get('/api/device/:deviceId/actions', async (req, res) => {
  const deviceId = parseInt(req.params.deviceId);
  console.log(`🔧 GET actions for device ${deviceId}`);

  try {
    const actions = await prisma.action.findMany({
      where: { deviceId },
      include: {
        prices: {
          orderBy: { dateCollected: 'desc' },
          take: 1,
        },
      },
    });

    // Format with latest price
    const formattedActions = actions.map((action) => ({
      id: action.id,
      name: action.name,
      deviceId: action.deviceId,
      latestPrice: action.prices[0]?.price || null,
      priceDate: action.prices[0]?.dateCollected || null,
    }));

    console.log(`   Found ${formattedActions.length} actions`);
    res.json(formattedActions);
  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to fetch device actions' });
  }
});

// Get price by action ID or device/action combination
app.get('/api/price', async (req, res) => {
  const actionId = parseInt(req.query.actionId);
  const deviceId = parseInt(req.query.deviceId);
  const actionName = req.query.actionName;

  console.log(
    `💰 GET price - actionId: ${actionId}, deviceId: ${deviceId}, actionName: ${actionName}`
  );

  try {
    let priceData = null;

    if (actionId) {
      // Get price by specific action ID
      const price = await prisma.price.findFirst({
        where: { actionId },
        orderBy: { dateCollected: 'desc' },
        include: {
          action: {
            include: {
              device: {
                include: { manufacturer: true },
              },
            },
          },
        },
      });

      if (price) {
        priceData = {
          price: price.price,
          currency: 'EUR',
          formatted: `${price.price} €`,
          actionId: price.actionId,
          actionName: price.action.name,
          deviceId: price.action.deviceId,
          deviceName: price.action.device.name,
          manufacturerId: price.action.device.manufacturerId,
          manufacturerName: price.action.device.manufacturer.name,
          dateCollected: price.dateCollected,
        };
      }
    } else if (deviceId && actionName) {
      // Get price by device ID and action name
      const action = await prisma.action.findFirst({
        where: {
          deviceId,
          name: actionName,
        },
        include: {
          prices: {
            orderBy: { dateCollected: 'desc' },
            take: 1,
          },
          device: {
            include: { manufacturer: true },
          },
        },
      });

      if (action && action.prices.length > 0) {
        priceData = {
          price: action.prices[0].price,
          currency: 'EUR',
          formatted: `${action.prices[0].price} €`,
          actionId: action.id,
          actionName: action.name,
          deviceId: action.deviceId,
          deviceName: action.device.name,
          manufacturerId: action.device.manufacturerId,
          manufacturerName: action.device.manufacturer.name,
          dateCollected: action.prices[0].dateCollected,
        };
      }
    }

    if (priceData) {
      console.log(`   Found price: ${priceData.formatted}`);
      res.json(priceData);
    } else {
      res.status(404).json({ error: 'Price not found' });
    }
  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to fetch price' });
  }
});

// Get all prices for a device
app.get('/api/device/:deviceId/prices', async (req, res) => {
  const deviceId = parseInt(req.params.deviceId);
  console.log(`💰 GET all prices for device ${deviceId}`);

  try {
    const prices = await prisma.price.findMany({
      where: {
        action: { deviceId },
      },
      orderBy: { dateCollected: 'desc' },
      include: {
        action: true,
      },
    });

    // Group by action
    const groupedPrices = prices.reduce((acc, price) => {
      const actionName = price.action.name;
      if (!acc[actionName]) {
        acc[actionName] = {
          actionId: price.action.id,
          actionName,
          prices: [],
        };
      }
      acc[actionName].prices.push({
        price: price.price,
        dateCollected: price.dateCollected,
      });
      return acc;
    }, {});

    res.json(Object.values(groupedPrices));
  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to fetch device prices' });
  }
});

// Get price history for an action
app.get('/api/action/:actionId/price-history', async (req, res) => {
  const actionId = parseInt(req.params.actionId);
  console.log(`📈 GET price history for action ${actionId}`);

  try {
    const prices = await prisma.price.findMany({
      where: { actionId },
      orderBy: { dateCollected: 'desc' },
      include: {
        action: {
          include: {
            device: {
              include: { manufacturer: true },
            },
          },
        },
      },
    });

    if (prices.length === 0) {
      return res.status(404).json({ error: 'No price history found' });
    }

    const action = prices[0].action;

    res.json({
      actionId: action.id,
      actionName: action.name,
      deviceName: action.device.name,
      manufacturerName: action.device.manufacturer.name,
      priceHistory: prices.map((p) => ({
        price: p.price,
        dateCollected: p.dateCollected,
      })),
    });
  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to fetch price history' });
  }
});

// Database statistics
app.get('/api/stats', async (req, res) => {
  console.log('📊 GET database statistics');

  try {
    const [
      manufacturerCount,
      deviceCount,
      actionCount,
      priceCount,
      uniqueManufacturerCount,
      uniqueDeviceCount,
      uniqueActionCount,
      latestPrices,
      priceRange,
    ] = await Promise.all([
      prisma.manufacturer.count(),
      prisma.device.count(),
      prisma.action.count(),
      prisma.price.count(),
      prisma.uniqueManufacturer.count(),
      prisma.uniqueDevice.count(),
      prisma.action.groupBy({ by: ['name'] }).then((r) => r.length),
      prisma.price.findMany({
        orderBy: { dateCollected: 'desc' },
        take: 10,
        where: { price: { not: null } },
        include: {
          action: {
            include: {
              device: {
                include: { manufacturer: true },
              },
            },
          },
        },
      }),
      prisma.price.aggregate({
        _min: { price: true },
        _max: { price: true },
        _avg: { price: true },
      }),
    ]);

    res.json({
      counts: {
        manufacturers: manufacturerCount,
        devices: deviceCount,
        actions: actionCount,
        prices: priceCount,
        uniqueManufacturers: uniqueManufacturerCount,
        uniqueDevices: uniqueDeviceCount,
        uniqueActions: uniqueActionCount,
      },
      priceRange: {
        min: priceRange._min.price,
        max: priceRange._max.price,
        avg: Math.round(priceRange._avg.price),
      },
      latestPrices: latestPrices.map((p) => ({
        manufacturer: p.action.device.manufacturer.name,
        device: p.action.device.name,
        action: p.action.name,
        price: p.price,
        date: p.dateCollected,
      })),
    });
  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Failed to fetch statistics' });
  }
});

// Search endpoint
app.get('/api/search', async (req, res) => {
  const query = req.query.q?.toLowerCase();
  console.log(`🔍 Search for: ${query}`);

  if (!query || query.length < 2) {
    return res
      .status(400)
      .json({ error: 'Query must be at least 2 characters' });
  }

  try {
    const [manufacturers, devices, actions] = await Promise.all([
      prisma.manufacturer.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        take: 5,
      }),
      prisma.device.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        include: { manufacturer: true },
        take: 10,
      }),
      prisma.action.findMany({
        where: {
          name: { contains: query, mode: 'insensitive' },
        },
        include: {
          device: { include: { manufacturer: true } },
        },
        take: 10,
        distinct: ['name'],
      }),
    ]);

    res.json({
      manufacturers: manufacturers.map((m) => ({
        id: m.id,
        name: m.name,
        type: 'manufacturer',
      })),
      devices: devices.map((d) => ({
        id: d.id,
        name: d.name,
        manufacturerName: d.manufacturer.name,
        type: 'device',
      })),
      actions: actions.map((a) => ({
        id: a.id,
        name: a.name,
        type: 'action',
      })),
    });
  } catch (error) {
    console.error('❌ Database error:', error);
    res.status(500).json({ error: 'Search failed' });
  }
});

// Debug endpoint
app.get('/api/debug', async (req, res) => {
  console.log('🔍 Debug info');
  const dbStatus = await testConnection();

  res.json({
    server: 'muchandy-api',
    port: PORT,
    database: dbStatus,
    endpoints: {
      health: 'GET /health',
      manufacturers: [
        'GET /api/manufacturers',
        'GET /api/unique-manufacturers',
      ],
      devices: [
        'GET /api/devices',
        'GET /api/devices?manufacturerId={id}',
        'GET /api/unique-devices',
        'GET /api/unique-devices?uniqueManufacturerId={id}',
      ],
      actions: ['GET /api/actions', 'GET /api/device/{deviceId}/actions'],
      prices: [
        'GET /api/price?actionId={id}',
        'GET /api/price?deviceId={id}&actionName={name}',
        'GET /api/device/{deviceId}/prices',
        'GET /api/action/{actionId}/price-history',
      ],
      other: ['GET /api/stats', 'GET /api/search?q={query}', 'GET /api/debug'],
    },
  });
});

// 404 handler
app.use((req, res) => {
  console.log(`❌ 404: ${req.method} ${req.url}`);
  res.status(404).json({
    error: 'Endpoint not found',
    path: req.url,
    method: req.method,
    hint: 'Check /api/debug for available endpoints',
  });
});

// Graceful shutdown
process.on('SIGINT', async () => {
  console.log('\n👋 Shutting down gracefully...');
  await prisma.$disconnect();
  process.exit(0);
});

// Start server
app.listen(PORT, async () => {
  console.log('🎉 Express Server Starting...');
  console.log(`🔧 Server: http://localhost:${PORT}`);
  console.log(`❤️ Health: http://localhost:${PORT}/health`);
  console.log(`📊 Stats: http://localhost:${PORT}/api/stats`);
  console.log(`🔍 Debug: http://localhost:${PORT}/api/debug`);

  // Test database connection
  const dbStatus = await testConnection();
  if (!dbStatus.connected) {
    console.error('⚠️ Server running without database connection!');
  }
});
