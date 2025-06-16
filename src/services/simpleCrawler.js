// src/services/simpleCrawler.js - KISS principle
import { PrismaClient } from '@prisma/client';
import puppeteer from 'puppeteer';

const prisma = new PrismaClient();

export async function crawlPrices() {
  console.log('🕷️ Starting price crawl...');

  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const page = await browser.newPage();
  await page.goto('https://www.smartphonereparatur-muenchen.de/');

  try {
    // Wait for calculator
    await page.waitForSelector('#manufacturer');

    // Get manufacturers - Algorithmic Elegance
    const manufacturers = await page.evaluate(() =>
      Array.from(document.querySelectorAll('#manufacturer option'))
        .filter((opt) => opt.value)
        .map((opt) => ({ value: opt.value, name: opt.textContent.trim() }))
    );

    for (const mfg of manufacturers) {
      // Upsert manufacturer - Economy of Expression
      const manufacturer = await prisma.manufacturer.upsert({
        where: { name: mfg.name },
        update: {},
        create: { name: mfg.name },
      });

      // Select manufacturer and get devices
      await page.select('#manufacturer', mfg.value);
      await page.waitForFunction(
        () => document.querySelector('#device').options.length > 1
      );

      const devices = await page.evaluate(() =>
        Array.from(document.querySelectorAll('#device option'))
          .filter((opt) => opt.value)
          .map((opt) => ({ value: opt.value, name: opt.textContent.trim() }))
      );

      for (const dev of devices) {
        // Upsert device
        const device = await prisma.device.upsert({
          where: {
            name_manufacturerId: {
              name: dev.name,
              manufacturerId: manufacturer.id,
            },
          },
          update: {},
          create: { name: dev.name, manufacturerId: manufacturer.id },
        });

        // Get actions and prices
        await page.select('#device', dev.value);
        await page.waitForFunction(
          () => document.querySelector('#action').options.length > 1
        );

        const actions = await page.evaluate(() =>
          Array.from(document.querySelectorAll('#action option'))
            .filter((opt) => opt.value)
            .map((opt) => ({ value: opt.value, name: opt.textContent.trim() }))
        );

        for (const act of actions) {
          // Upsert action
          const action = await prisma.action.upsert({
            where: { name_deviceId: { name: act.name, deviceId: device.id } },
            update: {},
            create: { name: act.name, deviceId: device.id },
          });

          // Get price
          await page.select('#action', act.value);
          await page.waitForFunction(() =>
            document.querySelector('#final-price')?.textContent.trim()
          );

          const priceText = await page.$eval('#final-price', (el) =>
            el.textContent.trim()
          );
          const price = parseInt(priceText.replace(/\D/g, '')) || null;

          // Save price
          await prisma.price.create({
            data: { actionId: action.id, price, dateCollected: new Date() },
          });

          console.log(`💰 ${mfg.name} ${dev.name} ${act.name}: ${price}€`);
        }

        // Rate limiting - respectful crawling
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }
  } finally {
    await browser.close();
    await prisma.$disconnect();
    console.log('✅ Crawl complete!');
  }
}
