// scripts/railway-setup.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function setup() {
  console.log('🚀 Railway Database Setup');

  try {
    // Test connection
    await prisma.$connect();
    console.log('✅ Connected to database');

    // Create initial data
    console.log('📝 Creating initial manufacturers...');

    const manufacturers = [
      'Apple',
      'Samsung',
      'Google',
      'OnePlus',
      'Xiaomi',
      'Huawei',
      'Sony',
      'LG',
      'Motorola',
      'Nokia',
    ];

    for (const name of manufacturers) {
      await prisma.manufacturer.upsert({
        where: { name },
        update: {},
        create: { name },
      });
    }

    // Add some devices for Apple
    const apple = await prisma.manufacturer.findUnique({
      where: { name: 'Apple' },
    });

    if (apple) {
      const devices = [
        'iPhone 15 Pro Max',
        'iPhone 15 Pro',
        'iPhone 15',
        'iPhone 14',
        'iPhone 13',
        'iPhone 12',
      ];

      for (const deviceName of devices) {
        await prisma.device.upsert({
          where: {
            name_manufacturerId: {
              name: deviceName,
              manufacturerId: apple.id,
            },
          },
          update: {},
          create: {
            name: deviceName,
            manufacturerId: apple.id,
          },
        });
      }

      // Add actions for first device
      const device = await prisma.device.findFirst({
        where: { manufacturerId: apple.id },
      });

      if (device) {
        const actions = [
          'Displayreparatur',
          'Akkutausch',
          'Kamerareparatur',
          'Ladebuchse',
          'Wasserschaden',
          'Backcover',
        ];

        for (const actionName of actions) {
          const action = await prisma.action.upsert({
            where: {
              name_deviceId: {
                name: actionName,
                deviceId: device.id,
              },
            },
            update: {},
            create: {
              name: actionName,
              deviceId: device.id,
            },
          });

          // Add a sample price
          await prisma.price.create({
            data: {
              actionId: action.id,
              price: Math.floor(Math.random() * 200) + 50,
              dateCollected: new Date(),
            },
          });
        }
      }
    }

    // Show summary
    const summary = {
      manufacturers: await prisma.manufacturer.count(),
      devices: await prisma.device.count(),
      actions: await prisma.action.count(),
      prices: await prisma.price.count(),
    };

    console.log('✅ Setup complete!', summary);
  } catch (error) {
    console.error('❌ Setup failed:', error);
  } finally {
    await prisma.$disconnect();
  }
}

setup();
