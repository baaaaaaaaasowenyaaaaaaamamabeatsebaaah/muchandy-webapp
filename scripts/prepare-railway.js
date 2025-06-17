// scripts/prepare-railway.js
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';

console.log('🔄 Preparing Prisma schema for Railway (PostgreSQL)...');

const schemaPath = join(process.cwd(), 'prisma', 'schema.prisma');
let schema = readFileSync(schemaPath, 'utf8');

// Replace SQLite with PostgreSQL
schema = schema.replace('provider = "sqlite"', 'provider = "postgresql"');

// Save modified schema
writeFileSync(schemaPath, schema);

console.log('✅ Schema updated for PostgreSQL');
