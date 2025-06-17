// scripts/setup-docker-env.js - Docker environment setup helper
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Setup environment for Docker - KISS principle
function setupDockerEnv() {
  console.log('🐳 Setting up Docker environment...');

  // Check if .env exists, if not create from .env.example
  const envPath = join(__dirname, '../.env');
  const envExamplePath = join(__dirname, '../.env.example');

  if (!existsSync(envPath) && existsSync(envExamplePath)) {
    console.log('📋 Creating .env from .env.example...');
    const envContent = readFileSync(envExamplePath, 'utf8');

    // Update for production
    const prodEnv = envContent
      .replace('NODE_ENV=development', 'NODE_ENV=production')
      .replace(
        'DATABASE_URL="file:./dev.db"',
        'DATABASE_URL="file:/app/data/prod.db"'
      )
      .replace('VITE_API_BASE_URL=http://localhost:3000', 'VITE_API_BASE_URL=');

    writeFileSync(envPath, prodEnv);
    console.log('✅ Environment file created');
  }

  // Update Prisma schema for production path
  const schemaPath = join(__dirname, '../prisma/schema.prisma');
  if (existsSync(schemaPath)) {
    let schema = readFileSync(schemaPath, 'utf8');

    // Ensure absolute path for Docker
    if (!schema.includes('file:/app/data/')) {
      console.log('📝 Updating Prisma schema for Docker paths...');
      schema = schema.replace(
        'url      = env("DATABASE_URL")',
        'url      = env("DATABASE_URL") // Docker: file:/app/data/prod.db'
      );
      writeFileSync(schemaPath, schema);
    }
  }

  console.log('✅ Docker environment setup complete');
}

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  setupDockerEnv();
}

export { setupDockerEnv };
