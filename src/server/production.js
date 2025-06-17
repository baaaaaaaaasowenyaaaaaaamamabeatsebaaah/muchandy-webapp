// src/server/production.js - Combined server for Railway deployment
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const prisma = new PrismaClient();

// Get port from environment (Railway provides this)
const PORT = process.env.PORT || 3000;

console.log('🚀 Starting combined production server...');

// Middleware
app.use(express.json());

// Serve static files from dist folder
app.use(express.static(join(__dirname, '../../dist')));

// API Routes - copied from server.js
app.get('/health', async (req, res) => {
  const dbStatus = await testConnection();
  res.json({
    status: dbStatus.connected ? 'healthy' : 'degraded',
    service: 'muchandy-api',
    port: PORT,
    database: dbStatus,
    timestamp: new Date().toISOString(),
  });
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
    };
    console.log('✅ Database connected!', counts);
    return { connected: true, counts };
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return { connected: false, error: error.message };
  }
}

// Copy ALL API routes from server.js here
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

// ... ADD ALL OTHER API ROUTES FROM server.js HERE ...

// Catch-all route - serve index.html for client-side routing
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../../dist/index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`✅ Server running on port ${PORT}`);
  console.log(`🌐 URL: http://localhost:${PORT}`);
});
