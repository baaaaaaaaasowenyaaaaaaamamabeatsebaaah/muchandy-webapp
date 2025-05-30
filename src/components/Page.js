import { createElement } from 'svarog-ui-core';
import { renderStoryblokComponents } from './StoryblokComponent.js';
import { storyblok } from '../services/storyblok.js';

console.log('=== PAGE.JS LOADING ===');

const createPage = () => {
  console.log('Creating page instance...');

  let currentStory = null;
  let element = null;

  const render = (story) => {
    console.log('=== RENDERING PAGE ===');
    console.log('Story to render:', story);

    // Use Svarog createElement
    const pageElement = createElement('main', {
      classes: 'page',
      attributes: {
        'data-story': story.slug,
      },
    });
    console.log('✅ Page main element created');

    // Render story content
    if (story.content && story.content.body) {
      console.log(
        'Story has content body:',
        story.content.body.length,
        'components'
      );
      console.log('Story content body:', story.content.body);

      try {
        const contentElement = renderStoryblokComponents(story.content.body);
        console.log('✅ Content rendered:', contentElement);
        pageElement.appendChild(contentElement);
        console.log('✅ Content appended to page');
      } catch (error) {
        console.error('❌ Error rendering story content:', error);

        // Show the error in the page using correct createElement
        const errorElement = createElement('div', {
          classes: 'content-error',
          style: {
            padding: '2rem',
            color: 'red',
            border: '1px solid red',
            margin: '1rem',
          },
          html: `
            <h2>Error Rendering Components</h2>
            <p><strong>Error:</strong> ${error.message}</p>
            <p><strong>Story:</strong> ${story.slug}</p>
            <details>
              <summary>Story Content</summary>
              <pre>${JSON.stringify(story.content.body, null, 2)}</pre>
            </details>
            <details>
              <summary>Stack Trace</summary>
              <pre>${error.stack}</pre>
            </details>
          `,
        });
        pageElement.appendChild(errorElement);
      }
    } else {
      console.warn('⚠️ Story has no content body');
      console.log('Story structure:', story);

      // Show what we got using correct createElement
      const infoElement = createElement('div', {
        classes: 'story-info',
        style: {
          padding: '2rem',
          background: '#f0f0f0',
          margin: '1rem',
        },
        html: `
          <h2>Story Loaded But No Content</h2>
          <p><strong>Story slug:</strong> ${story.slug}</p>
          <p><strong>Story name:</strong> ${story.name}</p>
          <details>
            <summary>Full Story Data</summary>
            <pre>${JSON.stringify(story, null, 2)}</pre>
          </details>
        `,
      });
      pageElement.appendChild(infoElement);
    }

    return pageElement;
  };

  const loadStory = async (slug) => {
    console.log(`=== LOADING STORY: ${slug} ===`);

    try {
      const story = await storyblok.getStory(slug);
      console.log('✅ Story loaded from Storyblok:', story);

      currentStory = story;

      if (element) {
        console.log('Replacing existing element...');
        element.replaceWith(render(story));
      }

      return story;
    } catch (error) {
      console.error(`❌ Failed to load story "${slug}":`, error);
      throw error;
    }
  };

  return {
    getElement() {
      if (currentStory && !element) {
        console.log('Creating element from current story...');
        element = render(currentStory);
      }
      return element || createElement('div', { text: 'No content loaded' });
    },

    async loadStory(slug) {
      const story = await loadStory(slug);
      element = render(story);
      return story;
    },

    getCurrentStory() {
      return currentStory;
    },

    destroy() {
      console.log('Destroying page...');
      element?.remove();
      element = null;
      currentStory = null;
    },
  };
};

console.log('✅ Page factory created');
export default createPage;
