// Pre-build checks for production
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const runChecks = () => {
  console.log('🔍 Running pre-build checks...');
  
  // Check package.json dependencies
  const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));
  console.log(`📦 Svarog UI Core: ${pkg.dependencies['svarog-ui-core']}`);
  console.log(`🎨 Muchandy Theme: ${pkg.dependencies['@svarog-ui/theme-muchandy']}`);
  
  // Check environment
  if (!process.env.VITE_STORYBLOK_TOKEN) {
    console.error('❌ VITE_STORYBLOK_TOKEN not set');
    process.exit(1);
  }
  
  console.log('✅ Pre-build checks passed');
};

runChecks();
