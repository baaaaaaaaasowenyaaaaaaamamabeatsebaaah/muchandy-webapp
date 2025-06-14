import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';

export default [
  js.configs.recommended,
  {
    languageOptions: {
      ecmaVersion: 2024,
      sourceType: 'module',
      globals: {
        // Browser
        window: 'readonly',
        document: 'readonly',
        console: 'readonly',
        fetch: 'readonly',
        alert: 'readonly',
        getComputedStyle: 'readonly',
        setTimeout: 'readonly',
        clearTimeout: 'readonly',

        // Node.js (for config files)
        process: 'readonly',
        __dirname: 'readonly',
        __filename: 'readonly',
      },
    },

    plugins: {
      prettier,
    },

    rules: {
      // Prettier integration
      'prettier/prettier': 'error',

      // Essential rules
      'no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      'no-console': ['warn', { allow: ['warn', 'error'] }],
      'no-var': 'error',
      'prefer-const': 'error',

      // Disable formatting rules (handled by Prettier)
      quotes: 'off',
      semi: 'off',
      indent: 'off',
      'comma-dangle': 'off',
    },
  },

  // Allow console.log in development files
  {
    files: ['src/**/*.js', 'test-*.js'],
    rules: {
      'no-console': 'off',
    },
  },

  // Ignore build outputs
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
];
