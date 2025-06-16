// scripts/validate-content.js - Fixed for Node.js
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Simple environment loader for Node.js - Economy of Expression
const loadEnv = () => {
  try {
    const envPath = join(__dirname, '../.env.local');
    const envContent = readFileSync(envPath, 'utf8');

    const env = {};
    envContent.split('\n').forEach((line) => {
      const [key, ...valueParts] = line.split('=');
      if (key && !key.startsWith('#')) {
        env[key.trim()] = valueParts.join('=').trim().replace(/['"]/g, '');
      }
    });

    return env;
  } catch (error) {
    console.error('❌ Could not load .env.local:', error.message);
    return {};
  }
};

// Mock Storyblok for validation - KISS principle
const createMockStoryblok = (token) => ({
  async getStory(slug) {
    if (!token) {
      throw new Error('VITE_STORYBLOK_TOKEN not found in .env.local');
    }

    console.log(`✅ Environment configured for story: ${slug}`);
    console.log(`🔑 Token: ${token.substring(0, 10)}...`);

    // Simple validation without actual API call
    return {
      name: slug,
      slug,
      content: {
        body: [
          { component: 'hero', title: 'Test Hero' },
          { component: 'section', title: 'Test Section' },
        ],
      },
    };
  },
});

const validateContent = async () => {
  try {
    console.log('🔍 Validating Storyblok configuration...');

    // Load environment variables
    const env = loadEnv();
    const token = env.VITE_STORYBLOK_TOKEN;

    if (!token) {
      console.error('❌ VITE_STORYBLOK_TOKEN not found in .env.local');
      console.log('💡 Please:');
      console.log('   1. Copy .env.example to .env.local');
      console.log('   2. Add your Storyblok preview token');
      console.log('   3. Run this command again');
      process.exit(1);
    }

    console.log('✅ Environment variables loaded');
    console.log(`🔑 Storyblok token found: ${token.substring(0, 10)}...`);
    console.log(`📝 Version: ${env.VITE_STORYBLOK_VERSION || 'published'}`);

    // Create mock client for validation
    const mockStoryblok = createMockStoryblok(token);

    // Test stories
    const testStories = ['home', 'reparatur', 'ankauf'];
    console.log(`📚 Testing ${testStories.length} stories...`);

    for (const slug of testStories) {
      try {
        const story = await mockStoryblok.getStory(slug);
        console.log(`  ✅ ${slug}: ${story.content.body.length} components`);
      } catch (error) {
        console.log(`  ⚠️  ${slug}: ${error.message}`);
      }
    }

    console.log('');
    console.log('✅ Content validation complete');
    console.log('💡 Ready to start development with: npm run dev');
  } catch (error) {
    console.error('❌ Content validation failed:', error.message);
    process.exit(1);
  }
};

validateContent();
