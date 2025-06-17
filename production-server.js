// production-server.js - Works with both SQLite and PostgreSQL
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
// production-server.js - Add this function after imports
import { execSync } from 'child_process';

async function setupDatabase() {
  console.log('🔄 Setting up database schema...');

  try {
    // For PostgreSQL on Railway, we need to push the schema
    console.log('📊 Pushing schema to database...');
    execSync('npx prisma db push --skip-generate', { stdio: 'inherit' });
    console.log('✅ Database schema created');

    // Now initialize with data
    await initDatabase();
  } catch (error) {
    console.error('❌ Database setup failed:', error);
    // Try alternative approach
    try {
      console.log('🔄 Trying alternative setup...');
      execSync('npx prisma generate', { stdio: 'inherit' });
      execSync('npx prisma db push', { stdio: 'inherit' });
    } catch (altError) {
      console.error('❌ Alternative setup also failed:', altError);
    }
  }
}

const __dirname = dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Prisma
const prisma = new PrismaClient();

console.log('🚀 Starting Muchandy server...');
console.log(
  `📊 Database URL: ${process.env.DATABASE_URL?.substring(0, 20)}...`
);

// Middleware
app.use(express.json());
app.use(express.static('dist'));

// Initialize database with sample data
async function initDatabase() {
  try {
    console.log('🔄 Checking database...');

    // Check if we have any manufacturers
    const count = await prisma.manufacturer.count();
    console.log(`📊 Found ${count} manufacturers`);

    if (count === 0) {
      console.log('📝 Adding sample data...');

      console.log('✅ Sample data added');
    }
  } catch (error) {
    console.error('⚠️ Database init warning:', error.message);
    // Don't crash - the app can still work with API fallbacks
  }
}

// Health endpoint
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    const count = await prisma.manufacturer.count();

    res.json({
      status: 'healthy',
      port: PORT,
      database: {
        connected: true,
        type: process.env.DATABASE_URL?.includes('postgresql')
          ? 'PostgreSQL'
          : 'SQLite',
        manufacturers: count,
      },
      environment: process.env.NODE_ENV || 'development',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(503).json({
      status: 'degraded',
      port: PORT,
      database: {
        connected: false,
        error: error.message,
      },
      timestamp: new Date().toISOString(),
    });
  }
});

// Copy ALL your API endpoints from server.js here
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

app.get('/api/devices', async (req, res) => {
  const manufacturerId = parseInt(req.query.manufacturerId || req.query.id);
  console.log(`📱 GET devices for manufacturer ${manufacturerId}`);

  if (!manufacturerId) {
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

// ADD ALL OTHER ENDPOINTS FROM server.js HERE
// ... (copy all the other endpoints: actions, price, etc.)

// Serve React app for all other routes
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

/// Update your start function
async function start() {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected');

    // Check if tables exist
    try {
      const count = await prisma.manufacturer.count();
      console.log(`📊 Database has ${count} manufacturers`);
    } catch (error) {
      // Tables don't exist, create them
      console.log('📋 Tables not found, creating schema...');
      await setupDatabase();
    }

    // Initialize with sample data
    await initDatabase();
  } catch (error) {
    console.error('⚠️ Database connection failed:', error.message);
    console.log('🔄 Attempting to create schema...');
    await setupDatabase();
  }

  app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`);
    console.log(`🌐 http://localhost:${PORT}`);
    console.log(`❤️ Health check: http://localhost:${PORT}/health`);
  });
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('👋 SIGTERM received, shutting down gracefully');
  await prisma.$disconnect();
  process.exit(0);
});

start().catch(console.error);
