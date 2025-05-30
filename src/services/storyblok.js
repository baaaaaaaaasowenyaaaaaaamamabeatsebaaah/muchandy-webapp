import StoryblokClient from 'storyblok-js-client';

console.log('=== STORYBLOK.JS LOADING ===');

class StoryblokService {
  constructor() {
    console.log('Creating Storyblok service...');
    console.log(
      'Storyblok token:',
      import.meta.env.VITE_STORYBLOK_TOKEN ? 'Found' : 'Missing'
    );
    console.log('Storyblok version:', import.meta.env.VITE_STORYBLOK_VERSION);

    this.client = new StoryblokClient({
      accessToken: import.meta.env.VITE_STORYBLOK_TOKEN,
      cache: {
        clear: 'auto',
        type: 'memory',
      },
    });

    this.version = import.meta.env.VITE_STORYBLOK_VERSION || 'published';
    console.log('✅ Storyblok client initialized');
  }

  async getStory(slug) {
    console.log(`=== GETTING STORY: ${slug} ===`);

    if (!import.meta.env.VITE_STORYBLOK_TOKEN) {
      throw new Error('VITE_STORYBLOK_TOKEN not configured in .env file');
    }

    try {
      console.log(`Fetching story "${slug}" with version "${this.version}"`);
      const response = await this.client.get(`cdn/stories/${slug}`, {
        version: this.version,
      });

      console.log('✅ Story response received:', response);
      console.log('Story data:', response.data.story);

      return response.data.story;
    } catch (error) {
      console.error(`❌ Error fetching story "${slug}":`, error);
      console.error('Error details:', error.response?.data || error.message);
      throw error;
    }
  }
}

export const storyblok = new StoryblokService();
console.log('✅ Storyblok service exported');
